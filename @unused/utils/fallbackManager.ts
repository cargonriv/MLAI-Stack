/**
 * Fallback model manager for handling model failures and providing alternative implementations
 */

import { SentimentResult, RecommendationResult, MovieRating } from './mlUtils';
import { deviceCompatibility } from './deviceCompatibility';

export interface FallbackModelConfig {
  type: 'sentiment' | 'recommendation';
  fallbackLevel: 'basic' | 'rule-based' | 'statistical';
  enableCaching: boolean;
  cacheSize: number;
}

export interface SentimentFallbackResult extends SentimentResult {
  fallbackUsed: boolean;
  fallbackReason: string;
}

export interface RecommendationFallbackResult {
  recommendations: RecommendationResult[];
  fallbackUsed: boolean;
  fallbackReason: string;
}

export class FallbackModelManager {
  private static instance: FallbackModelManager;
  private sentimentCache: Map<string, SentimentFallbackResult> = new Map();
  private recommendationCache: Map<string, RecommendationFallbackResult> = new Map();
  private ruleBasedSentimentWords: Map<string, number> = new Map();
  private popularMovies: RecommendationResult[] = [];

  private constructor() {
    this.initializeSentimentRules();
    this.initializePopularMovies();
  }

  static getInstance(): FallbackModelManager {
    if (!FallbackModelManager.instance) {
      FallbackModelManager.instance = new FallbackModelManager();
    }
    return FallbackModelManager.instance;
  }

  /**
   * Initialize rule-based sentiment analysis
   */
  private initializeSentimentRules(): void {
    // Positive words
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love',
      'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'perfect', 'brilliant', 'outstanding',
      'superb', 'magnificent', 'marvelous', 'terrific', 'fabulous', 'incredible', 'remarkable',
      'exceptional', 'impressive', 'delightful', 'charming', 'beautiful', 'nice', 'fine'
    ];

