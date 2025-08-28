import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, RefreshCw, Search, Info, Zap, Brain, TrendingUp, Shield, AlertCircle, Wifi, WifiOff, BarChart3, Lightbulb, Smartphone, Battery } from "lucide-react";
// import { TouchRating, SwipeableCard, MobileModal, TouchSlider } from "../MobileOptimizedInterface";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { CollaborativeFilteringEngine, type MovieRating, type RecommendationResult, type Movie } from "@/utils/collaborativeFiltering";
import { modelManager } from "@/utils/modelManager";
import { errorHandler } from "@/utils/errorHandler";
import { deviceCompatibility } from "@/utils/deviceCompatibility";
import { fallbackManager, RecommendationFallbackResult } from "@/utils/fallbackManager";
import ErrorBoundary from "@/components/ErrorBoundary";
import RecommendationExplanation, { type RecommendationExplanationData } from "@/components/RecommendationExplanation";
import PerformanceComparison, { type AlgorithmMetrics } from "@/components/PerformanceComparison";

interface CollaborativeFilteringState {
  userRatings: MovieRating[];
  recommendations: RecommendationResult[] | RecommendationFallbackResult['recommendations'];
  isModelLoading: boolean;
  isGenerating: boolean;
  modelLoadProgress: number;
  algorithm: 'svd' | 'neural' | 'hybrid';
  error: string | null;
  modelReady: boolean;
  availableMovies: Movie[];
  searchQuery: string;
  showModelInfo: boolean;
  fallbackMode: boolean;
  networkStatus: 'online' | 'offline' | 'slow';
  deviceCompatible: boolean;
  retryCount: number;
  warnings: string[];
  fallbackReason?: string;
  selectedRecommendation: RecommendationResult | null;
  showExplanation: boolean;
  showComparison: boolean;
}

