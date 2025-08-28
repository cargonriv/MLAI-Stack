/**
 * Movie Database and Rating System Infrastructure
 * Provides comprehensive movie search, filtering, and rating functionality
 */

export interface Movie {
  id: number;
  title: string;
  genres: string[];
  year: number;
  averageRating: number;
  ratingCount: number;
  director: string;
  cast: string[];
  plot: string;
  runtime: number;
  language: string;
  country: string;
  poster: string;
  imdbId: string;
  features: number[]; // Learned embeddings for collaborative filtering
}

export interface UserRating {
  movieId: number;
  rating: number;
  timestamp: number;
}

export interface MovieSearchFilters {
  genres?: string[];
  yearRange?: { min: number; max: number };
  ratingRange?: { min: number; max: number };
  runtimeRange?: { min: number; max: number };
  language?: string;
  searchTerm?: string;
}

export interface GenrePreferences {
  [genre: string]: number; // Preference score 0-1
}

export interface MovieSimilarity {
  movieId: number;
  similarity: number;
  reasons: string[];
}

export class MovieDatabase {
  private movies: Map<number, Movie> = new Map();
  private genreIndex: Map<string, Set<number>> = new Map();
  private yearIndex: Map<number, Set<number>> = new Map();
  private directorIndex: Map<string, Set<number>> = new Map();
  private castIndex: Map<string, Set<number>> = new Map();
  private loaded = false;

  /**
   * Load movie database from JSON file
   */
  async loadDatabase(): Promise<void> {
    if (this.loaded) return;

    try {
      const response = await fetch('/data/movies.json');
      if (!response.ok) {
        throw new Error(`Failed to load movie database: ${response.statusText}`);
      }

      const moviesData: Movie[] = await response.json();
      this.buildIndexes(moviesData);
      this.loaded = true;
    } catch (error) {
      console.error('Error loading movie database:', error);
      throw new Error('Failed to load movie database');
    }
  }

  /**
   * Build search indexes for efficient filtering
   */
  private buildIndexes(moviesData: Movie[]): void {
    this.movies.clear();
    this.genreIndex.clear();
    this.yearIndex.clear();
    this.directorIndex.clear();
    this.castIndex.clear();

    for (const movie of moviesData) {
      this.movies.set(movie.id, movie);

      // Genre index
      for (const genre of movie.genres) {
        if (!this.genreIndex.has(genre)) {
          this.genreIndex.set(genre, new Set());
        }
        this.genreIndex.get(genre)!.add(movie.id);
      }

      // Year index
      if (!this.yearIndex.has(movie.year)) {
        this.yearIndex.set(movie.year, new Set());
      }
      this.yearIndex.get(movie.year)!.add(movie.id);

      // Director index
      if (!this.directorIndex.has(movie.director)) {
        this.directorIndex.set(movie.director, new Set());
      }
      this.directorIndex.get(movie.director)!.add(movie.id);

      // Cast index
      for (const actor of movie.cast) {
        if (!this.castIndex.has(actor)) {
          this.castIndex.set(actor, new Set());
        }
        this.castIndex.get(actor)!.add(movie.id);
      }
    }
  }

  /**
   * Get movie by ID
   */
  getMovie(id: number): Movie | undefined {
    return this.movies.get(id);
  }

  /**
   * Get all movies
   */
  getAllMovies(): Movie[] {
    return Array.from(this.movies.values());
  }

  /**
   * Get all unique genres
   */
  getAllGenres(): string[] {
    return Array.from(this.genreIndex.keys()).sort();
  }

  /**
   * Search and filter movies
   */
  searchMovies(filters: MovieSearchFilters = {}): Movie[] {
    let results = new Set<number>(this.movies.keys());

    // Filter by genres
    if (filters.genres && filters.genres.length > 0) {
      const genreResults = new Set<number>();
      for (const genre of filters.genres) {
        const genreMovies = this.genreIndex.get(genre);
        if (genreMovies) {
          for (const movieId of genreMovies) {
            genreResults.add(movieId);
          }
        }
      }
      results = new Set([...results].filter(id => genreResults.has(id)));
    }

    // Filter by year range
    if (filters.yearRange) {
      results = new Set([...results].filter(id => {
        const movie = this.movies.get(id)!;
        return movie.year >= filters.yearRange!.min && movie.year <= filters.yearRange!.max;
      }));
    }

    // Filter by rating range
    if (filters.ratingRange) {
      results = new Set([...results].filter(id => {
        const movie = this.movies.get(id)!;
        return movie.averageRating >= filters.ratingRange!.min && 
               movie.averageRating <= filters.ratingRange!.max;
      }));
    }

    // Filter by runtime range
    if (filters.runtimeRange) {
      results = new Set([...results].filter(id => {
        const movie = this.movies.get(id)!;
        return movie.runtime >= filters.runtimeRange!.min && 
               movie.runtime <= filters.runtimeRange!.max;
      }));
    }

    // Filter by language
    if (filters.language) {
      results = new Set([...results].filter(id => {
        const movie = this.movies.get(id)!;
        return movie.language.toLowerCase() === filters.language!.toLowerCase();
      }));
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      results = new Set([...results].filter(id => {
        const movie = this.movies.get(id)!;
        return movie.title.toLowerCase().includes(searchTerm) ||
               movie.plot.toLowerCase().includes(searchTerm) ||
               movie.director.toLowerCase().includes(searchTerm) ||
               movie.cast.some(actor => actor.toLowerCase().includes(searchTerm));
      }));
    }

    return [...results].map(id => this.movies.get(id)!);
  }