    // Negative words
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike', 'annoying',
      'frustrating', 'disappointing', 'poor', 'worst', 'useless', 'pathetic', 'ridiculous',
      'stupid', 'boring', 'dull', 'ugly', 'nasty', 'gross', 'unpleasant', 'annoying',
      'irritating', 'infuriating', 'appalling', 'atrocious', 'abysmal', 'deplorable'
    ];

    // Assign scores
    positiveWords.forEach(word => this.ruleBasedSentimentWords.set(word, 1));
    negativeWords.forEach(word => this.ruleBasedSentimentWords.set(word, -1));

    // Intensifiers
    const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally'];
    intensifiers.forEach(word => this.ruleBasedSentimentWords.set(word, 0.5));

    // Negations
    const negations = ['not', 'no', 'never', 'nothing', 'nobody', 'nowhere', 'neither', 'nor'];
    negations.forEach(word => this.ruleBasedSentimentWords.set(word, -0.5));
  }

  /**
   * Initialize popular movies for fallback recommendations
   */
  private initializePopularMovies(): void {
    this.popularMovies = [
      {
        movieId: 1,
        title: "The Shawshank Redemption",
        predictedRating: 4.8,
        confidence: 0.9,
        genres: ["Drama"],
        explanation: "Highly rated classic drama film"
      },
      {
        movieId: 2,
        title: "The Godfather",
        predictedRating: 4.7,
        confidence: 0.9,
        genres: ["Crime", "Drama"],
        explanation: "Acclaimed crime drama masterpiece"
      },
      {
        movieId: 3,
        title: "The Dark Knight",
        predictedRating: 4.6,
        confidence: 0.9,
        genres: ["Action", "Crime", "Drama"],
        explanation: "Popular superhero action film"
      },
      {
        movieId: 6,
        title: "Inception",
        predictedRating: 4.5,
        confidence: 0.8,
        genres: ["Action", "Sci-Fi", "Thriller"],
        explanation: "Mind-bending sci-fi thriller"
      },
      {
        movieId: 7,
        title: "The Matrix",
        predictedRating: 4.4,
        confidence: 0.8,
        genres: ["Action", "Sci-Fi"],
        explanation: "Revolutionary sci-fi action film"
      },
      {
        movieId: 5,
        title: "Forrest Gump",
        predictedRating: 4.4,
        confidence: 0.8,
        genres: ["Drama", "Romance"],
        explanation: "Heartwarming drama with universal appeal"
      }
    ];
  }

  /**
   * Fallback sentiment analysis using rule-based approach
   */
  async analyzeSentimentFallback(
    text: string,
    reason: string = 'Model unavailable'
  ): Promise<SentimentFallbackResult> {
    const cacheKey = `sentiment_${text.toLowerCase().trim()}`;
    
    // Check cache first
    if (this.sentimentCache.has(cacheKey)) {
      const cached = this.sentimentCache.get(cacheKey)!;
      return { ...cached, fallbackUsed: true, fallbackReason: reason };
    }

    const startTime = performance.now();
    
    try {
      // Clean and tokenize text
      const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
      const words = cleanText.split(/\s+/).filter(word => word.length > 0);
      
      let sentimentScore = 0;
      let wordCount = 0;
      let intensifier = 1;
      let negation = false;
      
      // Analyze each word
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordScore = this.ruleBasedSentimentWords.get(word);
        
        if (wordScore !== undefined) {
          if (Math.abs(wordScore) === 0.5) {
            // Handle intensifiers and negations
            if (wordScore > 0) {
              intensifier = 1.5; // Intensifier
            } else {
              negation = !negation; // Negation
            }
          } else {
            // Regular sentiment word
            let adjustedScore = wordScore * intensifier;
            if (negation) {
              adjustedScore = -adjustedScore;
            }
            
            sentimentScore += adjustedScore;
            wordCount++;
            
            // Reset modifiers
            intensifier = 1;
            negation = false;
          }
        }
      }
      
      // Calculate final sentiment
      const normalizedScore = wordCount > 0 ? sentimentScore / wordCount : 0;
      
      let label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      let confidence: number;
      
      if (normalizedScore > 0.1) {
        label = 'POSITIVE';
        confidence = Math.min(0.8, 0.5 + Math.abs(normalizedScore) * 0.3);
      } else if (normalizedScore < -0.1) {
        label = 'NEGATIVE';
        confidence = Math.min(0.8, 0.5 + Math.abs(normalizedScore) * 0.3);
      } else {
        label = 'NEUTRAL';
        confidence = 0.6;
      }
      
      // Create scores object
      const scores = {
        positive: label === 'POSITIVE' ? confidence : 1 - confidence,
        negative: label === 'NEGATIVE' ? confidence : 1 - confidence,
        neutral: label === 'NEUTRAL' ? confidence : undefined
      };
      
      const processingTime = performance.now() - startTime;
      
      const result: SentimentFallbackResult = {
        label,
        confidence,
        scores,
        processingTime,
        modelInfo: {
          name: 'Rule-based Fallback',
          size: '< 1KB',
          architecture: 'Dictionary-based'
        },
        fallbackUsed: true,
        fallbackReason: reason
      };
      
      // Cache the result
      this.sentimentCache.set(cacheKey, result);
      this.limitCacheSize(this.sentimentCache, 100);
      
      return result;
      
    } catch (error) {
      // Ultimate fallback - neutral sentiment
      return {
        label: 'NEUTRAL',
        confidence: 0.5,
        scores: { positive: 0.5, negative: 0.5 },
        processingTime: performance.now() - startTime,
        modelInfo: {
          name: 'Basic Fallback',
          size: '< 1KB',
          architecture: 'Static'
        },
        fallbackUsed: true,
        fallbackReason: `${reason} - ${(error as Error).message}`
      };
    }
  }

  /**
   * Fallback recommendation system using popularity and genre-based filtering
   */
  async generateRecommendationsFallback(
    userRatings: MovieRating[],
    numRecommendations: number = 6,
    reason: string = 'Model unavailable'
  ): Promise<RecommendationFallbackResult> {
    const cacheKey = `recommendations_${JSON.stringify(userRatings.map(r => ({ id: r.movieId, rating: r.rating })))}_${numRecommendations}`;
    
    // Check cache first
    if (this.recommendationCache.has(cacheKey)) {
      const cached = this.recommendationCache.get(cacheKey)!;
      return { ...cached, fallbackUsed: true, fallbackReason: reason };
    }

    try {
      let recommendations: RecommendationResult[];
      
      if (userRatings.length === 0) {
        // Cold start - return popular movies
        recommendations = this.popularMovies.slice(0, numRecommendations);
      } else {
        // Genre-based recommendations
        recommendations = this.generateGenreBasedRecommendations(userRatings, numRecommendations);
      }
      
      const result: RecommendationFallbackResult = {
        recommendations,
        fallbackUsed: true,
        fallbackReason: reason
      };
      
      // Cache the result
      this.recommendationCache.set(cacheKey, result);
      this.limitCacheSize(this.recommendationCache, 50);
      
      return result;
      
    } catch (error) {
      // Ultimate fallback - return popular movies
      return {
        recommendations: this.popularMovies.slice(0, numRecommendations),
        fallbackUsed: true,
        fallbackReason: `${reason} - ${(error as Error).message}`
      };
    }
  }

  /**
   * Generate genre-based recommendations
   */
  private generateGenreBasedRecommendations(
    userRatings: MovieRating[],
    numRecommendations: number
  ): RecommendationResult[] {
    // Calculate genre preferences
    const genreScores: Map<string, { total: number; count: number }> = new Map();
    
    for (const rating of userRatings) {
      if (rating.rating >= 4) { // Only consider highly rated movies
        for (const genre of rating.genres) {
          const current = genreScores.get(genre) || { total: 0, count: 0 };
          genreScores.set(genre, {
            total: current.total + rating.rating,
            count: current.count + 1
          });
        }
      }
    }
    
    // Calculate average scores for each genre
    const genrePreferences: Map<string, number> = new Map();
    for (const [genre, scores] of genreScores) {
      genrePreferences.set(genre, scores.total / scores.count);
    }
    
    // Score popular movies based on genre preferences
    const scoredMovies = this.popularMovies.map(movie => {
      let genreScore = 0;
      let matchingGenres = 0;
      
      for (const genre of movie.genres) {
        const preference = genrePreferences.get(genre);
        if (preference) {
          genreScore += preference;
          matchingGenres++;
        }
      }
      
      const avgGenreScore = matchingGenres > 0 ? genreScore / matchingGenres : 3.5;
      const adjustedRating = (movie.predictedRating + avgGenreScore) / 2;
      const confidence = matchingGenres > 0 ? 0.7 : 0.4;
      
      return {
        ...movie,
        predictedRating: adjustedRating,
        confidence,
        explanation: matchingGenres > 0 
          ? `Recommended based on your preference for ${movie.genres.slice(0, 2).join(' and ')} movies`
          : `Popular ${movie.genres.join(', ')} movie`
      };
    });
    
    // Sort by adjusted rating and return top N
    return scoredMovies
      .sort((a, b) => b.predictedRating - a.predictedRating)
      .slice(0, numRecommendations);
  }

  /**
   * Get offline cached results
   */
  getOfflineSentimentResult(text: string): SentimentFallbackResult | null {
    const cacheKey = `sentiment_${text.toLowerCase().trim()}`;
    return this.sentimentCache.get(cacheKey) || null;
  }

  getOfflineRecommendationResult(userRatings: MovieRating[], numRecommendations: number = 6): RecommendationFallbackResult | null {
    const cacheKey = `recommendations_${JSON.stringify(userRatings.map(r => ({ id: r.movieId, rating: r.rating })))}_${numRecommendations}`;
    return this.recommendationCache.get(cacheKey) || null;
  }

  /**
   * Check if device supports fallback mode
   */
  async canUseFallback(): Promise<boolean> {
    try {
      const compatibility = await deviceCompatibility.checkCompatibility();
      return compatibility.features.indexeddb && compatibility.features.webworkers;
    } catch {
      return true; // Assume basic fallback is always available
    }
  }

  /**
   * Get fallback capabilities
   */
  getFallbackCapabilities(): {
    sentiment: boolean;
    recommendation: boolean;
    offline: boolean;
    caching: boolean;
  } {
    return {
      sentiment: true,
      recommendation: true,
      offline: true,
      caching: true
    };
  }

  /**
   * Limit cache size to prevent memory issues
   */
  private limitCacheSize<T>(cache: Map<string, T>, maxSize: number): void {
    if (cache.size > maxSize) {
      const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxSize);
      keysToDelete.forEach(key => cache.delete(key));
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.sentimentCache.clear();
    this.recommendationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    sentimentCacheSize: number;
    recommendationCacheSize: number;
    totalMemoryUsage: number;
  } {
    return {
      sentimentCacheSize: this.sentimentCache.size,
      recommendationCacheSize: this.recommendationCache.size,
      totalMemoryUsage: (this.sentimentCache.size + this.recommendationCache.size) * 1024 // Rough estimate
    };
  }

  /**
   * Preload popular content for offline use
   */
  async preloadOfflineContent(): Promise<void> {
    // Pre-analyze common sentiment phrases
    const commonPhrases = [
      "I love this",
      "This is great",
      "Not good",
      "Terrible experience",
      "Amazing product",
      "Poor quality",
      "Excellent service",
      "Very disappointed"
    ];

    for (const phrase of commonPhrases) {
      await this.analyzeSentimentFallback(phrase, 'Preloaded for offline use');
    }

    console.log('Offline content preloaded');
  }
}

// Export singleton instance
export const fallbackManager = FallbackModelManager.getInstance();

export default FallbackModelManager;