const RecommendationDemoContent = () => {
  const [state, setState] = useState<CollaborativeFilteringState>({
    userRatings: [],
    recommendations: [],
    isModelLoading: false,
    isGenerating: false,
    modelLoadProgress: 0,
    algorithm: 'svd',
    error: null,
    modelReady: false,
    availableMovies: [],
    searchQuery: '',
    showModelInfo: false,
    fallbackMode: false,
    networkStatus: 'online',
    deviceCompatible: true,
    retryCount: 0,
    warnings: [],
    selectedRecommendation: null,
    showExplanation: false,
    showComparison: false
  });

  const [cfEngine, setCfEngine] = useState<CollaborativeFilteringEngine | null>(null);

  // Mobile optimization
  const {
    isMobile,
    isTablet,
    hasTouch,
    performanceLevel,
    networkBandwidth,
    batteryLevel,
    isCharging,
    shouldOptimize,
    qualitySettings,
    loadingProgress,
    loadModelProgressively,
    getMobileRecommendations,
    shouldDisableFeature,
    getTouchSettings
  } = useMobileOptimization({
    enableBatteryOptimization: true,
    enableNetworkOptimization: true,
    enablePerformanceOptimization: true,
    autoAdjustQuality: true,
    modelType: 'recommendation'
  });

  // Initialize collaborative filtering engine
  useEffect(() => {
    const initializeWithErrorHandling = async () => {
      // Check device compatibility first
      try {
        const compatibility = await deviceCompatibility.checkCompatibility();
        setState(prev => ({ 
          ...prev, 
          deviceCompatible: compatibility.isSupported,
          warnings: compatibility.recommendations.warnings
        }));

        if (!compatibility.isSupported) {
          await enableFallbackMode('Device not compatible with recommendation models');
          return;
        }
      } catch (error) {
        console.warn('Device compatibility check failed:', error);
      }

      await initializeEngine();
    };

    const initializeEngine = async () => {
      setState(prev => ({ ...prev, isModelLoading: true, modelLoadProgress: 0, fallbackMode: false }));
      
      try {
        const engine = new CollaborativeFilteringEngine(modelManager, {
          numFactors: 50,
          learningRate: 0.01,
          regularization: 0.1,
          iterations: 100,
          minRatings: 2
        });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState(prev => ({
            ...prev,
            modelLoadProgress: Math.min(prev.modelLoadProgress + 10, 90)
          }));
        }, 200);

        await engine.initialize();
        
        clearInterval(progressInterval);
        
        const movies = engine.getAllMovies();
        setCfEngine(engine);
        setState(prev => ({
          ...prev,
          isModelLoading: false,
          modelLoadProgress: 100,
          modelReady: true,
          availableMovies: movies,
          error: null,
          retryCount: 0
        }));

      } catch (error) {
        console.error('Failed to initialize recommendation engine:', error);
        
        // Use error handler for comprehensive recovery
        const recovery = await errorHandler.handleError(error as Error, {
          operation: 'collaborative-filtering',
          modelId: 'svd-matrix-factorization',
          timestamp: Date.now(),
          networkStatus: state.networkStatus
        });

        if (!recovery.recovered) {
          // Try fallback mode
          await enableFallbackMode(`Engine initialization failed: ${(error as Error).message}`);
        }
      }
    };

    const enableFallbackMode = async (reason: string) => {
      try {
        // Load basic movie data for fallback
        const basicMovies: Movie[] = [
          { id: 1, title: "The Shawshank Redemption", genres: ["Drama"], year: 1994, averageRating: 9.3, ratingCount: 2500000 },
          { id: 2, title: "The Godfather", genres: ["Crime", "Drama"], year: 1972, averageRating: 9.2, ratingCount: 1800000 },
          { id: 3, title: "The Dark Knight", genres: ["Action", "Crime", "Drama"], year: 2008, averageRating: 9.0, ratingCount: 2600000 },
          { id: 6, title: "Inception", genres: ["Action", "Sci-Fi", "Thriller"], year: 2010, averageRating: 8.8, ratingCount: 2300000 },
          { id: 7, title: "The Matrix", genres: ["Action", "Sci-Fi"], year: 1999, averageRating: 8.7, ratingCount: 1900000 },
          { id: 5, title: "Forrest Gump", genres: ["Drama", "Romance"], year: 1994, averageRating: 8.8, ratingCount: 2100000 }
        ];

        setState(prev => ({
          ...prev,
          isModelLoading: false,
          fallbackMode: true,
          modelReady: true,
          availableMovies: basicMovies,
          error: null,
          fallbackReason: reason
        }));

        console.log('Enabled fallback mode for recommendations:', reason);
      } catch (error) {
        setState(prev => ({
          ...prev,
          isModelLoading: false,
          error: `Failed to enable fallback mode: ${(error as Error).message}`,
          modelReady: false
        }));
      }
    };

    // Monitor network status
    const handleOnline = () => setState(prev => ({ ...prev, networkStatus: 'online' }));
    const handleOffline = () => setState(prev => ({ ...prev, networkStatus: 'offline' }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    initializeWithErrorHandling();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addRating = useCallback((movieId: number, rating: number) => {
    if (!cfEngine) return;

    const movie = cfEngine.getMovie(movieId);
    if (!movie) return;

    const newRating: MovieRating = {
      movieId,
      title: movie.title,
      rating,
      genres: movie.genres
    };

    setState(prev => {
      const existingIndex = prev.userRatings.findIndex(r => r.movieId === movieId);
      const newRatings = existingIndex >= 0
        ? prev.userRatings.map((r, i) => i === existingIndex ? newRating : r)
        : [...prev.userRatings, newRating];

      return {
        ...prev,
        userRatings: newRatings
      };
    });

    // Auto-generate recommendations if user has enough ratings
    if (state.userRatings.length >= 1) {
      generateRecommendations();
    }
  }, [cfEngine, state.userRatings.length]);

  const generateRecommendations = useCallback(async () => {
    if (state.userRatings.length === 0) return;
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      let result: RecommendationResult[] | RecommendationFallbackResult;

      if (state.fallbackMode || !cfEngine) {
        // Use fallback recommendations
        result = await fallbackManager.generateRecommendationsFallback(
          state.userRatings,
          6,
          state.fallbackMode ? 'Fallback mode enabled' : 'Engine not available'
        );
        
        setState(prev => ({
          ...prev,
          recommendations: result.recommendations,
          isGenerating: false,
          fallbackReason: result.fallbackReason
        }));
      } else {
        // Try main engine first
        try {
          const recommendations = await cfEngine.generateRecommendations(state.userRatings, 6);
          setState(prev => ({
            ...prev,
            recommendations,
            isGenerating: false
          }));
        } catch (engineError) {
          console.warn('Main engine failed, trying fallback:', engineError);
          
          // Handle error and try recovery
          const recovery = await errorHandler.handleError(engineError as Error, {
            operation: 'collaborative-filtering',
            modelId: 'svd-matrix-factorization',
            timestamp: Date.now(),
            networkStatus: state.networkStatus
          });

          if (recovery.recovered) {
            // Retry with main engine
            const recommendations = await cfEngine.generateRecommendations(state.userRatings, 6);
            setState(prev => ({
              ...prev,
              recommendations,
              isGenerating: false
            }));
          } else {
            // Use fallback
            result = await fallbackManager.generateRecommendationsFallback(
              state.userRatings,
              6,
              `Engine error: ${(engineError as Error).message}`
            );
            
            setState(prev => ({
              ...prev,
              recommendations: result.recommendations,
              isGenerating: false,
              fallbackReason: result.fallbackReason
            }));
          }
        }
      }
    } catch (error) {
      console.error('Recommendation generation completely failed:', error);
      
      // Try to get cached result for offline mode
      if (state.networkStatus === 'offline') {
        const cachedResult = fallbackManager.getOfflineRecommendationResult(state.userRatings, 6);
        if (cachedResult) {
          setState(prev => ({
            ...prev,
            recommendations: cachedResult.recommendations,
            isGenerating: false,
            fallbackReason: 'Offline mode - using cached recommendations'
          }));
          return;
        }
      }

      setState(prev => ({
        ...prev,
        error: `Failed to generate recommendations: ${(error as Error).message}. ${state.networkStatus === 'offline' ? 'You are offline.' : 'Please try again.'}`,
        isGenerating: false
      }));
    }
  }, [cfEngine, state.userRatings, state.fallbackMode, state.networkStatus]);

  const clearRatings = useCallback(() => {
    setState(prev => ({
      ...prev,
      userRatings: [],
      recommendations: []
    }));
  }, []);

  const retryInitialization = async () => {
    if (state.retryCount >= 3) {
      await enableFallbackMode('Maximum retry attempts reached');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      error: null, 
      retryCount: prev.retryCount + 1 
    }));
    
    // Wait before retrying (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, state.retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Re-initialize
    window.location.reload(); // Simple approach for demo
  };

  const switchToFallbackMode = async () => {
    await enableFallbackMode('User requested fallback mode');
  };

  const enableFallbackMode = async (reason: string) => {
    // This function is defined in the useEffect, but we need it here too
    const basicMovies: Movie[] = [
      { id: 1, title: "The Shawshank Redemption", genres: ["Drama"], year: 1994, averageRating: 9.3, ratingCount: 2500000 },
      { id: 2, title: "The Godfather", genres: ["Crime", "Drama"], year: 1972, averageRating: 9.2, ratingCount: 1800000 },
      { id: 3, title: "The Dark Knight", genres: ["Action", "Crime", "Drama"], year: 2008, averageRating: 9.0, ratingCount: 2600000 },
      { id: 6, title: "Inception", genres: ["Action", "Sci-Fi", "Thriller"], year: 2010, averageRating: 8.8, ratingCount: 2300000 },
      { id: 7, title: "The Matrix", genres: ["Action", "Sci-Fi"], year: 1999, averageRating: 8.7, ratingCount: 1900000 },
      { id: 5, title: "Forrest Gump", genres: ["Drama", "Romance"], year: 1994, averageRating: 8.8, ratingCount: 2100000 }
    ];

    setState(prev => ({
      ...prev,
      isModelLoading: false,
      fallbackMode: true,
      modelReady: true,
      availableMovies: basicMovies,
      error: null,
      fallbackReason: reason
    }));
  };

  const getFilteredMovies = useCallback(() => {
    if (!state.searchQuery) return state.availableMovies.slice(0, 20);
    
    return state.availableMovies
      .filter(movie => 
        movie.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        movie.genres.some(genre => genre.toLowerCase().includes(state.searchQuery.toLowerCase()))
      )
      .slice(0, 20);
  }, [state.availableMovies, state.searchQuery]);

  const getRatingForMovie = useCallback((movieId: number) => {
    return state.userRatings.find(r => r.movieId === movieId)?.rating || 0;
  }, [state.userRatings]);

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'svd': return <Zap className="w-4 h-4" />;
      case 'neural': return <Brain className="w-4 h-4" />;
      case 'hybrid': return <TrendingUp className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  // Generate detailed explanation for a recommendation
  const generateRecommendationExplanation = (recommendation: RecommendationResult): RecommendationExplanationData => {
    // Generate mock similar users
    const similarUsers = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) => ({
      userId: `user_${1000 + i}`,
      similarity: 0.6 + Math.random() * 0.3, // 0.6 to 0.9
      commonRatings: 5 + Math.floor(Math.random() * 15), // 5 to 20
      averageRating: 3.0 + Math.random() * 2.0, // 3.0 to 5.0
      topGenres: recommendation.genres.slice(0, 2).concat(['Drama', 'Comedy'].filter(g => !recommendation.genres.includes(g)).slice(0, 1))
    }));

    // Generate item features
    const itemFeatures = [
      {
        name: 'Genre Preference Match',
        value: 0.7 + Math.random() * 0.25,
        importance: 0.8,
        description: `This movie's genres (${recommendation.genres.join(', ')}) align well with your viewing history`
      },
      {
        name: 'Rating Pattern Similarity',
        value: 0.6 + Math.random() * 0.3,
        importance: 0.7,
        description: 'Users with similar rating patterns to yours have rated this movie highly'
      },
      {
        name: 'Temporal Preference',
        value: 0.5 + Math.random() * 0.4,
        importance: 0.5,
        description: 'This movie fits your recent viewing trends and preferences'
      },
      {
        name: 'Diversity Factor',
        value: 0.4 + Math.random() * 0.4,
        importance: 0.6,
        description: 'This recommendation adds variety to your typical movie preferences'
      }
    ];

    // Generate algorithm-specific data
    const factorContributions = state.algorithm === 'svd' ? Array.from({ length: 5 }, (_, i) => ({
      factor: i + 1,
      contribution: (Math.random() - 0.5) * 0.8 // -0.4 to 0.4
    })) : undefined;

    const neuralActivations = state.algorithm === 'neural' ? [
      { layer: 'User Embedding', activation: Math.random() },
      { layer: 'Item Embedding', activation: Math.random() },
      { layer: 'Hidden Layer 1', activation: Math.random() },
      { layer: 'Hidden Layer 2', activation: Math.random() },
      { layer: 'Output Layer', activation: Math.random() }
    ] : undefined;

    // Generate primary and secondary reasons
    const primaryReasons = [
      `Users similar to you rated this ${recommendation.predictedRating.toFixed(1)}/5 on average`,
      `Strong match with your preferred genres: ${recommendation.genres.slice(0, 2).join(', ')}`,
      `${Math.floor(recommendation.confidence * 100)}% confidence based on ${similarUsers.length} similar users`
    ];

    const secondaryReasons = [
      'Highly rated by users who also liked movies you rated positively',
      'Part of a genre cluster you frequently enjoy',
      'Recommended timing based on your viewing patterns'
    ];

    return {
      movieId: recommendation.movieId,
      movieTitle: recommendation.title,
      predictedRating: recommendation.predictedRating,
      confidence: recommendation.confidence,
      algorithm: state.algorithm,
      similarUsers,
      userSimilarityScore: similarUsers.reduce((sum, user) => sum + user.similarity, 0) / similarUsers.length,
      itemFeatures,
      genreMatch: 0.6 + Math.random() * 0.3,
      factorContributions,
      neuralActivations,
      primaryReasons,
      secondaryReasons
    };
  };

  // Generate algorithm comparison data
  const getAlgorithmComparisonData = (): AlgorithmMetrics[] => {
    return [
      {
        name: 'svd',
        displayName: 'SVD Matrix Factorization',
        type: 'recommendation',
        metrics: {
          loadTime: 1200,
          inferenceTime: 45,
          modelSize: 8 * 1024 * 1024, // 8MB
          memoryUsage: 25 * 1024 * 1024, // 25MB
          throughput: 22.2,
          rmse: 0.87,
          mae: 0.68
        },
        pros: [
          'Fast inference time',
          'Good accuracy for collaborative filtering',
          'Interpretable factor decomposition',
          'Handles sparse data well'
        ],
        cons: [
          'Cold start problem for new users',
          'Limited content understanding',
          'Requires sufficient user-item interactions',
          'May overfit to popular items'
        ],
        bestFor: [
          'Large user bases',
          'Established platforms',
          'Fast recommendations'
        ]
      },
      {
        name: 'neural',
        displayName: 'Neural Collaborative Filtering',
        type: 'recommendation',
        metrics: {
          loadTime: 2800,
          inferenceTime: 120,
          modelSize: 15 * 1024 * 1024, // 15MB
          memoryUsage: 45 * 1024 * 1024, // 45MB
          throughput: 8.3,
          rmse: 0.82,
          mae: 0.63
        },
        pros: [
          'Better accuracy than matrix factorization',
          'Can capture non-linear relationships',
          'Flexible architecture',
          'Good for complex user preferences'
        ],
        cons: [
          'Slower inference',
          'Requires more training data',
          'Less interpretable',
          'Higher computational requirements'
        ],
        bestFor: [
          'Complex recommendation scenarios',
          'Large datasets',
          'Accuracy-critical applications'
        ]
      },
      {
        name: 'hybrid',
        displayName: 'Hybrid Approach',
        type: 'recommendation',
        metrics: {
          loadTime: 2000,
          inferenceTime: 80,
          modelSize: 12 * 1024 * 1024, // 12MB
          memoryUsage: 35 * 1024 * 1024, // 35MB
          throughput: 12.5,
          rmse: 0.79,
          mae: 0.61
        },
        pros: [
          'Best overall accuracy',
          'Combines multiple approaches',
          'Handles cold start better',
          'More robust recommendations'
        ],
        cons: [
          'More complex implementation',
          'Higher resource requirements',
          'Longer training time',
          'Difficult to tune parameters'
        ],
        bestFor: [
          'Production systems',
          'Diverse user bases',
          'Quality-focused applications'
        ]
      },
      {
        name: 'popularity',
        displayName: 'Popularity-based (Fallback)',
        type: 'recommendation',
        metrics: {
          loadTime: 50,
          inferenceTime: 5,
          modelSize: 100 * 1024, // 100KB
          memoryUsage: 500 * 1024, // 500KB
          throughput: 200,
          rmse: 1.25,
          mae: 0.95
        },
        pros: [
          'Extremely fast',
          'No cold start problem',
          'Simple to implement',
          'Works with minimal data'
        ],
        cons: [
          'No personalization',
          'Poor accuracy',
          'Biased toward popular items',
          'Limited diversity'
        ],
        bestFor: [
          'New platforms',
          'Fallback scenarios',
          'Simple applications'
        ]
      }
    ];
  };

  if (state.isModelLoading) {
    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2 chrome-scrollbar-fix firefox-enhanced-fix" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--accent-primary)) hsl(var(--background-secondary))'
      }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading recommendation engine...</p>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.modelLoadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{state.modelLoadProgress}%</p>
        </div>
      </div>
    );
  }

  if (!state.modelReady && !state.isModelLoading) {
    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2 chrome-scrollbar-fix firefox-enhanced-fix" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--accent-primary)) hsl(var(--background-secondary))'
      }}>
        {/* Network Status */}
        {state.networkStatus !== 'online' && (
          <Alert variant="warning">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {state.networkStatus === 'offline' ? 'You are offline. ' : 'Slow connection detected. '}
              Limited functionality available.
            </AlertDescription>
          </Alert>
        )}

        {/* Device Compatibility Warnings */}
        {state.warnings.length > 0 && (
          <Alert variant="warning">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Device Compatibility:</div>
                {state.warnings.slice(0, 2).map((warning, index) => (
                  <div key={index} className="text-xs">• {warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{state.error}</span>
              <div className="flex gap-2 ml-2">
                {state.retryCount < 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryInitialization}
                  >
                    Retry ({3 - state.retryCount} left)
                  </Button>
                )}
                {!state.fallbackMode && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={switchToFallbackMode}
                  >
                    Use Fallback
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2 chrome-scrollbar-fix firefox-enhanced-fix" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: 'hsl(var(--accent-primary)) hsl(var(--background-secondary))'
    }}>
      {/* Network Status */}
      {state.networkStatus !== 'online' && (
        <Alert variant="warning">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {state.networkStatus === 'offline' ? 'You are offline. ' : 'Slow connection detected. '}
              {state.fallbackMode ? 'Using offline mode.' : 'Some features may be limited.'}
            </span>
            {state.networkStatus === 'offline' && (
              <div className="flex items-center gap-1 text-xs">
                <Shield className="w-3 h-3" />
                Offline Mode
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Device Compatibility Warnings */}
      {state.warnings.length > 0 && (
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Device Compatibility:</div>
              {state.warnings.slice(0, 2).map((warning, index) => (
                <div key={index} className="text-xs">• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <div className="flex gap-2 ml-2">
              {state.retryCount < 3 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={retryInitialization}
                >
                  Retry ({3 - state.retryCount} left)
                </Button>
              )}
              {!state.fallbackMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={switchToFallbackMode}
                >
                  Use Fallback
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Algorithm Selection and Model Info */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium">Algorithm:</label>
          <Select 
            value={state.algorithm} 
            onValueChange={(value: 'svd' | 'neural' | 'hybrid') => 
              setState(prev => ({ ...prev, algorithm: value }))
            }
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="svd">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  SVD
                </div>
              </SelectItem>
              <SelectItem value="neural">
                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3" />
                  Neural CF
                </div>
              </SelectItem>
              <SelectItem value="hybrid">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Hybrid
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setState(prev => ({ ...prev, showModelInfo: !prev.showModelInfo }))}
          className="text-xs"
        >
          <Info className="w-3 h-3 mr-1" />
          Model Info
        </Button>
      </div>

      {/* Model Information */}
      {state.showModelInfo && (
        <Card className={`${state.fallbackMode ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' : 'bg-secondary/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {state.fallbackMode ? <Shield className="w-4 h-4" /> : getAlgorithmIcon(state.algorithm)}
              {state.fallbackMode ? 'Fallback Recommendation Engine' : 'Collaborative Filtering Engine'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div>Movies: {state.availableMovies.length}</div>
              <div>Genres: {state.fallbackMode ? '6+' : (cfEngine?.getModelInfo().numGenres || 'Unknown')}</div>
              <div>Algorithm: {state.fallbackMode ? 'POPULARITY' : state.algorithm.toUpperCase()}</div>
              <div>Status: {state.modelReady ? (state.fallbackMode ? 'Fallback Ready' : 'Ready') : 'Loading'}</div>
            </div>
            {state.fallbackMode && state.fallbackReason && (
              <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                Reason: {state.fallbackReason}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Movie Rating System */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Rate Movies ({state.userRatings.length} rated)</h4>
          {state.userRatings.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearRatings} className="text-xs">
              Clear All
            </Button>
          )}
        </div>

        {/* Search Movies */}
        <div className="relative">
          <Search className="absolute left-2 top-2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search movies..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-8 pr-3 py-2 text-sm bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Movie List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 chrome-scrollbar-fix firefox-enhanced-fix" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--accent-primary)) hsl(var(--background-secondary))'
        }}>
          {getFilteredMovies().map((movie) => {
            const userRating = getRatingForMovie(movie.id);
            return (
              <div key={movie.id} className="bg-secondary/20 rounded-lg p-3 border border-border/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1 mr-2">
                    <h5 className="font-medium text-sm truncate">{movie.title}</h5>
                    <p className="text-xs text-muted-foreground">
                      {movie.genres.join(', ')} • {movie.year}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs">{movie.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                  <span className="text-xs mr-2">Rate:</span>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => addRating(movie.id, rating)}
                      className="touch-manipulation active:scale-95 transition-transform"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          rating <= userRating 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-muted-foreground hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                  {userRating > 0 && (
                    <span className="text-xs ml-2 text-primary font-medium">
                      {userRating}/5
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Recommendations Button */}
      {state.userRatings.length > 0 && (
        <Button 
          onClick={generateRecommendations}
          disabled={state.isGenerating}
          className="w-full bg-gradient-accent hover:shadow-glow-accent transition-all duration-300 touch-manipulation active:scale-95"
        >
          {state.isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating Recommendations...
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Get Recommendations ({state.algorithm.toUpperCase()})
            </>
          )}
        </Button>
      )}

      {/* Recommendations Display */}
      {state.recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-primary flex items-center gap-2">
              {state.fallbackMode ? <Shield className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              Recommendations for You
            </h4>
            {state.fallbackMode && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <Shield className="w-3 h-3" />
                Fallback Mode
              </div>
            )}
          </div>

          {/* Fallback Information */}
          {state.fallbackMode && state.fallbackReason && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded p-2">
              <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                <Shield className="w-3 h-3" />
                <span>Fallback Recommendations: {state.fallbackReason}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {state.recommendations.map((rec, index) => (
              <Card key={rec.movieId} className="bg-secondary/30 border-border/50">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1 mr-2">
                      <h5 className="font-medium text-sm">{rec.title}</h5>
                      <p className="text-xs text-muted-foreground mb-1">
                        {rec.genres.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        {rec.explanation}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="font-medium text-sm">
                          {rec.predictedRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(rec.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>
                  
                  {/* Confidence Bar */}
                  <div className="w-full bg-secondary rounded-full h-1 mt-2 mb-2">
                    <div 
                      className="bg-gradient-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${rec.confidence * 100}%` }}
                    />
                  </div>

                  {/* Explanation Button */}
                  {!state.fallbackMode && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setState(prev => ({
                          ...prev,
                          selectedRecommendation: rec as RecommendationResult,
                          showExplanation: true
                        }))}
                        className="text-xs flex items-center gap-1"
                      >
                        <Lightbulb className="w-3 h-3" />
                        Why this movie?
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Features Controls */}
      {state.modelReady && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showComparison: !prev.showComparison }))}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Compare Algorithms
            </Button>
          </div>

          {/* Algorithm Comparison */}
          {state.showComparison && (
            <PerformanceComparison
              algorithms={getAlgorithmComparisonData()}
              currentAlgorithm={state.fallbackMode ? 'popularity' : state.algorithm}
              onAlgorithmSelect={(algorithm) => {
                if (['svd', 'neural', 'hybrid'].includes(algorithm)) {
                  setState(prev => ({ ...prev, algorithm: algorithm as 'svd' | 'neural' | 'hybrid' }));
                }
              }}
            />
          )}
        </div>
      )}

      {/* Recommendation Explanation Modal/Panel */}
      {state.showExplanation && state.selectedRecommendation && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-primary">Recommendation Explanation</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showExplanation: false, selectedRecommendation: null }))}
            >
              Close
            </Button>
          </div>
          
          <RecommendationExplanation
            explanation={generateRecommendationExplanation(state.selectedRecommendation)}
            userRatings={state.userRatings}
          />
        </div>
      )}

      {/* Getting Started Message */}
      {state.userRatings.length === 0 && (
        <div className="text-center p-4 bg-secondary/20 rounded-lg border border-border/30">
          <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            Rate some movies to get personalized recommendations
          </p>
          <p className="text-xs text-muted-foreground">
            The more movies you rate, the better the recommendations become
          </p>
        </div>
      )}
    </div>
  );
};

const RecommendationDemo = () => {
  return (
    <ErrorBoundary
      enableFallback={true}
      showTechnicalDetails={false}
      onError={(error, errorInfo) => {
        console.error('RecommendationDemo Error:', error, errorInfo);
      }}
    >
      <RecommendationDemoContent />
    </ErrorBoundary>
  );
};

export default RecommendationDemo;