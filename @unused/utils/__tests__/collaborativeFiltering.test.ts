import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollaborativeFilteringEngine, MovieRating } from '../collaborativeFiltering';
import { ModelManager } from '../modelManager';

// Mock ModelManager
const mockModelManager = {
  loadModel: vi.fn(),
  unloadModel: vi.fn(),
  isModelLoaded: vi.fn(),
  getModelInfo: vi.fn(),
  getMemoryUsage: vi.fn(),
  clearCache: vi.fn()
} as unknown as ModelManager;

describe('CollaborativeFilteringEngine', () => {
  let engine: CollaborativeFilteringEngine;

  beforeEach(() => {
    engine = new CollaborativeFilteringEngine(mockModelManager);
    // Mock fetch for movie database
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await engine.initialize();
      const modelInfo = engine.getModelInfo();
      
      expect(modelInfo.isInitialized).toBe(true);
      expect(modelInfo.numMovies).toBeGreaterThan(0);
      expect(modelInfo.modelType).toBe('SVD Matrix Factorization');
    });

    it('should load sample movie database when fetch fails', async () => {
      await engine.initialize();
      const movies = engine.getAllMovies();
      
      expect(movies.length).toBeGreaterThan(0);
      expect(movies[0]).toHaveProperty('id');
      expect(movies[0]).toHaveProperty('title');
      expect(movies[0]).toHaveProperty('genres');
    });
  });

  describe('Movie Database Operations', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should get movie by ID', () => {
      const movie = engine.getMovie(1);
      expect(movie).toBeDefined();
      expect(movie?.title).toBe('The Shawshank Redemption');
    });

    it('should search movies by title', () => {
      const results = engine.searchMovies('godfather');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title.toLowerCase()).toContain('godfather');
    });

    it('should search movies by genre', () => {
      const results = engine.searchMovies('drama');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(movie => movie.genres.includes('Drama'))).toBe(true);
    });

    it('should get movies by genre', () => {
      const dramaMovies = engine.getMoviesByGenre('Drama');
      expect(dramaMovies.length).toBeGreaterThan(0);
      expect(dramaMovies.every(movie => movie.genres.includes('Drama'))).toBe(true);
    });

    it('should get available genres', () => {
      const genres = engine.getGenres();
      expect(genres.length).toBeGreaterThan(0);
      expect(genres).toContain('Drama');
      expect(genres).toContain('Action');
    });
  });

  describe('Recommendation Generation', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should handle cold start problem with no ratings', async () => {
      const recommendations = await engine.generateRecommendations([], 5);
      
      expect(recommendations.length).toBe(5);
      expect(recommendations[0]).toHaveProperty('movieId');
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('predictedRating');
      expect(recommendations[0]).toHaveProperty('confidence');
      expect(recommendations[0]).toHaveProperty('explanation');
      
      // Cold start should have lower confidence
      expect(recommendations[0].confidence).toBeLessThan(0.5);
    });

    it('should handle cold start with few ratings', async () => {
      const userRatings: MovieRating[] = [
        { movieId: 1, title: 'The Shawshank Redemption', rating: 5, genres: ['Drama'] },
        { movieId: 3, title: 'The Dark Knight', rating: 4, genres: ['Action', 'Crime', 'Drama'] }
      ];

      const recommendations = await engine.generateRecommendations(userRatings, 5);
      
      expect(recommendations.length).toBe(5);
      expect(recommendations[0].confidence).toBeGreaterThan(0.3);
      
      // Should prefer similar genres
      const hasPreferredGenres = recommendations.some(rec => 
        rec.genres.some(genre => ['Drama', 'Action', 'Crime'].includes(genre))
      );
      expect(hasPreferredGenres).toBe(true);
    });

    it('should generate recommendations with sufficient ratings', async () => {
      const userRatings: MovieRating[] = [
        { movieId: 1, title: 'The Shawshank Redemption', rating: 5, genres: ['Drama'] },
        { movieId: 2, title: 'The Godfather', rating: 5, genres: ['Crime', 'Drama'] },
        { movieId: 3, title: 'The Dark Knight', rating: 4, genres: ['Action', 'Crime', 'Drama'] },
        { movieId: 6, title: 'Inception', rating: 4, genres: ['Action', 'Sci-Fi', 'Thriller'] }
      ];

      const recommendations = await engine.generateRecommendations(userRatings, 5);
      
      expect(recommendations.length).toBe(5);
      expect(recommendations[0].confidence).toBeGreaterThan(0.5);
      
      // Should not recommend already rated movies
      const ratedMovieIds = userRatings.map(r => r.movieId);
      const recommendedIds = recommendations.map(r => r.movieId);
      const overlap = recommendedIds.filter(id => ratedMovieIds.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('should provide explanations for recommendations', async () => {
      const userRatings: MovieRating[] = [
        { movieId: 1, title: 'The Shawshank Redemption', rating: 5, genres: ['Drama'] }
      ];

      const recommendations = await engine.generateRecommendations(userRatings, 3);
      
      expect(recommendations[0].explanation).toBeDefined();
      expect(typeof recommendations[0].explanation).toBe('string');
      expect(recommendations[0].explanation.length).toBeGreaterThan(0);
    });

    it('should sort recommendations by predicted rating', async () => {
      const userRatings: MovieRating[] = [
        { movieId: 1, title: 'The Shawshank Redemption', rating: 5, genres: ['Drama'] },
        { movieId: 2, title: 'The Godfather', rating: 5, genres: ['Crime', 'Drama'] }
      ];

      const recommendations = await engine.generateRecommendations(userRatings, 5);
      
      // Check that we have recommendations
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that the first recommendation has the highest or equal rating
      const firstRating = recommendations[0].predictedRating;
      const allRatings = recommendations.map(r => r.predictedRating);
      const maxRating = Math.max(...allRatings);
      
      expect(firstRating).toBeCloseTo(maxRating, 2);
    });
  });

  describe('Model Information', () => {
    it('should provide model information before initialization', () => {
      const info = engine.getModelInfo();
      expect(info.isInitialized).toBe(false);
      expect(info.modelType).toBe('SVD Matrix Factorization');
      expect(info.options).toBeDefined();
    });

    it('should provide complete model information after initialization', async () => {
      await engine.initialize();
      const info = engine.getModelInfo();
      
      expect(info.isInitialized).toBe(true);
      expect(info.numMovies).toBeGreaterThan(0);
      expect(info.numGenres).toBeGreaterThan(0);
      expect(info.modelType).toBe('SVD Matrix Factorization');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset user profiles', async () => {
      await engine.initialize();
      
      // Generate some recommendations to create user profiles
      const userRatings: MovieRating[] = [
        { movieId: 1, title: 'The Shawshank Redemption', rating: 5, genres: ['Drama'] }
      ];
      await engine.generateRecommendations(userRatings, 3);
      
      // Reset should not throw
      expect(() => engine.reset()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing movies gracefully', () => {
      const movie = engine.getMovie(99999);
      expect(movie).toBeUndefined();
    });

    it('should handle empty search queries', () => {
      const results = engine.searchMovies('');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle invalid genre queries', () => {
      const results = engine.getMoviesByGenre('NonexistentGenre');
      expect(results.length).toBe(0);
    });
  });
});