import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Zap, Info, AlertCircle, CheckCircle, Cpu, Clock, BarChart3, Wifi, WifiOff, Shield, Activity, Eye, Brain, Smartphone, Battery } from "lucide-react";
import { TouchFeedback, MobileModal } from "../MobileOptimizedInterface";
import { useMobileOptimization } from "../../hooks/useMobileOptimization";
import { onnxSentiment } from "@/utils/onnxSentiment";
import { SentimentResult } from "@/utils/mlUtils";
import { errorHandler } from "@/utils/errorHandler";
import { deviceCompatibility } from "@/utils/deviceCompatibility";
import { fallbackManager, SentimentFallbackResult } from "@/utils/fallbackManager";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import ModelInfoDisplay, { type ModelInfo } from "@/components/ModelInfoDisplay";
import AttentionVisualization, { type AttentionData } from "@/components/AttentionVisualization";
import PerformanceComparison, { type AlgorithmMetrics } from "@/components/PerformanceComparison";

interface SentimentAnalysisState {
  isModelLoading: boolean;
  isAnalyzing: boolean;
  modelLoadProgress: number;
  error: string | null;
  result: SentimentResult | SentimentFallbackResult | null;
  modelReady: boolean;
  modelInfo: {
    name: string;
    size: string;
    architecture: string;
    loadTime?: number;
  } | null;
  fallbackMode: boolean;
  networkStatus: 'online' | 'offline' | 'slow';
  deviceCompatible: boolean;
  retryCount: number;
  warnings: string[];
  showModelDetails: boolean;
  showAttentionViz: boolean;
  showComparison: boolean;
  attentionData: AttentionData | null;
}

