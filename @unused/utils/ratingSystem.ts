/**
 * User Rating System with localStorage persistence
 * Handles rating validation, normalization, and persistence
 */

import { UserRating, GenrePreferences, Movie } from './movieDatabase';

export interface RatingValidationResult {
  isValid: boolean;
  normalizedRating?: number;
  error?: string;
}

export interface UserProfile {
  ratings: Map<number, UserRating>;
  preferences: GenrePreferences;
  totalRatings: number;
  averageRating: number;
  lastUpdated: number;
}

export class RatingSystem {
  private static readonly STORAGE_KEY = 'movieRatings';
  private static readonly PREFERENCES_KEY = 'genrePreferences';
  private static readonly MIN_RATING = 1;
  private static readonly MAX_RATING = 5;
  
  private userRatings: Map<number, UserRating> = new Map();
  private genrePreferences: GenrePreferences = {};
  private initialized = false;

  /**
   * Initialize the rating system by loading from localStorage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.loadRatingsFromStorage();
      this.loadPreferencesFromStorage();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing rating system:', error);
      // Continue with empty state if loading fails
      this.initialized = true;
    }
  }

  /**
   * Validate and normalize a rating value
   */
  validateRating(rating: number): RatingValidationResult {
    // Check if rating is a number
    if (typeof rating !== 'number' || isNaN(rating)) {
      return {
        isValid: false,
        error: 'Rating must be a valid number'
      };
    }

    // Check range
    if (rating < RatingSystem.MIN_RATING || rating > RatingSystem.MAX_RATING) {
      return {
        isValid: false,
        error: `Rating must be between ${RatingSystem.MIN_RATING} and ${RatingSystem.MAX_RATING}`
      };
    }

    // Normalize to one decimal place
    const normalizedRating = Math.round(rating * 10) / 10;

    return {
      isValid: true,
      normalizedRating
    };
  }

  /**
   * Add or update a user rating
   */
  addRating(movieId: number, rating: number, movie?: Movie): boolean {
    const validation = this.validateRating(rating);
    if (!validation.isValid) {
      console.error('Invalid rating:', validation.error);
      return false;
    }

    const userRating: UserRating = {
      movieId,
      rating: validation.normalizedRating!,
      timestamp: Date.now()
    };

    this.userRatings.set(movieId, userRating);
    this.saveRatingsToStorage();

    // Update genre preferences if movie data is provided
    if (movie) {
      this.updateGenrePreferences(movie, validation.normalizedRating!);
    }

    return true;
  }

  /**
   * Remove a user rating
   */
  removeRating(movieId: number): boolean {
    const existed = this.userRatings.has(movieId);
    this.userRatings.delete(movieId);
    
    if (existed) {
      this.saveRatingsToStorage();
    }
    
    return existed;
  }

  /**
   * Get a user's rating for a specific movie
   */
  getRating(movieId: number): UserRating | undefined {
    return this.userRatings.get(movieId);
  }

  /**
   * Get all user ratings
   */
  getAllRatings(): UserRating[] {
    return Array.from(this.userRatings.values());
  }

  /**
   * Get user ratings as a Map
   */
  getRatingsMap(): Map<number, UserRating> {
    return new Map(this.userRatings);
  }

  /**
   * Get user's genre preferences
   */
  getGenrePreferences(): GenrePreferences {
    return { ...this.genrePreferences };
  }

  /**
   * Get user profile statistics
   */
  getUserProfile(): UserProfile {
    const ratings = Array.from(this.userRatings.values());
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0;

    const lastUpdated = ratings.length > 0 
      ? Math.max(...ratings.map(r => r.timestamp))
      : 0;

    return {
      ratings: new Map(this.userRatings),
      preferences: { ...this.genrePreferences },
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      lastUpdated
    };
  }

  /**
   * Clear all ratings and preferences
   */
  clearAllData(): void {
    this.userRatings.clear();
    this.genrePreferences = {};
    this.saveRatingsToStorage();
    this.savePreferencesToStorage();
  }

