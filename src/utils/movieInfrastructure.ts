/**
 * Movie Infrastructure Initialization and Management
 * Provides a unified interface for movie database and rating system
 */

import { movieDatabase, MovieDatabase } from './movieDatabase';
import { ratingSystem, RatingSystem } from './ratingSystem';

export interface MovieInfrastructureStatus {
  databaseLoaded: boolean;
  ratingSystemInitialized: boolean;
  totalMovies: number;
  totalRatings: number;
  error?: string;
}

export class MovieInfrastructure {
  private static instance: MovieInfrastructure;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor(
    private database: MovieDatabase = movieDatabase,
    private ratings: RatingSystem = ratingSystem
  ) {}

  /**
   * Get singleton instance
   */
  static getInstance(): MovieInfrastructure {
    if (!MovieInfrastructure.instance) {
      MovieInfrastructure.instance = new MovieInfrastructure();
    }
    return MovieInfrastructure.instance;
  }

  /**
   * Initialize both movie database and rating system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      // Initialize both systems in parallel
      await Promise.all([
        this.database.loadDatabase(),
        this.ratings.initialize()
      ]);

      this.initialized = true;
      console.log('Movie infrastructure initialized successfully');
    } catch (error) {
      console.error('Failed to initialize movie infrastructure:', error);
      throw error;
    }
  }

  /**
   * Get initialization status
   */
  getStatus(): MovieInfrastructureStatus {
    try {
      return {
        databaseLoaded: this.initialized,
        ratingSystemInitialized: this.initialized,
        totalMovies: this.database.getAllMovies().length,
        totalRatings: this.ratings.getAllRatings().length
      };
    } catch (error) {
      return {
        databaseLoaded: false,
        ratingSystemInitialized: false,
        totalMovies: 0,
        totalRatings: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get movie database instance
   */
  getDatabase(): MovieDatabase {
    return this.database;
  }

  /**
   * Get rating system instance
   */
  getRatingSystem(): RatingSystem {
    return this.ratings;
  }

  /**
   * Check if infrastructure is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Reset infrastructure (for testing)
   */
  reset(): void {
    this.initialized = false;
    this.initializationPromise = null;
    this.ratings.clearAllData();
  }
}

// Export singleton instance
export const movieInfrastructure = MovieInfrastructure.getInstance();

// Export individual systems for direct access
export { movieDatabase, ratingSystem };