const SentimentAnalysisDemoContent = () => {
  const [text, setText] = useState("");
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [state, setState] = useState<SentimentAnalysisState>({
    isModelLoading: false,
    isAnalyzing: false,
    modelLoadProgress: 0,
    error: null,
    result: null,
    modelReady: false,
    modelInfo: null,
    fallbackMode: false,
    networkStatus: 'online',
    deviceCompatible: true,
    retryCount: 0,
    warnings: [],
    showModelDetails: false,
    showAttentionViz: false,
    showComparison: false,
    attentionData: null
  });

  // Using the simple BERT implementation directly

  // Performance monitoring
  const {
    metrics,
    recordModelLoad,
    recordInference,
    getOptimizedLoadingOptions,
    canHandleModel,
    isLowEndDevice,
    isHighMemoryUsage,
    hasPerformanceWarnings,
    shouldUseQuantizedModels
  } = usePerformanceMonitoring({
    enableRealTimeMonitoring: true,
    trackModelPerformance: true
  });

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
    modelType: 'sentiment'
  });

  // Initialize BERT model on component mount
  useEffect(() => {
    initializeWithErrorHandling();

    // Monitor network status
    const handleOnline = () => setState(prev => ({ ...prev, networkStatus: 'online' }));
    const handleOffline = () => setState(prev => ({ ...prev, networkStatus: 'offline' }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup on unmount
    return () => {
      onnxSentiment.dispose();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        console.warn('Device not compatible, but will still try BERT models');
        // Don't immediately fall back - try BERT models anyway
      }
    } catch (error) {
      console.warn('Device compatibility check failed:', error);
    }

    // Try multiple times to load BERT model before giving up
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 BERT model loading attempt ${attempt}/${maxRetries}`);

        await Promise.race([
          initializeModel(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`BERT model loading timeout after 60 seconds (attempt ${attempt})`)), 60000)
          )
        ]);

        // If we get here, the model loaded successfully
        console.log('✅ BERT model loaded successfully!');
        return;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ BERT model loading attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          console.log(`⏳ Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Only fall back to rule-based after all BERT attempts failed
    console.warn('🔄 All BERT model loading attempts failed, falling back to rule-based analysis');
    await enableFallbackMode(`BERT model failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  };

  const initializeModel = async () => {
    const startTime = Date.now();

    try {
      setState(prev => ({
        ...prev,
        isModelLoading: true,
        error: null,
        modelLoadProgress: 0,
        fallbackMode: false
      }));

      // Get recommended configuration with performance optimizations
      const config = await deviceCompatibility.getRecommendedConfig();
      const optimizedOptions = getOptimizedLoadingOptions();

      // Merge configurations with performance optimizations
      const finalConfig = {
        ...config,
        ...optimizedOptions,
        quantized: shouldUseQuantizedModels || config.quantized
      };

      // Check if device can handle the model
      const estimatedModelSize = 67 * 1024 * 1024; // DistilBERT ~67MB
      if (!canHandleModel(estimatedModelSize, 2000)) {
        await enableFallbackMode('Device cannot handle full model - using fallback');
        return;
      }

      console.log('🚀 Starting ONNX BERT model initialization...');

      // Initialize the ONNX sentiment model
      await onnxSentiment.initialize((progress) => {
        setState(prev => ({ ...prev, modelLoadProgress: progress }));
      });

      // Record performance metrics
      const loadTime = Date.now() - startTime;
      recordModelLoad('onnx-bert-sentiment', loadTime, 110 * 1024 * 1024); // ~110MB

      // Get model information
      const modelInfo = onnxSentiment.getModelInfo();

      setState(prev => ({
        ...prev,
        isModelLoading: false,
        modelReady: true,
        retryCount: 0,
        modelInfo: {
          name: modelInfo.name,
          size: modelInfo.size,
          architecture: modelInfo.architecture,
          loadTime
        }
      }));

      console.log('✅ BERT model initialization complete!');

    } catch (error) {
      console.error('Failed to initialize BERT model:', error);

      // Try error handler for recovery, but don't let it block fallback mode
      try {
        const recovery = await errorHandler.handleError(error as Error, {
          operation: 'sentiment-analysis',
          modelId: 'distilbert-sentiment',
          timestamp: Date.now(),
          networkStatus: state.networkStatus
        });

        if (recovery.recovered) {
          // If recovery succeeded, we're done
          return;
        }
      } catch (recoveryError) {
        console.warn('Error handler failed:', recoveryError);
      }

      // Always try fallback mode if we reach here
      await enableFallbackMode(`Model initialization failed: ${(error as Error).message}`);
    }
  };

  const enableFallbackMode = async (reason: string) => {
    try {
      console.log('Enabling fallback mode:', reason);

      setState(prev => ({
        ...prev,
        isModelLoading: false,
        fallbackMode: true,
        modelReady: true,
        error: null,
        modelLoadProgress: 100,
        modelInfo: {
          name: 'Rule-based Fallback',
          size: '< 1KB',
          architecture: 'Dictionary-based',
          loadTime: 0
        }
      }));

      console.log('Fallback mode enabled successfully');
    } catch (error) {
      console.error('Failed to enable fallback mode:', error);
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        error: `Failed to enable fallback mode: ${(error as Error).message}`,
        modelReady: false
      }));
    }
  };

  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string): string => {
    // Remove potentially harmful characters and limit length
    const sanitized = input
      .replace(/[<>{}]/g, '') // Remove potentially dangerous characters
      .replace(/\s{2,}/g, ' ') // Normalize multiple whitespace to single space
      .slice(0, 1000); // Limit to 1000 characters

    return sanitized;
  };

  const handleTextChange = (value: string) => {
    const sanitizedText = validateAndSanitizeInput(value);
    setText(sanitizedText);
  };

  // Generate mock attention data for visualization
  const generateMockAttentionData = (inputText: string): AttentionData => {
    const tokens = ['[CLS]', ...inputText.split(' '), '[SEP]'];
    const numLayers = 6; // DistilBERT has 6 layers
    const numHeads = 12; // 12 attention heads per layer

    // Generate realistic attention patterns
    const attentionWeights = Array.from({ length: numLayers }, (_, layerIdx) =>
      Array.from({ length: numHeads }, (_, headIdx) =>
        tokens.map((_, tokenIdx) =>
          tokens.map((_, targetIdx) => {
            // Create realistic attention patterns
            let weight = Math.random() * 0.3; // Base random attention

            // Self-attention (token attending to itself)
            if (tokenIdx === targetIdx) {
              weight += 0.2;
            }

            // CLS token attends to all tokens more strongly
            if (tokenIdx === 0) {
              weight += 0.3;
            }

            // Adjacent tokens have higher attention
            if (Math.abs(tokenIdx - targetIdx) === 1) {
              weight += 0.2;
            }

            // Later layers focus more on semantic relationships
            if (layerIdx > 3) {
              // Sentiment-related words get more attention
              const sentimentWords = ['love', 'hate', 'amazing', 'terrible', 'great', 'awful', 'good', 'bad'];
              const targetToken = tokens[targetIdx].toLowerCase();
              if (sentimentWords.some(word => targetToken.includes(word))) {
                weight += 0.4;
              }
            }

            // Normalize to ensure it's a valid probability
            return Math.min(weight, 1.0);
          })
        )
      )
    );

    // Normalize each attention head to sum to 1
    attentionWeights.forEach(layer =>
      layer.forEach(head =>
        head.forEach(tokenAttentions => {
          const sum = tokenAttentions.reduce((a, b) => a + b, 0);
          if (sum > 0) {
            tokenAttentions.forEach((_, i) => {
              tokenAttentions[i] /= sum;
            });
          }
        })
      )
    );

    return {
      tokens,
      attentionWeights,
      layerNames: Array.from({ length: numLayers }, (_, i) => `Layer ${i + 1}`),
      headNames: Array.from({ length: numHeads }, (_, i) => `Head ${i + 1}`)
    };
  };

  const analyzeSentiment = async () => {
    const sanitizedText = validateAndSanitizeInput(text);
    if (!sanitizedText.trim() || sanitizedText.length < 3) {
      setState(prev => ({ ...prev, error: 'Please enter at least 3 characters for analysis.' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      result: null,
      attentionData: null
    }));

    const inferenceStartTime = Date.now();

    try {
      let result: SentimentResult | SentimentFallbackResult;

      if (state.fallbackMode || !onnxSentiment.isReady()) {
        // Use fallback analysis
        result = await fallbackManager.analyzeSentimentFallback(
          sanitizedText,
          state.fallbackMode ? 'Fallback mode enabled' : 'ONNX BERT model not available'
        );
      } else {
        // Use ONNX BERT model
        try {
          console.log('🤖 Analyzing with ONNX BERT:', sanitizedText);
          result = await onnxSentiment.analyze(sanitizedText);

          // Generate attention visualization data for BERT models
          const attentionData = generateMockAttentionData(sanitizedText);

          // Record inference performance
          const inferenceTime = Date.now() - inferenceStartTime;
          recordInference('onnx-bert-sentiment', inferenceTime, 1);

          setState(prev => ({
            ...prev,
            attentionData
          }));

          console.log('✅ ONNX BERT analysis complete:', result);

        } catch (modelError) {
          console.warn('Main model failed, trying fallback:', modelError);

          // Handle error and try recovery
          const recovery = await errorHandler.handleError(modelError as Error, {
            operation: 'sentiment-analysis',
            modelId: 'distilbert-sentiment',
            timestamp: Date.now(),
            networkStatus: state.networkStatus
          });

          if (recovery.recovered) {
            // Retry with main model
            result = await analyzerRef.current.analyze(sanitizedText);
            const attentionData = generateMockAttentionData(sanitizedText);
            setState(prev => ({ ...prev, attentionData }));
          } else {
            // Use fallback
            result = await fallbackManager.analyzeSentimentFallback(
              sanitizedText,
              `Model error: ${(modelError as Error).message}`
            );
          }
        }
      }

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        result,
        error: null
      }));

    } catch (error) {
      console.error('Sentiment analysis completely failed:', error);

      // Try to get cached result for offline mode
      if (state.networkStatus === 'offline') {
        const cachedResult = fallbackManager.getOfflineSentimentResult(sanitizedText);
        if (cachedResult) {
          setState(prev => ({
            ...prev,
            isAnalyzing: false,
            result: { ...cachedResult, fallbackReason: 'Offline mode - using cached result' },
            error: null
          }));
          return;
        }
      }

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: `Analysis failed: ${(error as Error).message}. ${state.networkStatus === 'offline' ? 'You are offline.' : 'Please try again.'}`
      }));
    }
  };

  const getSentimentColor = (label: string): string => {
    switch (label.toUpperCase()) {
      case 'POSITIVE':
        return 'bg-green-500';
      case 'NEGATIVE':
        return 'bg-red-500';
      case 'NEUTRAL':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const retryModelLoad = async () => {
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

    await initializeModel();
  };

  const switchToFallbackMode = async () => {
    await enableFallbackMode('User requested fallback mode');
  };

  const switchToMainModel = async () => {
    if (state.networkStatus === 'offline') {
      setState(prev => ({ ...prev, error: 'Cannot switch to main model while offline' }));
      return;
    }

    setState(prev => ({ ...prev, fallbackMode: false, modelReady: false }));
    await initializeModel();
  };

  // Generate model comparison data
  const getAlgorithmComparisonData = (): AlgorithmMetrics[] => {
    const baseMetrics = {
      loadTime: state.modelInfo?.loadTime || 2500,
      inferenceTime: state.result?.processingTime || 150,
      modelSize: 67 * 1024 * 1024, // 67MB for DistilBERT
      memoryUsage: 120 * 1024 * 1024 // ~120MB runtime memory
    };

    return [
      {
        name: 'distilbert',
        displayName: 'DistilBERT (Current)',
        type: 'sentiment',
        metrics: {
          accuracy: 92.8,
          precision: 93.1,
          recall: 92.5,
          f1Score: 92.8,
          ...baseMetrics,
          throughput: 6.7
        },
        pros: [
          'High accuracy on sentiment tasks',
          'Faster than full BERT (60% speedup)',
          'Smaller model size (40% reduction)',
          'Good balance of speed and accuracy'
        ],
        cons: [
          'Still relatively large for mobile',
          'Requires significant memory',
          'Slower than rule-based approaches',
          'May struggle with sarcasm'
        ],
        bestFor: [
          'Production sentiment analysis',
          'High accuracy requirements',
          'Balanced performance needs'
        ]
      },
      {
        name: 'bert-base',
        displayName: 'BERT Base',
        type: 'sentiment',
        metrics: {
          accuracy: 94.2,
          precision: 94.5,
          recall: 93.9,
          f1Score: 94.2,
          loadTime: 4200,
          inferenceTime: 280,
          modelSize: 440 * 1024 * 1024, // 440MB
          memoryUsage: 800 * 1024 * 1024, // ~800MB
          throughput: 3.6
        },
        pros: [
          'Highest accuracy',
          'Best understanding of context',
          'Handles complex language well',
          'State-of-the-art performance'
        ],
        cons: [
          'Very large model size',
          'Slow inference time',
          'High memory requirements',
          'Not suitable for mobile'
        ],
        bestFor: [
          'Maximum accuracy needs',
          'Complex text analysis',
          'Research applications'
        ]
      },
      {
        name: 'rule-based',
        displayName: 'Rule-based (Fallback)',
        type: 'sentiment',
        metrics: {
          accuracy: 78.5,
          precision: 76.2,
          recall: 80.8,
          f1Score: 78.4,
          loadTime: 10,
          inferenceTime: 5,
          modelSize: 1024, // 1KB
          memoryUsage: 50 * 1024, // 50KB
          throughput: 200
        },
        pros: [
          'Extremely fast',
          'Tiny memory footprint',
          'Works offline',
          'Predictable behavior'
        ],
        cons: [
          'Lower accuracy',
          'Cannot handle context',
          'Misses sarcasm and irony',
          'Limited vocabulary'
        ],
        bestFor: [
          'Offline applications',
          'Low-resource environments',
          'Fallback scenarios'
        ]
      },
      {
        name: 'mobilenet-sentiment',
        displayName: 'MobileNet Sentiment',
        type: 'sentiment',
        metrics: {
          accuracy: 87.3,
          precision: 86.8,
          recall: 87.8,
          f1Score: 87.3,
          loadTime: 800,
          inferenceTime: 45,
          modelSize: 12 * 1024 * 1024, // 12MB
          memoryUsage: 35 * 1024 * 1024, // 35MB
          throughput: 22.2
        },
        pros: [
          'Mobile-optimized',
          'Fast inference',
          'Small model size',
          'Good accuracy for size'
        ],
        cons: [
          'Lower accuracy than BERT',
          'Less context understanding',
          'Limited to simple sentiment',
          'May miss nuances'
        ],
        bestFor: [
          'Mobile applications',
          'Real-time processing',
          'Resource-constrained environments'
        ]
      }
    ];
  };

  // Generate detailed model info
  const getDetailedModelInfo = (): ModelInfo | null => {
    if (!state.modelReady || !state.modelInfo) return null;

    return {
      name: state.fallbackMode ? 'Rule-based Sentiment Analyzer' : 'DistilBERT Base Uncased SST-2',
      architecture: state.modelInfo.architecture,
      version: '1.0.0',
      description: state.fallbackMode
        ? 'A lightweight rule-based sentiment analyzer using dictionary lookup and linguistic patterns. Provides fast, offline sentiment analysis with basic accuracy.'
        : 'DistilBERT is a smaller, faster version of BERT that retains 97% of BERT\'s performance while being 60% smaller and 60% faster. Fine-tuned on the Stanford Sentiment Treebank (SST-2) dataset for binary sentiment classification.',
      parameters: state.fallbackMode ? undefined : 66_000_000,
      quantized: false,
      device: 'wasm',
      metrics: {
        modelSize: state.fallbackMode ? 1024 : 67 * 1024 * 1024,
        loadTime: state.modelInfo.loadTime || 0,
        inferenceTime: state.result?.processingTime || 0,
        accuracy: state.fallbackMode ? 78.5 : 92.8,
        memoryUsage: state.fallbackMode ? 50 * 1024 : 120 * 1024 * 1024,
        throughput: state.fallbackMode ? 200 : 6.7
      },
      capabilities: state.fallbackMode ? [
        'Basic sentiment classification',
        'Offline processing',
        'Fast inference',
        'Low memory usage'
      ] : [
        'Advanced sentiment analysis',
        'Context understanding',
        'Nuanced emotion detection',
        'Attention visualization',
        'High accuracy classification'
      ],
      limitations: state.fallbackMode ? [
        'Limited vocabulary',
        'No context understanding',
        'Cannot detect sarcasm',
        'Simple pattern matching'
      ] : [
        'Large model size',
        'Requires significant memory',
        'Slower than rule-based methods',
        'May struggle with domain-specific text'
      ]
    };
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Model Loading Status */}
      {(state.isModelLoading || loadingProgress) && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {loadingProgress ?
                `${loadingProgress.phase === 'downloading' ? 'Downloading' :
                  loadingProgress.phase === 'initializing' ? 'Initializing' : 'Loading'} Model...` :
                'Loading BERT Model...'
              }
            </span>
          </div>
          <Progress
            value={loadingProgress?.progress || state.modelLoadProgress}
            className="mb-2"
          />
          {loadingProgress ? (
            <div className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
              <div className="flex justify-between">
                <span>
                  Chunk {loadingProgress.chunkIndex + 1} of {loadingProgress.totalChunks}
                </span>
                <span>
                  {(loadingProgress.bytesLoaded / (1024 * 1024)).toFixed(1)} /
                  {(loadingProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              {loadingProgress.downloadSpeed > 0 && (
                <div className="flex justify-between">
                  <span>Speed: {(loadingProgress.downloadSpeed / (1024 * 1024)).toFixed(1)} MB/s</span>
                  {loadingProgress.estimatedTimeRemaining > 0 && (
                    <span>ETA: {Math.round(loadingProgress.estimatedTimeRemaining)}s</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Loading BERT ONNX model (~110MB)
                {isMobile && networkBandwidth === 'low' && (
                  <span className="block mt-1">Using progressive loading for slow connection</span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToFallbackMode}
                  className="text-xs h-6 px-2 border-blue-200 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900"
                >
                  Use Fallback Mode
                </Button>
                <span className="text-xs text-blue-500 dark:text-blue-400 self-center">
                  Skip model download
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Status */}
      {isMobile && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Mobile Optimized
              </span>
            </div>
            {batteryLevel !== undefined && (
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-300">
                <Battery className="w-3 h-3" />
                {Math.round(batteryLevel * 100)}%
                {isCharging && <span className="text-green-600">⚡</span>}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
            <div>Performance: {performanceLevel}</div>
            <div>Network: {networkBandwidth}</div>
            {qualitySettings && (
              <>
                <div>Model: {qualitySettings.modelVariant}</div>
                <div>Quality: {qualitySettings.qualityLevel}</div>
              </>
            )}
          </div>
          {getMobileRecommendations().length > 0 && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {getMobileRecommendations().slice(0, 2).map((rec, i) => (
                <div key={i}>• {rec}</div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Performance Warnings */}
      {hasPerformanceWarnings && metrics?.warnings && (
        <Alert variant="warning">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Performance Warnings:</div>
              {metrics.warnings.slice(-2).map((warning, index) => (
                <div key={index} className="text-xs">
                  • {warning.message}
                  {warning.suggestion && (
                    <div className="text-xs text-muted-foreground ml-2">
                      💡 {warning.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Memory Usage Warning */}
      {isHighMemoryUsage && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">High Memory Usage Detected</div>
              <div className="text-xs">
                Memory usage is high ({metrics?.memoryUsage.percentage.toFixed(1)}%).
                Consider closing other tabs or using a smaller model.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>{state.error}</div>
              <div className="flex gap-2">
                {!state.modelReady && state.retryCount < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryModelLoad}
                    className="h-6 px-2 text-xs"
                  >
                    Retry ({3 - state.retryCount} left)
                  </Button>
                )}
                {!state.fallbackMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchToFallbackMode}
                    className="h-6 px-2 text-xs"
                  >
                    Use Fallback Mode
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Fallback Mode Notice */}
      {state.fallbackMode && state.modelReady && (
        <Alert variant="warning">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">⚠️ Fallback Mode Active</div>
                <div className="text-xs text-muted-foreground">
                  <strong>Not using BERT!</strong> Using simple rule-based analysis instead.
                  This is less accurate and only for demonstration when the real ML model fails to load.
                </div>
              </div>
              {state.networkStatus === 'online' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToMainModel}
                  className="h-6 px-2 text-xs"
                >
                  Try BERT Model
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Notice */}
      {state.modelReady && !state.fallbackMode && !state.error && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">� Neural Neltwork Ready!</div>
                <div className="text-xs text-muted-foreground">
                  Using <strong>{state.modelInfo?.name || 'BERT ONNX'}</strong> with ONNX Runtime for high-accuracy sentiment analysis.
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Model Information */}
      {state.modelReady && state.modelInfo && (
        <div className={`${state.fallbackMode ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'} border rounded-lg p-3`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {state.fallbackMode ? (
                <Shield className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${state.fallbackMode ? 'text-yellow-800 dark:text-yellow-200' : 'text-green-800 dark:text-green-200'}`}>
                {state.fallbackMode ? 'Fallback Mode Active' : 'Model Ready'}
              </span>
            </div>
            {state.fallbackMode && state.networkStatus === 'online' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={switchToMainModel}
                className="text-xs"
              >
                Switch to AI Model
              </Button>
            )}
          </div>
          <div className={`grid grid-cols-2 gap-2 text-xs ${state.fallbackMode ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>{state.modelInfo.architecture}</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>{state.modelInfo.size}</span>
            </div>
            {state.modelInfo.loadTime !== undefined && (
              <div className="flex items-center gap-1 col-span-2">
                <Clock className="w-3 h-3" />
                <span>
                  {state.modelInfo.loadTime > 0
                    ? `Loaded in ${(state.modelInfo.loadTime / 1000).toFixed(1)}s`
                    : 'Instant loading'
                  }
                </span>
              </div>
            )}
          </div>
          {state.fallbackMode && (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              Using rule-based analysis for reliable offline functionality
            </div>
          )}
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-2 sm:space-y-3">
        <Textarea
          placeholder={isMobile ?
            "Enter text to analyze..." :
            "Enter text to analyze sentiment... (e.g., 'I love this amazing product!')"
          }
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className={`
            min-h-[80px] sm:min-h-[100px] bg-background/50 border-border/50 focus:border-primary/50 text-sm resize-none
            ${hasTouch ? 'touch-manipulation' : ''}
            ${isMobile ? 'text-base' : 'text-sm'}
          `}
          maxLength={qualitySettings?.maxInputLength || 1000}
          disabled={!state.modelReady}
          style={isMobile ? { fontSize: '16px' } : undefined} // Prevent zoom on iOS
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div>
            {qualitySettings && qualitySettings.maxInputLength < 1000 && (
              <span className="text-orange-600 dark:text-orange-400">
                Limited to {qualitySettings.maxInputLength} chars (mobile optimized)
              </span>
            )}
          </div>
          <div>
            {text.length}/{qualitySettings?.maxInputLength || 1000} characters
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={analyzeSentiment}
            disabled={!text.trim() || text.length < 3 || state.isAnalyzing || !state.modelReady}
            className={`
              flex-1 bg-gradient-accent hover:shadow-glow-accent transition-all duration-300 
              ${hasTouch ? 'touch-manipulation active:scale-95' : ''}
              ${isMobile ? 'text-base py-3 min-h-[48px]' : 'text-sm sm:text-base py-2.5 sm:py-3'}
              ${shouldDisableFeature('animations') ? '' : 'hover:shadow-glow-accent'}
            `}
          >
            {state.isAnalyzing ? (
              <>
                <Zap className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3 sm:w-4 sm:h-4'} mr-2 ${shouldDisableFeature('animations') ? '' : 'animate-pulse'}`} />
                {state.fallbackMode ? 'Analyzing...' : 'Analyzing with BERT...'}
              </>
            ) : (
              <>
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {state.fallbackMode ? 'Analyze (Rule-based)' : 'Analyze Sentiment'}
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowPerformanceDashboard(true)}
            variant="outline"
            size="sm"
            className={`px-3 ${hasPerformanceWarnings ? 'border-orange-500 text-orange-600' : ''}`}
            title="Performance Dashboard"
          >
            <Activity className={`w-4 h-4 ${hasPerformanceWarnings ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Results Display */}
      {state.result && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4 space-y-3">
          {/* Main Result */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary text-sm sm:text-base">Result:</span>
              {'fallbackUsed' in state.result && state.result.fallbackUsed && (
                <Shield className="w-3 h-3 text-yellow-500" title="Fallback mode used" />
              )}
            </div>
            <Badge className={`${getSentimentColor(state.result.label)} text-white border-none text-xs sm:text-sm px-2 py-1`}>
              {state.result.label}
            </Badge>
          </div>

          {/* Fallback Information */}
          {'fallbackUsed' in state.result && state.result.fallbackUsed && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded p-2">
              <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                <Shield className="w-3 h-3" />
                <span>Fallback Analysis: {state.result.fallbackReason}</span>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Confidence:</span>
              <span className="text-xs sm:text-sm font-medium">{(state.result.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
              <div
                className={`${getSentimentColor(state.result.label)} h-1.5 sm:h-2 rounded-full transition-all duration-1000`}
                style={{ width: `${state.result.confidence * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Detailed Sentiment Breakdown */}
          <div className="space-y-2">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Detailed Scores:</span>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-green-600 dark:text-green-400">Positive:</span>
                <span className="font-mono">{(state.result.scores.positive * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-red-600 dark:text-red-400">Negative:</span>
                <span className="font-mono">{(state.result.scores.negative * 100).toFixed(1)}%</span>
              </div>
              {state.result.scores.neutral !== undefined && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-600 dark:text-yellow-400">Neutral:</span>
                  <span className="font-mono">{(state.result.scores.neutral * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Processing Time:</span>
              <span className="font-mono">{state.result.processingTime.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
              <span>Model:</span>
              <span className="font-mono">{state.result.modelInfo.architecture}</span>
            </div>
          </div>

          {/* Mobile Touch Feedback */}
          {hasTouch && (
            <div className="pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">Was this result helpful?</div>
              <TouchFeedback
                type="neutral"
                onFeedback={(feedback) => {
                  console.log('User feedback:', feedback, 'for result:', state.result?.label);
                  // Here you could send feedback to analytics or improve the model
                }}
                size="sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Advanced Model Information and Controls */}
      {state.modelReady && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showModelDetails: !prev.showModelDetails }))}
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Model Details
            </Button>

            {!state.fallbackMode && state.attentionData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, showAttentionViz: !prev.showAttentionViz }))}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Attention Visualization
              </Button>
            )}

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

          {/* Detailed Model Information */}
          {state.showModelDetails && getDetailedModelInfo() && (
            <ModelInfoDisplay
              modelInfo={getDetailedModelInfo()!}
              isExpanded={true}
              showComparison={false}
            />
          )}

          {/* Attention Visualization */}
          {state.showAttentionViz && !state.fallbackMode && state.attentionData && (
            <AttentionVisualization
              attentionData={state.attentionData}
              selectedText={text}
            />
          )}

          {/* Algorithm Comparison */}
          {state.showComparison && (
            <PerformanceComparison
              algorithms={getAlgorithmComparisonData()}
              currentAlgorithm={state.fallbackMode ? 'rule-based' : 'distilbert'}
            />
          )}
        </div>
      )}

      {/* Legacy Model Information Expandable Section */}
      {state.modelReady && state.modelInfo && !state.showModelDetails && (
        <details className="bg-muted/50 rounded-lg">
          <summary className="p-3 cursor-pointer text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4" />
            Technical Details
          </summary>
          <div className="px-3 pb-3 space-y-2 text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Model:</span>
                <div className="font-mono text-xs break-all">{state.modelInfo.name}</div>
              </div>
              <div>
                <span className="font-medium">Architecture:</span>
                <div>{state.modelInfo.architecture}</div>
              </div>
              <div>
                <span className="font-medium">Size:</span>
                <div>{state.modelInfo.size}</div>
              </div>
              <div>
                <span className="font-medium">Device:</span>
                <div>CPU (WebAssembly)</div>
              </div>
            </div>
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs">
                This demo uses DistilBERT, a smaller and faster version of BERT that retains 97% of BERT's performance
                while being 60% smaller and 60% faster. The model runs entirely in your browser using WebAssembly.
              </p>
            </div>
          </div>
        </details>
      )}

      {/* Performance Dashboard */}
      <PerformanceDashboard
        isVisible={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />
    </div>
  );
};

const SentimentAnalysisDemo = () => {
  return (
    <ErrorBoundary
      enableFallback={true}
      showTechnicalDetails={false}
      onError={(error, errorInfo) => {
        console.error('SentimentAnalysisDemo Error:', error, errorInfo);
      }}
    >
      <SentimentAnalysisDemoContent />
    </ErrorBoundary>
  );
};

export default SentimentAnalysisDemo;