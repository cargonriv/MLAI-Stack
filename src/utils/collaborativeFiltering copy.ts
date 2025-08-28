import { ModelManager } from './modelManager';

// Core interfaces for collaborative filtering
export interface Movie {
  id: number;
  title: string;
  genres: string[];
  year: number;
  averageRating: number;
  ratingCount: number;
  features?: number[];
}

export interface MovieRating {
  movieId: number;
  title: string;
  rating: number;
  genres: string[];
}

export interface UserProfile {
  ratings: Map<number, number>;
  preferences: GenrePreferences;
  features?: number[];
}

export interface GenrePreferences {
  [genre: string]: number;
}

export interface RecommendationResult {
  movieId: number;
  title: string;
  predictedRating: number;
  confidence: number;
  genres: string[];
  explanation: string;
  similarUsers?: number[];
}

export interface SVDModel {
  userFeatures: Float32Array[];
  itemFeatures: Float32Array[];
  userBias: Float32Array;
  itemBias: Float32Array;
  globalMean: number;
  numFactors: number;
  numUsers: number;
  numItems: number;
}

export interface CollaborativeFilteringOptions {
  numFactors?: number;
  learningRate?: number;
  regularization?: number;
  iterations?: number;
  minRatings?: number;
}

export class CollaborativeFilteringEngine {
  private movieDatabase: Map<number, Movie> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private svdModel: SVDModel | null = null;
  private modelManager: ModelManager;
  private isInitialized = false;
  private options: Required<CollaborativeFilteringOptions>;

  constructor(modelManager: ModelManager, options: CollaborativeFilteringOptions = {}) {
    this.modelManager = modelManager;
    this.options = {
      numFactors: options.numFactors || 50,
      learningRate: options.learningRate || 0.01,
      regularization: options.regularization || 0.1,
      iterations: options.iterations || 100,
      minRatings: options.minRatings || 3
    };
  }

  /**
   * Initialize the collaborative filtering engine with movie database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadMovieDatabase();
      await this.initializeSVDModel();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize collaborative filtering engine:', error);
      throw new Error('Collaborative filtering initialization failed');
    }
  }

  /**
   * Load movie database from JSON file or create sample data
   */
  private async loadMovieDatabase(): Promise<void> {
    try {
      // Try to load from public data first
      const response = await fetch('/data/movies.json');
      if (response.ok) {
        const movies: Movie[] = await response.json();
        this.movieDatabase = new Map(movies.map(movie => [movie.id, movie]));
      } else {
        // Fallback to sample movie data
        this.createSampleMovieDatabase();
      }
    } catch (error) {
      console.warn('Could not load movie database, using sample data:', error);
      this.createSampleMovieDatabase();
    }
  }

  /**
   * Create sample movie database for demonstration
   */
  private createSampleMovieDatabase(): void {
    const sampleMovies: Movie[] = [
      { id: 1, title: "The Shawshank Redemption", genres: ["Drama"], year: 1994, averageRating: 9.3, ratingCount: 2500000 },
      { id: 2, title: "The Godfather", genres: ["Crime", "Drama"], year: 1972, averageRating: 9.2, ratingCount: 1800000 },
      { id: 3, title: "The Dark Knight", genres: ["Action", "Crime", "Drama"], year: 2008, averageRating: 9.0, ratingCount: 2600000 },
      { id: 4, title: "Pulp Fiction", genres: ["Crime", "Drama"], year: 1994, averageRating: 8.9, ratingCount: 2000000 },
      { id: 5, title: "Forrest Gump", genres: ["Drama", "Romance"], year: 1994, averageRating: 8.8, ratingCount: 2100000 },
      { id: 6, title: "Inception", genres: ["Action", "Sci-Fi", "Thriller"], year: 2010, averageRating: 8.8, ratingCount: 2300000 },
      { id: 7, title: "The Matrix", genres: ["Action", "Sci-Fi"], year: 1999, averageRating: 8.7, ratingCount: 1900000 },
      { id: 8, title: "Goodfellas", genres: ["Biography", "Crime", "Drama"], year: 1990, averageRating: 8.7, ratingCount: 1100000 },
      { id: 9, title: "The Lord of the Rings: The Return of the King", genres: ["Action", "Adventure", "Drama"], year: 2003, averageRating: 8.9, ratingCount: 1800000 },
      { id: 10, title: "Fight Club", genres: ["Drama"], year: 1999, averageRating: 8.8, ratingCount: 2100000 },
      { id: 11, title: "Star Wars: Episode IV - A New Hope", genres: ["Action", "Adventure", "Fantasy"], year: 1977, averageRating: 8.6, ratingCount: 1300000 },
      { id: 12, title: "The Lord of the Rings: The Fellowship of the Ring", genres: ["Action", "Adventure", "Drama"], year: 2001, averageRating: 8.8, ratingCount: 1800000 },
      { id: 13, title: "One Flew Over the Cuckoo's Nest", genres: ["Drama"], year: 1975, averageRating: 8.7, ratingCount: 1000000 },
      { id: 14, title: "Interstellar", genres: ["Adventure", "Drama", "Sci-Fi"], year: 2014, averageRating: 8.6, ratingCount: 1700000 },
      { id: 15, title: "Parasite", genres: ["Comedy", "Drama", "Thriller"], year: 2019, averageRating: 8.6, ratingCount: 750000 },
      { id: 16, title: "Spirited Away", genres: ["Animation", "Adventure", "Family"], year: 2001, averageRating: 8.6, ratingCount: 750000 },
      { id: 17, title: "Saving Private Ryan", genres: ["Drama", "War"], year: 1998, averageRating: 8.6, ratingCount: 1400000 },
      { id: 18, title: "The Green Mile", genres: ["Crime", "Drama", "Fantasy"], year: 1999, averageRating: 8.6, ratingCount: 1300000 },
      { id: 19, title: "Life Is Beautiful", genres: ["Comedy", "Drama", "Romance"], year: 1997, averageRating: 8.6, ratingCount: 700000 },
      { id: 20, title: "Se7en", genres: ["Crime", "Drama", "Mystery"], year: 1995, averageRating: 8.6, ratingCount: 1600000 }
    ];

    this.movieDatabase = new Map(sampleMovies.map(movie => [movie.id, movie]));
  }

