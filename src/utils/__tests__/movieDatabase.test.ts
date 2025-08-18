import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovieDatabase, Movie, MovieSearchFilters } from '../movieDatabase';

// Mock fetch
global.fetch = vi.fn();

const mockMovies: Movie[] = [
  {
    id: 1,
    title: "The Shawshank Redemption",
    genres: ["Drama"],
    year: 1994,
    averageRating: 9.3,
    ratingCount: 2500000,
    director: "Frank Darabont",
    cast: ["Tim Robbins", "Morgan Freeman"],
    plot: "Two imprisoned men bond over a number of years",
    runtime: 142,
    language: "English",
    country: "USA",
    poster: "/placeholder.svg",
    imdbId: "tt0111161",
    features: [0.95, 0.1, 0.8, 0.2, 0.9, 0.1, 0.3, 0.7]
  },
  {
    id: 2,
    title: "The Godfather",
    genres: ["Crime", "Drama"],
    year: 1972,
    averageRating: 9.2,
    ratingCount: 1800000,
    director: "Francis Ford Coppola",
    cast: ["Marlon Brando", "Al Pacino"],
    plot: "The aging patriarch of an organized crime dynasty",
    runtime: 175,
    language: "English",
    country: "USA",
    poster: "/placeholder.svg",
    imdbId: "tt0068646",
    features: [0.9, 0.8, 0.7, 0.1, 0.8, 0.2, 0.4, 0.6]
  },
  {
    id: 3,
    title: "Spirited Away",
    genres: ["Animation", "Adventure", "Family"],
    year: 2001,
    averageRating: 8.6,
    ratingCount: 750000,
    director: "Hayao Miyazaki",
    cast: ["Rumi Hiiragi", "Miyu Irino"],
    plot: "A sullen 10-year-old girl wanders into a world ruled by gods",
    runtime: 125,
    language: "Japanese",
    country: "Japan",
    poster: "/placeholder.svg",
    imdbId: "tt0245429",
    features: [0.5, 0.2, 0.3, 0.6, 0.9, 0.8, 0.4, 0.9]
  }
];

describe('MovieDatabase', () => {
  let movieDatabase: MovieDatabase;

  beforeEach(() => {
    movieDatabase = new MovieDatabase();
    vi.clearAllMocks();
    
    // Mock successful fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMovies)
    });
  });

  describe('loadDatabase', () => {
    it('should load movies from JSON file', async () => {
      await movieDatabase.loadDatabase();
      
      expect(global.fetch).toHaveBeenCalledWith('/data/movies.json');
      expect(movieDatabase.getAllMovies()).toHaveLength(3);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(movieDatabase.loadDatabase()).rejects.toThrow('Failed to load movie database');
    });

    it('should not reload if already loaded', async () => {
      await movieDatabase.loadDatabase();
      await movieDatabase.loadDatabase();
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('movie retrieval', () => {
    beforeEach(async () => {
      await movieDatabase.loadDatabase();
    });

    it('should get movie by ID', () => {
      const movie = movieDatabase.getMovie(1);
      expect(movie?.title).toBe("The Shawshank Redemption");
    });

    it('should return undefined for non-existent movie', () => {
      const movie = movieDatabase.getMovie(999);
      expect(movie).toBeUndefined();
    });

    it('should get all movies', () => {
      const movies = movieDatabase.getAllMovies();
      expect(movies).toHaveLength(3);
    });

    it('should get all genres', () => {
      const genres = movieDatabase.getAllGenres();
      expect(genres).toContain('Drama');
      expect(genres).toContain('Animation');
      
      // Check if genres are sorted
      const sortedGenres = [...genres].sort();
      expect(genres).toEqual(sortedGenres);
    });
  });

  describe('searchMovies', () => {
    beforeEach(async () => {
      await movieDatabase.loadDatabase();
    });

    it('should return all movies with no filters', () => {
      const results = movieDatabase.searchMovies();
      expect(results).toHaveLength(3);
    });

    it('should filter by genre', () => {
      const filters: MovieSearchFilters = { genres: ['Drama'] };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(2);
      expect(results.every(m => m.genres.includes('Drama'))).toBe(true);
    });

    it('should filter by year range', () => {
      const filters: MovieSearchFilters = { 
        yearRange: { min: 1990, max: 2000 } 
      };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("The Shawshank Redemption");
    });

    it('should filter by rating range', () => {
      const filters: MovieSearchFilters = { 
        ratingRange: { min: 9.0, max: 10.0 } 
      };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(2);
      expect(results.every(m => m.averageRating >= 9.0)).toBe(true);
    });

    it('should filter by runtime range', () => {
      const filters: MovieSearchFilters = { 
        runtimeRange: { min: 120, max: 150 } 
      };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(2);
      expect(results.every(m => m.runtime >= 120 && m.runtime <= 150)).toBe(true);
    });

    it('should filter by language', () => {
      const filters: MovieSearchFilters = { language: 'Japanese' };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Spirited Away");
    });

    it('should filter by search term', () => {
      const filters: MovieSearchFilters = { searchTerm: 'Shawshank' };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("The Shawshank Redemption");
    });

    it('should search in plot', () => {
      const filters: MovieSearchFilters = { searchTerm: 'imprisoned' };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("The Shawshank Redemption");
    });

    it('should search in director', () => {
      const filters: MovieSearchFilters = { searchTerm: 'Miyazaki' };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Spirited Away");
    });

    it('should search in cast', () => {
      const filters: MovieSearchFilters = { searchTerm: 'Morgan Freeman' };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("The Shawshank Redemption");
    });

    it('should combine multiple filters', () => {
      const filters: MovieSearchFilters = { 
        genres: ['Drama'],
        yearRange: { min: 1990, max: 2000 }
      };
      const results = movieDatabase.searchMovies(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("The Shawshank Redemption");
    });
  });

  describe('similarity calculations', () => {
    beforeEach(async () => {
      await movieDatabase.loadDatabase();
    });

    it('should calculate movie similarity', () => {
      const similarity = movieDatabase.calculateMovieSimilarity(1, 2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should return 0 for non-existent movies', () => {
      const similarity = movieDatabase.calculateMovieSimilarity(1, 999);
      expect(similarity).toBe(0);
    });

    it('should find similar movies', () => {
      const similar = movieDatabase.findSimilarMovies(1, 2);
      expect(similar).toHaveLength(2);
      expect(similar[0].similarity).toBeGreaterThanOrEqual(similar[1].similarity);
      
      // Check that at least some movies have reasons (similarity reasons might be empty for very different movies)
      const hasReasons = similar.some(s => s.reasons.length > 0);
      expect(hasReasons).toBe(true);
    });

    it('should return empty array for non-existent movie', () => {
      const similar = movieDatabase.findSimilarMovies(999);
      expect(similar).toHaveLength(0);
    });
  });

  describe('genre-based recommendations', () => {
    beforeEach(async () => {
      await movieDatabase.loadDatabase();
    });

    it('should generate genre-based recommendations', () => {
      const preferences = { 'Drama': 0.8, 'Crime': 0.6 };
      const recommendations = movieDatabase.getGenreBasedRecommendations(preferences, 2);
      
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].genres.some(g => ['Drama', 'Crime'].includes(g))).toBe(true);
    });

    it('should limit recommendations', () => {
      const preferences = { 'Drama': 0.8 };
      const recommendations = movieDatabase.getGenreBasedRecommendations(preferences, 1);
      
      expect(recommendations).toHaveLength(1);
    });

    it('should handle empty preferences', () => {
      const preferences = {};
      const recommendations = movieDatabase.getGenreBasedRecommendations(preferences);
      
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});