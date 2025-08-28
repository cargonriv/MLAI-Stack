import { ModelManager } from './modelManager';
import { Movie as MovieModel, IMovie } from '../models/Movie';
import { Rating as RatingModel, IRating } from '../models/Rating';
import { Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Core interfaces for collaborative filtering
export interface Movie {
  id: number;
  imdbID: string;
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

  private async loadMovieDatabase(): Promise<void> {
    const movieCount = await MovieModel.countDocuments();
    if (movieCount > 0) {
        const movies = await MovieModel.find();
        this.movieDatabase = new Map(movies.map(movie => [movie.id, movie.toObject()]));
        return;
    }

    const moviesToLoad: Omit<IMovie, '_id' | '__v'>[] = [];
    const csvFilePath = path.resolve(__dirname, '../../../public/data/SAMPLE_DATA.csv');

    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          const movie: any = {
          // const movie: unknown = {
                id: moviesToLoad.length + 1,
                imdbID: row.imdbID,
                title: row.Title,
                genres: row.Genre ? row.Genre.split(', ') : [],
                year: parseInt(row.Year, 10),
                averageRating: parseFloat(row.imdbRating),
                ratingCount: row.imdbVotes ? parseInt(row.imdbVotes.replace(/,/g, ''), 10) : 0,
            };
            moviesToLoad.push(movie);
        })
        .on('end', () => {
            console.log('CSV file successfully processed.');
            resolve();
        })
        .on('error', (error) => {
            console.error('Error processing CSV file:', error);
            reject(error);
        });
    });

    if (moviesToLoad.length > 0) {
        await MovieModel.insertMany(moviesToLoad);
        const movies = await MovieModel.find();
        this.movieDatabase = new Map(movies.map(movie => [movie.id, movie.toObject()]));
    }
  }

  private async initializeSVDModel(): Promise<void> {
    const sampleRatings = this.generateSampleRatings();
    await this.trainSVD(sampleRatings);
  }

  private generateSampleRatings(): Array<{userId: number, movieId: number, rating: number}> {
    const ratings: Array<{userId: number, movieId: number, rating: number}> = [];
    const numUsers = 100;
    const movieIds = Array.from(this.movieDatabase.keys());

    for (let userId = 0; userId < numUsers; userId++) {
      const numRatings = Math.floor(Math.random() * 15) + 5;
      const ratedMovies = new Set<number>();

      for (let i = 0; i < numRatings; i++) {
        let movieId: number;
        do {
          movieId = movieIds[Math.floor(Math.random() * movieIds.length)];
        } while (ratedMovies.has(movieId));
        
        ratedMovies.add(movieId);
        const rating = Math.max(1, Math.min(5, Math.round(Math.random() * 2 + 3 + (Math.random() - 0.5))));
        ratings.push({ userId, movieId, rating });
      }
    }

    return ratings;
  } 

  private async trainSVD(ratings: Array<{userId: number, movieId: number, rating: number}>): Promise<void> {
    const userIds = [...new Set(ratings.map(r => r.userId))];
    const movieIds = [...new Set(ratings.map(r => r.movieId))];
    
    const numUsers = userIds.length;
    const numItems = movieIds.length;
    const { numFactors, learningRate, regularization, iterations } = this.options;

    const userIdMap = new Map(userIds.map((id, idx) => [id, idx]));
    const itemIdMap = new Map(movieIds.map((id, idx) => [id, idx]));

    const globalMean = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    const userFeatures = Array.from({ length: numUsers }, () => new Float32Array(numFactors).map(() => (Math.random() - 0.5) * 0.1));
    const itemFeatures = Array.from({ length: numItems }, () => new Float32Array(numFactors).map(() => (Math.random() - 0.5) * 0.1));
    const userBias = new Float32Array(numUsers).fill(0);
    const itemBias = new Float32Array(numItems).fill(0);

    for (let iter = 0; iter < iterations; iter++) {
      const shuffledRatings = [...ratings].sort(() => Math.random() - 0.5);

      for (const { userId, movieId, rating } of shuffledRatings) {
        const userIdx = userIdMap.get(userId)!;
        const itemIdx = itemIdMap.get(movieId)!;

        let prediction = globalMean + userBias[userIdx] + itemBias[itemIdx];
        for (let f = 0; f < numFactors; f++) {
          prediction += userFeatures[userIdx][f] * itemFeatures[itemIdx][f];
        }

        const error = rating - prediction;

        const userBiasOld = userBias[userIdx];
        const itemBiasOld = itemBias[itemIdx];
        
        userBias[userIdx] += learningRate * (error - regularization * userBiasOld);
        itemBias[itemIdx] += learningRate * (error - regularization * itemBiasOld);

        for (let f = 0; f < numFactors; f++) {
          const userFeatureOld = userFeatures[userIdx][f];
          const itemFeatureOld = itemFeatures[itemIdx][f];

          userFeatures[userIdx][f] += learningRate * (error * itemFeatureOld - regularization * userFeatureOld);
          itemFeatures[itemIdx][f] += learningRate * (error * userFeatureOld - regularization * itemFeatureOld);
        }
      }
    }

    this.svdModel = {
      userFeatures, itemFeatures, userBias, itemBias, globalMean, numFactors, numUsers, numItems
    };
  }

  async generateRecommendations(
      userId: Types.ObjectId, 
      numRecommendations: number = 10
  ): Promise<RecommendationResult[]> {
      if (!this.isInitialized) await this.initialize();

      const userRatingsDocs = await RatingModel.find({ user: userId });
      const userRatings: MovieRating[] = userRatingsDocs.map(r => r.toObject());

      const userProfile = this.createUserProfile(userRatings);

      if (userRatings.length < this.options.minRatings) {
          return this.handleColdStart(userRatings, numRecommendations);
      }

      const ratedMovieIds = new Set(userRatings.map(r => r.movieId));
      const predictions: RecommendationResult[] = [];

      for (const [movieId, movie] of this.movieDatabase) {
          if (!ratedMovieIds.has(movieId)) {
              const { predictedRating, confidence } = this.predictRating(userProfile, movieId);

              if (predictedRating > 3) {
                  predictions.push({
                      movieId,
                      title: movie.title,
                      predictedRating,
                      confidence,
                      genres: movie.genres,
                      explanation: this.generateExplanation(userProfile, movie, predictedRating)
                  });
              }
          }
      }

      return predictions
          .sort((a, b) => b.predictedRating - a.predictedRating)
          .slice(0, numRecommendations);
  }

  private handleColdStart(userRatings: MovieRating[], numRecommendations: number): RecommendationResult[] {
    const genrePreferences = this.calculateGenrePreferences(userRatings);
    const recommendations: RecommendationResult[] = [];

    const moviesByPopularity = Array.from(this.movieDatabase.values())
      .filter(movie => {
        if (userRatings.length > 0) {
          return movie.genres.some(genre => genrePreferences[genre] > 0);
        }
        return true;
      })
      .sort((a, b) => (b.averageRating * Math.log(b.ratingCount)) - (a.averageRating * Math.log(a.ratingCount)))
      .slice(0, numRecommendations * 2);

    for (const movie of moviesByPopularity.slice(0, numRecommendations)) {
      const confidence = userRatings.length === 0 ? 0.3 : 0.5;
      const explanation = userRatings.length === 0 
        ? `Popular movie with high ratings (${movie.averageRating.toFixed(1)}/10)`
        : `Popular ${movie.genres.join(', ')} movie matching your preferences`;

      recommendations.push({
        movieId: movie.id,
        title: movie.title,
        predictedRating: movie.averageRating / 2,
        confidence,
        genres: movie.genres,
        explanation
      });
    }

    return recommendations;
  }

  private createUserProfile(userRatings: MovieRating[]): UserProfile {
      const ratings = new Map(userRatings.map(r => [r.movieId, r.rating]));
      const preferences = this.calculateGenrePreferences(userRatings);

      return { ratings, preferences };
  }

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

  private predictRating(userProfile: UserProfile, movieId: number): { predictedRating: number; confidence: number; } {
      if (!this.svdModel) {
          throw new Error('SVD model not available');
      }

      const movieIdx = [...this.movieDatabase.keys()].indexOf(movieId);
      if (movieIdx === -1) throw new Error(`Movie ${movieId} not found`);

      // Cold start user
      const genreScore = this.calculateGenreScore(userProfile.preferences, this.movieDatabase.get(movieId)!.genres);
      const baseRating = this.movieDatabase.get(movieId)!.averageRating / 2;
      const contentBasedRating = (genreScore * 0.7) + (baseRating * 0.3);
      const genreMatch = this.movieDatabase.get(movieId)!.genres.some(genre => userProfile.preferences[genre] > 3.5);
      const confidence = Math.min(0.9, 0.4 + (userProfile.ratings.size * 0.05) + (genreMatch ? 0.2 : 0));

      return {
          predictedRating: Math.max(1, Math.min(5, contentBasedRating)),
          confidence
      };
  }

  private calculateGenreScore(preferences: GenrePreferences, genres: string[]): number {
    if (Object.keys(preferences).length === 0) return 3.5;

    let totalScore = 0;
    let matchingGenres = 0;

    for (const genre of genres) {
      if (preferences[genre] !== undefined) {
        totalScore += preferences[genre];
        matchingGenres++;
      }
    }

    if (matchingGenres === 0) {
      const avgPreference = Object.values(preferences).reduce((sum, score) => sum + score, 0) / Object.values(preferences).length;
      return avgPreference;
    }

    return totalScore / matchingGenres;
  }

  private generateExplanation(userProfile: UserProfile, movie: Movie, predictedRating: number): string {
    const preferences = userProfile.preferences;
    const matchingGenres = movie.genres.filter(genre => preferences[genre] && preferences[genre] > 3.5);
    
    if (matchingGenres.length > 0) {
      const genreText = matchingGenres.length === 1 ? matchingGenres[0] : matchingGenres.slice(0, -1).join(', ') + ' and ' + matchingGenres.slice(-1);
      return `Recommended because you enjoy ${genreText} movies (predicted rating: ${predictedRating.toFixed(1)})`;
    }

    return `Popular ${movie.genres.join(', ')} movie with high ratings (${movie.averageRating.toFixed(1)}/10)`;
  }
}

export default CollaborativeFilteringEngine;