  /**
   * Calculate similarity between two movies based on features
   */
  calculateMovieSimilarity(movie1Id: number, movie2Id: number): number {
    const movie1 = this.movies.get(movie1Id);
    const movie2 = this.movies.get(movie2Id);

    if (!movie1 || !movie2) return 0;

    // Genre similarity
    const genreOverlap = movie1.genres.filter(g => movie2.genres.includes(g)).length;
    const genreUnion = new Set([...movie1.genres, ...movie2.genres]).size;
    const genreSimilarity = genreOverlap / genreUnion;

    // Feature vector similarity (cosine similarity)
    const featureSimilarity = this.cosineSimilarity(movie1.features, movie2.features);

    // Year similarity (normalized by decade)
    const yearDiff = Math.abs(movie1.year - movie2.year);
    const yearSimilarity = Math.max(0, 1 - yearDiff / 50);

    // Director similarity
    const directorSimilarity = movie1.director === movie2.director ? 1 : 0;

    // Cast similarity
    const castOverlap = movie1.cast.filter(actor => movie2.cast.includes(actor)).length;
    const castSimilarity = castOverlap / Math.max(movie1.cast.length, movie2.cast.length);

    // Weighted combination
    return (
      genreSimilarity * 0.3 +
      featureSimilarity * 0.4 +
      yearSimilarity * 0.1 +
      directorSimilarity * 0.1 +
      castSimilarity * 0.1
    );
  }

  /**
   * Find similar movies to a given movie
   */
  findSimilarMovies(movieId: number, limit: number = 10): MovieSimilarity[] {
    const targetMovie = this.movies.get(movieId);
    if (!targetMovie) return [];

    const similarities: MovieSimilarity[] = [];

    for (const [id, movie] of this.movies) {
      if (id === movieId) continue;

      const similarity = this.calculateMovieSimilarity(movieId, id);
      const reasons = this.getSimilarityReasons(targetMovie, movie);

      similarities.push({
        movieId: id,
        similarity,
        reasons
      });
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Get genre-based recommendations
   */
  getGenreBasedRecommendations(preferences: GenrePreferences, limit: number = 10): Movie[] {
    const scores = new Map<number, number>();

    for (const [movieId, movie] of this.movies) {
      let score = 0;
      for (const genre of movie.genres) {
        score += preferences[genre] || 0;
      }
      // Normalize by number of genres and add rating boost
      score = (score / movie.genres.length) * (movie.averageRating / 10);
      scores.set(movieId, score);
    }

    return [...scores.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([movieId]) => this.movies.get(movieId)!);
  }

  /**
   * Calculate cosine similarity between two feature vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get reasons why two movies are similar
   */
  private getSimilarityReasons(movie1: Movie, movie2: Movie): string[] {
    const reasons: string[] = [];

    // Genre overlap
    const sharedGenres = movie1.genres.filter(g => movie2.genres.includes(g));
    if (sharedGenres.length > 0) {
      reasons.push(`Both are ${sharedGenres.join(', ')} movies`);
    }

    // Same director
    if (movie1.director === movie2.director) {
      reasons.push(`Both directed by ${movie1.director}`);
    }

    // Shared cast
    const sharedCast = movie1.cast.filter(actor => movie2.cast.includes(actor));
    if (sharedCast.length > 0) {
      reasons.push(`Shared cast: ${sharedCast.slice(0, 2).join(', ')}`);
    }

    // Similar time period
    const yearDiff = Math.abs(movie1.year - movie2.year);
    if (yearDiff <= 5) {
      reasons.push(`Both from the ${Math.floor(movie1.year / 10) * 10}s`);
    }

    // Similar ratings
    const ratingDiff = Math.abs(movie1.averageRating - movie2.averageRating);
    if (ratingDiff <= 0.5) {
      reasons.push('Similar critical acclaim');
    }

    return reasons;
  }
}

// Singleton instance
export const movieDatabase = new MovieDatabase();