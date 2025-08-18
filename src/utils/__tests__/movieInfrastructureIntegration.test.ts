import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovieDatabase, Movie } from '../movieDatabase';
import { RatingSystem } from '../ratingSystem';

// Mock fetch and localStorage
global.fetch = vi.fn();
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
    title: "Inception",
    genres: ["Action", "Sci-Fi", "Thriller"],
    year: 2010,
    averageRating: 8.8,
    ratingCount: 2300000,
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Marion Cotillard"],
    plot: "A thief who steals corporate secrets through dream-sharing technology",
    runtime: 148,
    language: "English",
    country: "USA",
    poster: "/placeholder.svg",
    imdbId: "tt1375666",
    features: [0.6, 0.7, 0.4, 0.9, 0.7, 0.8, 0.9, 0.5]
  }
];

describe('Movie Infrastructure Integration', () => {
  let movieDatabase: MovieDatabase;
  let ratingSystem: RatingSystem;

  beforeEach(async () => {
    movieDatabase = new MovieDatabase();
    ratingSystem = new RatingSystem();
    
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock successful fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMovies)
    });

    await movieDatabase.loadDatabase();
    await ratingSystem.initialize();
  });

  describe('Complete workflow integration', () => {
    it('should handle complete user rating workflow', async () => {
      // User searches for movies
      const dramaMovies = movieDatabase.searchMovies({ genres: ['Drama'] });
      expect(dramaMovies.length).toBeGreaterThan(0);

      // User rates some movies
      const movie1 = movieDatabase.getMovie(1)!;
      const movie2 = movieDatabase.getMovie(2)!;
      
      expect(ratingSystem.addRating(1, 5.0, movie1)).toBe(true);
      expect(ratingSystem.addRating(2, 4.5, movie2)).toBe(true);

      // Check ratings were saved
      expect(ratingSystem.getRating(1)?.rating).toBe(5.0);
      expect(ratingSystem.getRating(2)?.rating).toBe(4.5);

      // Check genre preferences were updated
      const preferences = ratingSystem.getGenrePreferences();
      expect(preferences['Drama']).toBeGreaterThan(0.5);
      expect(preferences['Crime']).toBeGreaterThan(0.5);

      // Get user profile
      const profile = ratingSystem.getUserProfile();
      expect(profile.totalRatings).toBe(2);
      expect(profile.averageRating).toBe(4.8);
    });

    it('should generate personalized recommendations', () => {
      // User rates drama movies highly
      const movie1 = movieDatabase.getMovie(1)!; // Drama
      const movie2 = movieDatabase.getMovie(2)!; // Crime, Drama
      
      ratingSystem.addRating(1, 5.0, movie1);
      ratingSystem.addRating(2, 5.0, movie2);

      // Get genre preferences
      const preferences = ratingSystem.getGenrePreferences();
      
      // Generate recommendations based on preferences
      const recommendations = movieDatabase.getGenreBasedRecommendations(preferences, 5);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should prefer drama/crime movies
      const hasPreferredGenres = recommendations.some(movie => 
        movie.genres.some(genre => ['Drama', 'Crime'].includes(genre))
      );
      expect(hasPreferredGenres).toBe(true);
    });

    it('should find similar movies based on user ratings', () => {
      // User rates a specific movie
      const targetMovie = movieDatabase.getMovie(1)!;
      ratingSystem.addRating(1, 5.0, targetMovie);

      // Find similar movies
      const similarMovies = movieDatabase.findSimilarMovies(1, 3);
      expect(similarMovies.length).toBeGreaterThan(0);
      
      // Should have similarity scores
      expect(similarMovies[0].similarity).toBeGreaterThan(0);
      expect(similarMovies[0].similarity).toBeLessThanOrEqual(1);
    });

    it('should handle movie search with user context', () => {
      // User has rated some movies
      ratingSystem.addRating(1, 5.0);
      ratingSystem.addRating(2, 3.0);

      // Search for movies by different criteria
      const recentMovies = movieDatabase.searchMovies({ 
        yearRange: { min: 2000, max: 2020 } 
      });
      expect(recentMovies.length).toBeGreaterThan(0);

      const highRatedMovies = movieDatabase.searchMovies({ 
        ratingRange: { min: 8.5, max: 10.0 } 
      });
      expect(highRatedMovies.length).toBeGreaterThan(0);

      // User can filter out already rated movies
      const userRatings = ratingSystem.getRatingsMap();
      const unratedMovies = movieDatabase.getAllMovies().filter(
        movie => !userRatings.has(movie.id)
      );
      expect(unratedMovies.length).toBe(1); // Only movie 3 is unrated
    });

    it('should export and import user data', () => {
      // User rates some movies
      const movie1 = movieDatabase.getMovie(1)!;
      ratingSystem.addRating(1, 5.0, movie1);
      ratingSystem.addRating(2, 4.0);

      // Export data
      const exportedData = ratingSystem.exportData();
      expect(exportedData).toContain('"ratings"');
      expect(exportedData).toContain('"preferences"');

      // Clear data
      ratingSystem.clearAllData();
      expect(ratingSystem.getAllRatings()).toHaveLength(0);

      // Import data back
      const success = ratingSystem.importData(exportedData);
      expect(success).toBe(true);
      expect(ratingSystem.getAllRatings()).toHaveLength(2);
    });

    it('should handle rating validation in context', () => {
      const movie = movieDatabase.getMovie(1)!;
      
      // Valid ratings should work
      expect(ratingSystem.addRating(1, 4.5, movie)).toBe(true);
      
      // Invalid ratings should be rejected
      expect(ratingSystem.addRating(2, 6.0, movie)).toBe(false);
      expect(ratingSystem.addRating(3, 0, movie)).toBe(false);
      expect(ratingSystem.addRating(4, NaN, movie)).toBe(false);

      // Only valid rating should be stored
      expect(ratingSystem.getAllRatings()).toHaveLength(1);
    });

    it('should provide comprehensive movie statistics', () => {
      // Rate multiple movies
      ratingSystem.addRating(1, 5.0);
      ratingSystem.addRating(2, 4.0);
      ratingSystem.addRating(3, 3.0);

      // Get rating statistics
      const stats = ratingSystem.getRatingStatistics();
      expect(stats.totalRatings).toBe(3);
      expect(stats.averageRating).toBe(4.0);
      expect(stats.ratingDistribution[5]).toBe(1);
      expect(stats.ratingDistribution[4]).toBe(1);
      expect(stats.ratingDistribution[3]).toBe(1);
    });

    it('should handle edge cases gracefully', () => {
      // Empty search results
      const noResults = movieDatabase.searchMovies({ 
        genres: ['NonExistentGenre'] 
      });
      expect(noResults).toHaveLength(0);

      // Similarity with non-existent movie
      const noSimilar = movieDatabase.findSimilarMovies(999);
      expect(noSimilar).toHaveLength(0);

      // Rating non-existent movie
      expect(ratingSystem.addRating(999, 5.0)).toBe(true); // Should still work
      expect(ratingSystem.getRating(999)?.rating).toBe(5.0);

      // Empty preferences
      const emptyRecommendations = movieDatabase.getGenreBasedRecommendations({});
      expect(emptyRecommendations.length).toBeGreaterThan(0); // Should still return movies
    });
  });

  describe('Performance and scalability', () => {
    it('should handle multiple rapid operations', () => {
      const startTime = Date.now();
      
      // Perform multiple operations rapidly
      for (let i = 1; i <= 3; i++) {
        const movie = movieDatabase.getMovie(i);
        if (movie) {
          ratingSystem.addRating(i, Math.random() * 4 + 1, movie);
        }
      }

      // Search operations
      movieDatabase.searchMovies({ genres: ['Drama'] });
      movieDatabase.searchMovies({ yearRange: { min: 1990, max: 2020 } });
      
      // Similarity calculations
      movieDatabase.findSimilarMovies(1, 2);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should maintain data consistency', () => {
      // Add ratings
      ratingSystem.addRating(1, 5.0);
      ratingSystem.addRating(2, 4.0);
      
      const initialCount = ratingSystem.getAllRatings().length;
      
      // Update existing rating
      ratingSystem.addRating(1, 3.0);
      
      // Count should remain the same (update, not add)
      expect(ratingSystem.getAllRatings()).toHaveLength(initialCount);
      expect(ratingSystem.getRating(1)?.rating).toBe(3.0);
    });
  });
});