  /**
   * Export ratings data for backup
   */
  exportData(): string {
    const data = {
      ratings: Array.from(this.userRatings.entries()),
      preferences: this.genrePreferences,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import ratings data from backup
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.ratings || !Array.isArray(data.ratings)) {
        throw new Error('Invalid data format: missing or invalid ratings');
      }

      // Validate and import ratings
      const newRatings = new Map<number, UserRating>();
      for (const [movieId, rating] of data.ratings) {
        if (typeof movieId === 'number' && rating && typeof rating.rating === 'number') {
          const validation = this.validateRating(rating.rating);
          if (validation.isValid) {
            newRatings.set(movieId, {
              movieId,
              rating: validation.normalizedRating!,
              timestamp: rating.timestamp || Date.now()
            });
          }
        }
      }

      // Import preferences if available
      const newPreferences = data.preferences || {};

      // Apply imported data
      this.userRatings = newRatings;
      this.genrePreferences = newPreferences;
      
      this.saveRatingsToStorage();
      this.savePreferencesToStorage();

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get rating statistics
   */
  getRatingStatistics(): {
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { [rating: number]: number };
    mostRatedGenres: { genre: string; count: number }[];
  } {
    const ratings = Array.from(this.userRatings.values());
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0;

    // Rating distribution
    const ratingDistribution: { [rating: number]: number } = {};
    for (const rating of ratings) {
      const rounded = Math.round(rating.rating);
      ratingDistribution[rounded] = (ratingDistribution[rounded] || 0) + 1;
    }

    // Most rated genres (based on preferences)
    const mostRatedGenres = Object.entries(this.genrePreferences)
      .map(([genre, score]) => ({ genre, count: Math.round(score * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      mostRatedGenres
    };
  }

  /**
   * Update genre preferences based on a new rating
   */
  private updateGenrePreferences(movie: Movie, rating: number): void {
    const normalizedRating = (rating - RatingSystem.MIN_RATING) / 
                           (RatingSystem.MAX_RATING - RatingSystem.MIN_RATING);

    for (const genre of movie.genres) {
      const currentPreference = this.genrePreferences[genre] || 0.5;
      const totalRatingsForGenre = this.getTotalRatingsForGenre(genre);
      
      // Weighted average with more weight on recent ratings
      const weight = 1 / (totalRatingsForGenre + 1);
      this.genrePreferences[genre] = currentPreference * (1 - weight) + normalizedRating * weight;
    }

    this.savePreferencesToStorage();
  }

  /**
   * Get total number of ratings for a specific genre
   */
  private getTotalRatingsForGenre(genre: string): number {
    // This would require movie data to be passed in, simplified for now
    return Object.keys(this.genrePreferences).length;
  }

  /**
   * Load ratings from localStorage
   */
  private loadRatingsFromStorage(): void {
    try {
      const stored = localStorage.getItem(RatingSystem.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.userRatings = new Map(data);
      }
    } catch (error) {
      console.error('Error loading ratings from storage:', error);
      this.userRatings = new Map();
    }
  }

  /**
   * Save ratings to localStorage
   */
  private saveRatingsToStorage(): void {
    try {
      const data = Array.from(this.userRatings.entries());
      localStorage.setItem(RatingSystem.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving ratings to storage:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferencesFromStorage(): void {
    try {
      const stored = localStorage.getItem(RatingSystem.PREFERENCES_KEY);
      if (stored) {
        this.genrePreferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading preferences from storage:', error);
      this.genrePreferences = {};
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferencesToStorage(): void {
    try {
      localStorage.setItem(RatingSystem.PREFERENCES_KEY, JSON.stringify(this.genrePreferences));
    } catch (error) {
      console.error('Error saving preferences to storage:', error);
    }
  }
}

// Singleton instance
export const ratingSystem = new RatingSystem();