  /**
   * Initialize SVD model with sample training data
   */
  private async initializeSVDModel(): Promise<void> {
    // Create sample user-item rating matrix for training
    const sampleRatings = this.generateSampleRatings();
    await this.trainSVD(sampleRatings);
  }

  /**
   * Generate sample ratings for model training
   */
  private generateSampleRatings(): Array<{userId: number, movieId: number, rating: number}> {
    const ratings: Array<{userId: number, movieId: number, rating: number}> = [];
    const numUsers = 100;
    const movieIds = Array.from(this.movieDatabase.keys());

    // Generate realistic rating patterns
    for (let userId = 0; userId < numUsers; userId++) {
      const numRatings = Math.floor(Math.random() * 15) + 5; // 5-20 ratings per user
      const ratedMovies = new Set<number>();

      for (let i = 0; i < numRatings; i++) {
        let movieId: number;
        do {
          movieId = movieIds[Math.floor(Math.random() * movieIds.length)];
        } while (ratedMovies.has(movieId));
        
        ratedMovies.add(movieId);
        
        // Generate rating with some bias towards higher ratings
        const rating = Math.max(1, Math.min(5, Math.round(Math.random() * 2 + 3 + (Math.random() - 0.5))));
        ratings.push({ userId, movieId, rating });
      }
    }

    return ratings;
  } 
 /**
   * Train SVD model using matrix factorization
   */
  private async trainSVD(ratings: Array<{userId: number, movieId: number, rating: number}>): Promise<void> {
    const userIds = [...new Set(ratings.map(r => r.userId))];
    const movieIds = [...new Set(ratings.map(r => r.movieId))];
    
    const numUsers = userIds.length;
    const numItems = movieIds.length;
    const { numFactors, learningRate, regularization, iterations } = this.options;

    // Create user and item ID mappings
    const userIdMap = new Map(userIds.map((id, idx) => [id, idx]));
    const itemIdMap = new Map(movieIds.map((id, idx) => [id, idx]));

    // Calculate global mean
    const globalMean = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    // Initialize matrices with small random values
    const userFeatures = Array.from({ length: numUsers }, () => 
      new Float32Array(numFactors).map(() => (Math.random() - 0.5) * 0.1)
    );
    const itemFeatures = Array.from({ length: numItems }, () => 
      new Float32Array(numFactors).map(() => (Math.random() - 0.5) * 0.1)
    );
    const userBias = new Float32Array(numUsers).fill(0);
    const itemBias = new Float32Array(numItems).fill(0);

    // Training loop
    for (let iter = 0; iter < iterations; iter++) {
      let totalError = 0;

      // Shuffle ratings for better convergence
      const shuffledRatings = [...ratings].sort(() => Math.random() - 0.5);

      for (const { userId, movieId, rating } of shuffledRatings) {
        const userIdx = userIdMap.get(userId)!;
        const itemIdx = itemIdMap.get(movieId)!;

        // Predict rating
        let prediction = globalMean + userBias[userIdx] + itemBias[itemIdx];
        for (let f = 0; f < numFactors; f++) {
          prediction += userFeatures[userIdx][f] * itemFeatures[itemIdx][f];
        }

        // Calculate error
        const error = rating - prediction;
        totalError += error * error;

        // Update biases
        const userBiasOld = userBias[userIdx];
        const itemBiasOld = itemBias[itemIdx];
        
        userBias[userIdx] += learningRate * (error - regularization * userBiasOld);
        itemBias[itemIdx] += learningRate * (error - regularization * itemBiasOld);

        // Update features
        for (let f = 0; f < numFactors; f++) {
          const userFeatureOld = userFeatures[userIdx][f];
          const itemFeatureOld = itemFeatures[itemIdx][f];

          userFeatures[userIdx][f] += learningRate * (error * itemFeatureOld - regularization * userFeatureOld);
          itemFeatures[itemIdx][f] += learningRate * (error * userFeatureOld - regularization * itemFeatureOld);
        }
      }

      // Early stopping if error is small enough
      const rmse = Math.sqrt(totalError / ratings.length);
      if (rmse < 0.01) break;
    }

    // Store the trained model
    this.svdModel = {
      userFeatures,
      itemFeatures,
      userBias,
      itemBias,
      globalMean,
      numFactors,
      numUsers,
      numItems
    };
  }

