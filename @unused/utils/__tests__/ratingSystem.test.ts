import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RatingSystem } from '../ratingSystem';
import { Movie } from '../movieDatabase';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const mockMovie: Movie = {
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
};

describe('RatingSystem', () => {
  let ratingSystem: RatingSystem;

  beforeEach(() => {
    ratingSystem = new RatingSystem();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await ratingSystem.initialize();
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(ratingSystem.initialize()).resolves.not.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      await ratingSystem.initialize();
      await ratingSystem.initialize();
      
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(2); // Once for ratings, once for preferences
    });
  });

  describe('rating validation', () => {
    it('should validate correct ratings', () => {
      const result = ratingSystem.validateRating(4.5);
      expect(result.isValid).toBe(true);
      expect(result.normalizedRating).toBe(4.5);
    });

    it('should normalize ratings to one decimal place', () => {
      const result = ratingSystem.validateRating(4.567);
      expect(result.isValid).toBe(true);
      expect(result.normalizedRating).toBe(4.6);
    });

    it('should reject non-numeric ratings', () => {
      const result = ratingSystem.validateRating(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('should reject ratings below minimum', () => {
      const result = ratingSystem.validateRating(0.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('between 1 and 5');
    });

    it('should reject ratings above maximum', () => {
      const result = ratingSystem.validateRating(5.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('between 1 and 5');
    });
  });

  describe('rating management', () => {
    beforeEach(async () => {
      await ratingSystem.initialize();
    });

    it('should add valid ratings', () => {
      const success = ratingSystem.addRating(1, 4.5, mockMovie);
      expect(success).toBe(true);
      
      const rating = ratingSystem.getRating(1);
      expect(rating?.rating).toBe(4.5);
      expect(rating?.movieId).toBe(1);
    });

    it('should reject invalid ratings', () => {
      const success = ratingSystem.addRating(1, 6.0);
      expect(success).toBe(false);
      
      const rating = ratingSystem.getRating(1);
      expect(rating).toBeUndefined();
    });

    it('should update existing ratings', () => {
      ratingSystem.addRating(1, 4.0);
      ratingSystem.addRating(1, 5.0);
      
      const rating = ratingSystem.getRating(1);
      expect(rating?.rating).toBe(5.0);
    });

    it('should remove ratings', () => {
      ratingSystem.addRating(1, 4.0);
      const removed = ratingSystem.removeRating(1);
      
      expect(removed).toBe(true);
      expect(ratingSystem.getRating(1)).toBeUndefined();
    });

    it('should return false when removing non-existent rating', () => {
      const removed = ratingSystem.removeRating(999);
      expect(removed).toBe(false);
    });

    it('should get all ratings', () => {
      ratingSystem.addRating(1, 4.0);
      ratingSystem.addRating(2, 5.0);
      
      const allRatings = ratingSystem.getAllRatings();
      expect(allRatings).toHaveLength(2);
    });

    it('should get ratings as map', () => {
      ratingSystem.addRating(1, 4.0);
      
      const ratingsMap = ratingSystem.getRatingsMap();
      expect(ratingsMap.has(1)).toBe(true);
      expect(ratingsMap.get(1)?.rating).toBe(4.0);
    });
  });

  describe('genre preferences', () => {
    beforeEach(async () => {
      await ratingSystem.initialize();
    });

    it('should update genre preferences when rating with movie data', () => {
      ratingSystem.addRating(1, 5.0, mockMovie);
      
      const preferences = ratingSystem.getGenrePreferences();
      expect(preferences['Drama']).toBeGreaterThan(0.5);
    });

    it('should get empty preferences initially', () => {
      const preferences = ratingSystem.getGenrePreferences();
      expect(Object.keys(preferences)).toHaveLength(0);
    });
  });

  describe('user profile', () => {
    beforeEach(async () => {
      await ratingSystem.initialize();
    });

    it('should generate user profile', () => {
      ratingSystem.addRating(1, 4.0);
      ratingSystem.addRating(2, 5.0);
      
      const profile = ratingSystem.getUserProfile();
      expect(profile.totalRatings).toBe(2);
      expect(profile.averageRating).toBe(4.5);
      expect(profile.lastUpdated).toBeGreaterThan(0);
    });

    it('should handle empty profile', () => {
      const profile = ratingSystem.getUserProfile();
      expect(profile.totalRatings).toBe(0);
      expect(profile.averageRating).toBe(0);
      expect(profile.lastUpdated).toBe(0);
    });
  });

  describe('data management', () => {
    beforeEach(async () => {
      await ratingSystem.initialize();
    });

    it('should clear all data', () => {
      ratingSystem.addRating(1, 4.0);
      ratingSystem.clearAllData();
      
      expect(ratingSystem.getAllRatings()).toHaveLength(0);
      expect(Object.keys(ratingSystem.getGenrePreferences())).toHaveLength(0);
    });

    it('should export data', () => {
      ratingSystem.addRating(1, 4.0);
      
      const exported = ratingSystem.exportData();
      const data = JSON.parse(exported);
      
      expect(data.ratings).toHaveLength(1);
      expect(data.exportDate).toBeDefined();
    });

    it('should import valid data', () => {
      const importData = JSON.stringify({
        ratings: [[1, { movieId: 1, rating: 4.0, timestamp: Date.now() }]],
        preferences: { 'Drama': 0.8 }
      });
      
      const success = ratingSystem.importData(importData);
      expect(success).toBe(true);
      
      const rating = ratingSystem.getRating(1);
      expect(rating?.rating).toBe(4.0);
    });

    it('should reject invalid import data', () => {
      const success = ratingSystem.importData('invalid json');
      expect(success).toBe(false);
    });

    it('should reject malformed import data', () => {
      const importData = JSON.stringify({ invalid: 'data' });
      const success = ratingSystem.importData(importData);
      expect(success).toBe(false);
    });
  });

  describe('rating statistics', () => {
    beforeEach(async () => {
      await ratingSystem.initialize();
    });

    it('should generate rating statistics', () => {
      ratingSystem.addRating(1, 4.0);
      ratingSystem.addRating(2, 5.0);
      ratingSystem.addRating(3, 4.0);
      
      const stats = ratingSystem.getRatingStatistics();
      expect(stats.totalRatings).toBe(3);
      expect(stats.averageRating).toBe(4.3);
      expect(stats.ratingDistribution[4]).toBe(2);
      expect(stats.ratingDistribution[5]).toBe(1);
    });

    it('should handle empty statistics', () => {
      const stats = ratingSystem.getRatingStatistics();
      expect(stats.totalRatings).toBe(0);
      expect(stats.averageRating).toBe(0);
      expect(Object.keys(stats.ratingDistribution)).toHaveLength(0);
    });
  });

  describe('localStorage persistence', () => {
    beforeEach(async () => {
      await ratingSystem.initialize();
    });

    it('should save ratings to localStorage', () => {
      ratingSystem.addRating(1, 4.0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'movieRatings',
        expect.stringContaining('1')
      );
    });

    it('should load ratings from localStorage', async () => {
      const storedRatings = JSON.stringify([[1, { movieId: 1, rating: 4.0, timestamp: Date.now() }]]);
      localStorageMock.getItem.mockReturnValue(storedRatings);
      
      const newRatingSystem = new RatingSystem();
      await newRatingSystem.initialize();
      
      const rating = newRatingSystem.getRating(1);
      expect(rating?.rating).toBe(4.0);
    });

    it('should handle localStorage errors when saving', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      expect(() => ratingSystem.addRating(1, 4.0)).not.toThrow();
    });

    it('should handle localStorage errors when loading', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const newRatingSystem = new RatingSystem();
      await expect(newRatingSystem.initialize()).resolves.not.toThrow();
    });
  });
});