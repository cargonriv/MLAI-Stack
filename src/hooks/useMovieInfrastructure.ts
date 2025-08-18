/**
 * React hook for movie infrastructure integration
 * Provides easy access to movie database and rating system
 */

import { useState, useEffect, useCallback } from 'react';
import { movieInfrastructure, MovieInfrastructureStatus } from '@/utils/movieInfrastructure';
import { Movie, MovieSearchFilters, MovieSimilarity } from '@/utils/movieDatabase';
import { UserRating, GenrePreferences, UserProfile } from '@/utils/ratingSystem';

export interface UseMovieInfrastructureReturn {
  // Status
  status: MovieInfrastructureStatus;
  isLoading: boolean;
  error: string | null;

  // Movie database functions
  searchMovies: (filters?: MovieSearchFilters) => Movie[];
  getMovie: (id: number) => Movie | undefined;
  getAllMovies: () => Movie[];
  getAllGenres: () => string[];
  findSimilarMovies: (movieId: number, limit?: number) => MovieSimilarity[];
  getGenreBasedRecommendations: (preferences: GenrePreferences, limit?: number) => Movie[];

  // Rating system functions
  addRating: (movieId: number, rating: number, movie?: Movie) => boolean;
  removeRating: (movieId: number) => boolean;
  getRating: (movieId: number) => UserRating | undefined;
  getAllRatings: () => UserRating[];
  getUserProfile: () => UserProfile;
  getGenrePreferences: () => GenrePreferences;
  clearAllRatings: () => void;
  exportRatings: () => string;
  importRatings: (data: string) => boolean;

  // Utility functions
  refresh: () => Promise<void>;
}

export function useMovieInfrastructure(): UseMovieInfrastructureReturn {
  const [status, setStatus] = useState<MovieInfrastructureStatus>({
    databaseLoaded: false,
    ratingSystemInitialized: false,
    totalMovies: 0,
    totalRatings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize infrastructure
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await movieInfrastructure.initialize();
        
        if (mounted) {
          setStatus(movieInfrastructure.getStatus());
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize movie infrastructure';
          setError(errorMessage);
          setIsLoading(false);
          setStatus(prev => ({ ...prev, error: errorMessage }));
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // Movie database functions
  const searchMovies = useCallback((filters?: MovieSearchFilters): Movie[] => {
    if (!movieInfrastructure.isReady()) return [];
    return movieInfrastructure.getDatabase().searchMovies(filters);
  }, []);

  const getMovie = useCallback((id: number): Movie | undefined => {
    if (!movieInfrastructure.isReady()) return undefined;
    return movieInfrastructure.getDatabase().getMovie(id);
  }, []);

  const getAllMovies = useCallback((): Movie[] => {
    if (!movieInfrastructure.isReady()) return [];
    return movieInfrastructure.getDatabase().getAllMovies();
  }, []);

  const getAllGenres = useCallback((): string[] => {
    if (!movieInfrastructure.isReady()) return [];
    return movieInfrastructure.getDatabase().getAllGenres();
  }, []);

  const findSimilarMovies = useCallback((movieId: number, limit?: number): MovieSimilarity[] => {
    if (!movieInfrastructure.isReady()) return [];
    return movieInfrastructure.getDatabase().findSimilarMovies(movieId, limit);
  }, []);

  const getGenreBasedRecommendations = useCallback((preferences: GenrePreferences, limit?: number): Movie[] => {
    if (!movieInfrastructure.isReady()) return [];
    return movieInfrastructure.getDatabase().getGenreBasedRecommendations(preferences, limit);
  }, []);

  // Rating system functions
  const addRating = useCallback((movieId: number, rating: number, movie?: Movie): boolean => {
    if (!movieInfrastructure.isReady()) return false;
    const success = movieInfrastructure.getRatingSystem().addRating(movieId, rating, movie);
    if (success) {
      setStatus(movieInfrastructure.getStatus());
    }
    return success;
  }, []);

  const removeRating = useCallback((movieId: number): boolean => {
    if (!movieInfrastructure.isReady()) return false;
    const success = movieInfrastructure.getRatingSystem().removeRating(movieId);
    if (success) {
      setStatus(movieInfrastructure.getStatus());
    }
    return success;
  }, []);

  const getRating = useCallback((movieId: number): UserRating | undefined => {
    if (!movieInfrastructure.isReady()) return undefined;
    return movieInfrastructure.getRatingSystem().getRating(movieId);
  }, []);

  const getAllRatings = useCallback((): UserRating[] => {
    if (!movieInfrastructure.isReady()) return [];
    return movieInfrastructure.getRatingSystem().getAllRatings();
  }, []);

  const getUserProfile = useCallback((): UserProfile => {
    if (!movieInfrastructure.isReady()) {
      return {
        ratings: new Map(),
        preferences: {},
        totalRatings: 0,
        averageRating: 0,
        lastUpdated: 0
      };
    }
    return movieInfrastructure.getRatingSystem().getUserProfile();
  }, []);

  const getGenrePreferences = useCallback((): GenrePreferences => {
    if (!movieInfrastructure.isReady()) return {};
    return movieInfrastructure.getRatingSystem().getGenrePreferences();
  }, []);

  const clearAllRatings = useCallback((): void => {
    if (!movieInfrastructure.isReady()) return;
    movieInfrastructure.getRatingSystem().clearAllData();
    setStatus(movieInfrastructure.getStatus());
  }, []);

  const exportRatings = useCallback((): string => {
    if (!movieInfrastructure.isReady()) return '{}';
    return movieInfrastructure.getRatingSystem().exportData();
  }, []);

  const importRatings = useCallback((data: string): boolean => {
    if (!movieInfrastructure.isReady()) return false;
    const success = movieInfrastructure.getRatingSystem().importData(data);
    if (success) {
      setStatus(movieInfrastructure.getStatus());
    }
    return success;
  }, []);

  // Utility functions
  const refresh = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await movieInfrastructure.initialize();
      setStatus(movieInfrastructure.getStatus());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh movie infrastructure';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Status
    status,
    isLoading,
    error,

    // Movie database functions
    searchMovies,
    getMovie,
    getAllMovies,
    getAllGenres,
    findSimilarMovies,
    getGenreBasedRecommendations,

    // Rating system functions
    addRating,
    removeRating,
    getRating,
    getAllRatings,
    getUserProfile,
    getGenrePreferences,
    clearAllRatings,
    exportRatings,
    importRatings,

    // Utility functions
    refresh
  };
}