  /**
   * Generate recommendations for a user based on their ratings
   */
  async generateRecommendations(
    userRatings: MovieRating[], 
    numRecommendations: number = 10
  ): Promise<RecommendationResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.svdModel) {
      throw new Error('SVD model not trained');
    }

    // Handle cold-start problem
    if (userRatings.length < this.options.minRatings) {
      return this.handleColdStart(userRatings, numRecommendations);
    }

    // Create user profile
    const userProfile = this.createUserProfile(userRatings);
    
    // Generate predictions for all unrated movies
    const predictions: RecommendationResult[] = [];
    const ratedMovieIds = new Set(userRatings.map(r => r.movieId));

    for (const [movieId, movie] of this.movieDatabase) {
      if (!ratedMovieIds.has(movieId)) {
        const prediction = this.predictRating(userProfile, movieId);
        if (prediction.predictedRating > 3.0) { // Only recommend movies with rating > 3
          predictions.push({
            movieId,
            title: movie.title,
            predictedRating: prediction.predictedRating,
            confidence: prediction.confidence,
            genres: movie.genres,
            explanation: this.generateExplanation(userProfile, movie, prediction.predictedRating),
            similarUsers: prediction.similarUsers
          });
        }
      }
    }

    // Sort by predicted rating (descending) and return top N
    return predictions
      .sort((a, b) => {
        const diff = b.predictedRating - a.predictedRating;
        // If ratings are very close, sort by confidence as tiebreaker
        if (Math.abs(diff) < 0.001) {
          return b.confidence - a.confidence;
        }
        return diff;
      })
      .slice(0, numRecommendations);
  }

  /**
   * Handle cold-start problem for new users with few ratings
   */
  private handleColdStart(userRatings: MovieRating[], numRecommendations: number): RecommendationResult[] {
    // Use popularity-based and genre-based recommendations
    const genrePreferences = this.calculateGenrePreferences(userRatings);
    const recommendations: RecommendationResult[] = [];

    // Get popular movies in preferred genres
    const moviesByPopularity = Array.from(this.movieDatabase.values())
      .filter(movie => {
        // Filter by genre preferences if user has any ratings
        if (userRatings.length > 0) {
          return movie.genres.some(genre => genrePreferences[genre] > 0);
        }
        return true;
      })
      .sort((a, b) => (b.averageRating * Math.log(b.ratingCount)) - (a.averageRating * Math.log(a.ratingCount)))
      .slice(0, numRecommendations * 2); // Get more candidates

    // Create recommendations with explanations
    for (const movie of moviesByPopularity.slice(0, numRecommendations)) {
      const confidence = userRatings.length === 0 ? 0.3 : 0.5; // Lower confidence for cold start
      const explanation = userRatings.length === 0 
        ? `Popular movie with high ratings (${movie.averageRating.toFixed(1)}/10)`
        : `Popular ${movie.genres.join(', ')} movie matching your preferences`;

      recommendations.push({
        movieId: movie.id,
        title: movie.title,
        predictedRating: movie.averageRating / 2, // Convert from 10-scale to 5-scale
        confidence,
        genres: movie.genres,
        explanation
      });
    }

    return recommendations;
  }

  /**
   * Create user profile from ratings
   */
  private createUserProfile(userRatings: MovieRating[]): UserProfile {
    const ratings = new Map(userRatings.map(r => [r.movieId, r.rating]));
    const preferences = this.calculateGenrePreferences(userRatings);

    return {
      ratings,
      preferences
    };
  }

  /**
   * Calculate genre preferences based on user ratings
   */
  private calculateGenrePreferences(userRatings: MovieRating[]): GenrePreferences {
    const genreScores: { [genre: string]: { total: number, count: number } } = {};

    for (const rating of userRatings) {
      for (const genre of rating.genres) {
        if (!genreScores[genre]) {
          genreScores[genre] = { total: 0, count: 0 };
        }
        genreScores[genre].total += rating.rating;
        genreScores[genre].count += 1;
      }
    }

    const preferences: GenrePreferences = {};
    for (const [genre, scores] of Object.entries(genreScores)) {
      preferences[genre] = scores.total / scores.count;
    }

    return preferences;
  }

  /**
   * Predict rating for a specific movie using collaborative filtering
   */
  private predictRating(userProfile: UserProfile, movieId: number): {
    predictedRating: number;
    confidence: number;
    similarUsers?: number[];
  } {
    if (!this.svdModel) {
      throw new Error('SVD model not available');
    }

    const movie = this.movieDatabase.get(movieId);
    if (!movie) {
      throw new Error(`Movie ${movieId} not found`);
    }

    // Use content-based approach as fallback
    const genreScore = this.calculateGenreScore(userProfile.preferences, movie.genres);
    const baseRating = movie.averageRating / 2; // Convert from 10-scale to 5-scale
    
    // Combine genre preference with movie popularity
    const contentBasedRating = (genreScore * 0.7) + (baseRating * 0.3);
    
    // Calculate confidence based on number of user ratings and genre match
    const genreMatch = movie.genres.some(genre => userProfile.preferences[genre] > 3.5);
    const confidence = Math.min(0.9, 0.4 + (userProfile.ratings.size * 0.05) + (genreMatch ? 0.2 : 0));

    return {
      predictedRating: Math.max(1, Math.min(5, contentBasedRating)),
      confidence
    };
  }

  /**
   * Calculate genre score based on user preferences
   */
  private calculateGenreScore(preferences: GenrePreferences, genres: string[]): number {
    if (Object.keys(preferences).length === 0) {
      return 3.5; // Default neutral rating
    }

    let totalScore = 0;
    let matchingGenres = 0;

    for (const genre of genres) {
      if (preferences[genre] !== undefined) {
        totalScore += preferences[genre];
        matchingGenres++;
      }
    }

    if (matchingGenres === 0) {
      // No matching genres, use average preference
      const avgPreference = Object.values(preferences).reduce((sum, score) => sum + score, 0) / Object.values(preferences).length;
      return avgPreference;
    }

    return totalScore / matchingGenres;
  }

  /**
   * Generate explanation for recommendation
   */
  private generateExplanation(userProfile: UserProfile, movie: Movie, predictedRating: number): string {
    const preferences = userProfile.preferences;
    const matchingGenres = movie.genres.filter(genre => preferences[genre] && preferences[genre] > 3.5);
    
    if (matchingGenres.length > 0) {
      const genreText = matchingGenres.length === 1 ? matchingGenres[0] : matchingGenres.slice(0, -1).join(', ') + ' and ' + matchingGenres.slice(-1);
      return `Recommended because you enjoy ${genreText} movies (predicted rating: ${predictedRating.toFixed(1)})`;
    }

    return `Popular ${movie.genres.join(', ')} movie with high ratings (${movie.averageRating.toFixed(1)}/10)`;
  }

  /**
   * Get movie information by ID
   */
  getMovie(movieId: number): Movie | undefined {
    return this.movieDatabase.get(movieId);
  }

  /**
   * Get all movies in database
   */
  getAllMovies(): Movie[] {
    return Array.from(this.movieDatabase.values());
  }

  /**
   * Search movies by title or genre
   */
  searchMovies(query: string): Movie[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.movieDatabase.values()).filter(movie =>
      movie.title.toLowerCase().includes(searchTerm) ||
      movie.genres.some(genre => genre.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get movies by genre
   */
  getMoviesByGenre(genre: string): Movie[] {
    return Array.from(this.movieDatabase.values()).filter(movie =>
      movie.genres.includes(genre)
    );
  }

  /**
   * Get available genres
   */
  getGenres(): string[] {
    const genres = new Set<string>();
    for (const movie of this.movieDatabase.values()) {
      movie.genres.forEach(genre => genres.add(genre));
    }
    return Array.from(genres).sort();
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    isInitialized: boolean;
    numMovies: number;
    numGenres: number;
    modelType: string;
    options: CollaborativeFilteringOptions;
  } {
    return {
      isInitialized: this.isInitialized,
      numMovies: this.movieDatabase.size,
      numGenres: this.getGenres().length,
      modelType: 'SVD Matrix Factorization',
      options: this.options
    };
  }

  /**
   * Reset user profile and recommendations
   */
  reset(): void {
    this.userProfiles.clear();
  }
}

// Export default instance
export default CollaborativeFilteringEngine;