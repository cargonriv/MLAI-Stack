# Design Document

## Overview

This design document outlines the implementation of real machine learning models to replace the current mock/placeholder implementations in the ML demo components. The solution will integrate actual BERT-based sentiment analysis and authentic collaborative filtering using matrix factorization techniques, all running client-side using Hugging Face Transformers.js and custom ML utilities. The design leverages the existing ML infrastructure while extending it with production-quality model implementations that demonstrate real-world ML engineering capabilities.

## Architecture

### ML Infrastructure Foundation

The implementation will build upon the existing Hugging Face Transformers.js integration, extending the current `src/utils/` ML utilities with new model managers and inference pipelines:

```
src/utils/
├── onnxLCA.ts (existing - Grounded SAM)
├── sentimentAnalysis.ts (new - BERT sentiment)
├── collaborativeFiltering.ts (new - recommendation engine)
├── modelManager.ts (new - unified model management)
└── mlUtils.ts (new - shared utilities)
```

### Model Selection Strategy

**BERT Sentiment Analysis:**
- Primary: `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (lightweight, fast)
- Fallback: `Xenova/bert-base-uncased` with custom classification head
- Model size: ~67MB (DistilBERT) vs ~440MB (full BERT)
- Inference time: ~100-300ms on modern devices

**Collaborative Filtering:**
- Matrix Factorization: Custom SVD implementation with pre-trained embeddings
- Neural Collaborative Filtering: Lightweight neural network (2-3 layers)
- Dataset: MovieLens 100K subset for demonstration
- Model size: ~5-10MB for embeddings + network weights

### Performance Optimization Strategy

1. **Progressive Model Loading**: Load models on-demand with caching
2. **Model Quantization**: Use INT8 quantized models where available
3. **Batch Processing**: Process multiple inputs efficiently
4. **Memory Management**: Implement model disposal and cleanup
5. **Fallback Strategies**: Graceful degradation for unsupported devices

## Components and Interfaces

### Enhanced Sentiment Analysis Component

```typescript
interface SentimentResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral?: number;
  };
  processingTime: number;
  modelInfo: {
    name: string;
    size: string;
    architecture: string;
  };
}

interface SentimentAnalysisState {
  isModelLoading: boolean;
  isAnalyzing: boolean;
  modelLoadProgress: number;
  error: string | null;
  result: SentimentResult | null;
  modelReady: boolean;
}
```

### Collaborative Filtering Component

```typescript
interface MovieRating {
  movieId: number;
  title: string;
  rating: number;
  genres: string[];
}

interface RecommendationResult {
  movieId: number;
  title: string;
  predictedRating: number;
  confidence: number;
  genres: string[];
  explanation: string;
  similarUsers?: number[];
}

interface CollaborativeFilteringState {
  userRatings: MovieRating[];
  recommendations: RecommendationResult[];
  isModelLoading: boolean;
  isGenerating: boolean;
  modelLoadProgress: number;
  algorithm: 'svd' | 'neural' | 'hybrid';
  error: string | null;
}
```

### Model Manager Interface

```typescript
interface ModelManager {
  loadModel(modelId: string, options?: ModelLoadOptions): Promise<void>;
  unloadModel(modelId: string): void;
  isModelLoaded(modelId: string): boolean;
  getModelInfo(modelId: string): ModelInfo | null;
  getMemoryUsage(): MemoryUsage;
  clearCache(): void;
}

interface ModelLoadOptions {
  device?: 'cpu' | 'wasm' | 'webgl';
  quantized?: boolean;
  progressCallback?: (progress: number) => void;
  priority?: 'high' | 'normal' | 'low';
}

interface ModelInfo {
  name: string;
  size: number;
  architecture: string;
  loadTime: number;
  memoryUsage: number;
  device: string;
}
```

## Data Models

### Sentiment Analysis Models

```typescript
// BERT Tokenizer Configuration
interface BERTConfig {
  modelName: string;
  maxLength: number;
  truncation: boolean;
  padding: boolean;
  returnTensors: 'pt' | 'tf';
}

// Preprocessing Pipeline
interface TextPreprocessor {
  clean(text: string): string;
  tokenize(text: string): TokenizedInput;
  validate(text: string): ValidationResult;
}

interface TokenizedInput {
  inputIds: number[];
  attentionMask: number[];
  tokenTypeIds?: number[];
  tokens: string[];
}
```

### Collaborative Filtering Models

```typescript
// Movie Database Schema
interface Movie {
  id: number;
  title: string;
  genres: string[];
  year: number;
  averageRating: number;
  ratingCount: number;
  features?: number[]; // Learned embeddings
}

// User Profile
interface UserProfile {
  ratings: Map<number, number>;
  preferences: GenrePreferences;
  features?: number[]; // Learned embeddings
}

interface GenrePreferences {
  [genre: string]: number; // Preference score
}

// Matrix Factorization Model
interface SVDModel {
  userFeatures: Float32Array[];
  itemFeatures: Float32Array[];
  userBias: Float32Array;
  itemBias: Float32Array;
  globalMean: number;
  numFactors: number;
}

// Neural Collaborative Filtering
interface NCFModel {
  userEmbedding: EmbeddingLayer;
  itemEmbedding: EmbeddingLayer;
  mlpLayers: DenseLayer[];
  outputLayer: DenseLayer;
  numUsers: number;
  numItems: number;
  embeddingDim: number;
}
```

### Performance Monitoring

```typescript
interface PerformanceMetrics {
  modelLoadTime: number;
  inferenceTime: number;
  memoryUsage: number;
  throughput: number; // items per second
  accuracy?: number;
  deviceInfo: DeviceInfo;
}

interface DeviceInfo {
  userAgent: string;
  hardwareConcurrency: number;
  memory?: number;
  webglSupported: boolean;
  wasmSupported: boolean;
}
```

## Error Handling

### Graceful Degradation Strategy

1. **Model Loading Failures**:
   - Retry with exponential backoff
   - Fall back to smaller/simpler models
   - Provide offline mode with cached results
   - Clear error messaging with recovery options

2. **Inference Errors**:
   - Input validation and sanitization
   - Timeout handling for long-running inference
   - Memory overflow protection
   - Graceful handling of unsupported inputs

3. **Device Compatibility**:
   - Feature detection for WebGL/WASM support
   - Automatic device selection (CPU/GPU)
   - Performance warnings for low-end devices
   - Alternative implementations for unsupported browsers

### Error Recovery Mechanisms

```typescript
interface ErrorHandler {
  handleModelLoadError(error: Error, modelId: string): Promise<void>;
  handleInferenceError(error: Error, input: any): Promise<any>;
  handleMemoryError(error: Error): Promise<void>;
  reportError(error: Error, context: string): void;
}

interface FallbackStrategy {
  primaryModel: string;
  fallbackModels: string[];
  offlineMode: boolean;
  cachedResults: boolean;
}
```

## Testing Strategy

### Model Accuracy Testing

1. **Sentiment Analysis Validation**:
   - Test against known sentiment datasets (IMDB, Stanford Sentiment Treebank)
   - Cross-validation with multiple BERT variants
   - Edge case testing (sarcasm, negation, mixed sentiment)
   - Performance benchmarking across devices

2. **Collaborative Filtering Validation**:
   - Test against MovieLens validation set
   - Compare SVD vs Neural CF performance
   - Cold-start problem handling
   - Recommendation diversity and novelty metrics

### Performance Testing

```typescript
interface PerformanceTest {
  testModelLoading(): Promise<LoadingMetrics>;
  testInferenceSpeed(batchSizes: number[]): Promise<InferenceMetrics>;
  testMemoryUsage(): Promise<MemoryMetrics>;
  testConcurrentInference(): Promise<ConcurrencyMetrics>;
  testDeviceCompatibility(): Promise<CompatibilityReport>;
}

interface LoadingMetrics {
  downloadTime: number;
  initializationTime: number;
  totalTime: number;
  modelSize: number;
  cacheHitRate: number;
}
```

### Integration Testing

1. **Component Integration**:
   - Test model loading in React components
   - Verify state management during async operations
   - Test error boundary behavior
   - Validate accessibility during loading states

2. **Cross-Browser Testing**:
   - Chrome, Firefox, Safari, Edge compatibility
   - Mobile browser testing (iOS Safari, Chrome Mobile)
   - WebGL/WASM feature detection
   - Performance across different hardware

## Implementation Phases

### Phase 1: BERT Sentiment Analysis (Priority: High)

**Week 1-2: Core Implementation**
- Set up BERT model loading and caching
- Implement text preprocessing pipeline
- Create sentiment analysis inference engine
- Add performance monitoring and error handling

**Week 3: Component Integration**
- Replace mock implementation in SentimentAnalysisDemo
- Add model loading progress indicators
- Implement result visualization with confidence scores
- Add model information display

### Phase 2: Collaborative Filtering (Priority: High)

**Week 4-5: Matrix Factorization**
- Implement SVD-based collaborative filtering
- Create movie database and rating system
- Add recommendation generation pipeline
- Implement explanation generation

**Week 6: Neural Collaborative Filtering**
- Implement lightweight neural network model
- Add hybrid recommendation approach
- Create A/B testing framework for algorithms
- Optimize for client-side performance

### Phase 3: Advanced Features (Priority: Medium)

**Week 7: Model Management**
- Implement unified model manager
- Add model versioning and updates
- Create performance monitoring dashboard
- Implement advanced caching strategies

**Week 8: Production Optimization**
- Model quantization and compression
- Advanced error handling and recovery
- Performance optimization for mobile devices
- Comprehensive testing and validation

### Phase 4: Enhancement and Polish (Priority: Low)

**Week 9-10: Advanced Features**
- Real-time model performance monitoring
- A/B testing for different model variants
- Advanced visualization and explanations
- Integration with analytics and feedback systems

## Technical Specifications

### BERT Sentiment Analysis Pipeline

```typescript
class BERTSentimentAnalyzer {
  private tokenizer: any;
  private model: any;
  private config: BERTConfig;

  async initialize(modelName: string): Promise<void> {
    // Load tokenizer and model
    this.tokenizer = await AutoTokenizer.from_pretrained(modelName);
    this.model = await AutoModelForSequenceClassification.from_pretrained(modelName);
  }

  async analyze(text: string): Promise<SentimentResult> {
    // Preprocess text
    const inputs = await this.tokenizer(text, {
      truncation: true,
      padding: true,
      max_length: 512,
      return_tensors: 'pt'
    });

    // Run inference
    const outputs = await this.model(inputs);
    const predictions = softmax(outputs.logits);

    // Post-process results
    return this.formatResults(predictions, text);
  }
}
```

### Collaborative Filtering Implementation

```typescript
class CollaborativeFilteringEngine {
  private svdModel: SVDModel;
  private movieDatabase: Map<number, Movie>;
  private userProfiles: Map<string, UserProfile>;

  async loadMovieDatabase(): Promise<void> {
    // Load MovieLens subset
    const movies = await fetch('/data/movies.json').then(r => r.json());
    this.movieDatabase = new Map(movies.map(m => [m.id, m]));
  }

  async trainSVD(ratings: UserRating[]): Promise<void> {
    // Implement SVD matrix factorization
    const { U, S, V } = this.computeSVD(this.createRatingMatrix(ratings));
    this.svdModel = this.createSVDModel(U, S, V);
  }

  async generateRecommendations(userRatings: MovieRating[]): Promise<RecommendationResult[]> {
    const userVector = this.createUserVector(userRatings);
    const predictions = this.predictRatings(userVector);
    return this.rankAndFilterRecommendations(predictions);
  }
}
```

### Memory Management

```typescript
class ModelMemoryManager {
  private modelCache: Map<string, any> = new Map();
  private memoryUsage: Map<string, number> = new Map();
  private maxMemoryUsage: number = 500 * 1024 * 1024; // 500MB

  async loadModel(modelId: string, loader: () => Promise<any>): Promise<any> {
    if (this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId);
    }

    // Check memory constraints
    await this.ensureMemoryAvailable();

    const model = await loader();
    this.modelCache.set(modelId, model);
    this.memoryUsage.set(modelId, this.estimateModelSize(model));

    return model;
  }

  private async ensureMemoryAvailable(): Promise<void> {
    const currentUsage = Array.from(this.memoryUsage.values()).reduce((a, b) => a + b, 0);
    if (currentUsage > this.maxMemoryUsage * 0.8) {
      await this.evictLeastRecentlyUsed();
    }
  }
}
```

This comprehensive design provides a robust foundation for implementing real ML models while maintaining excellent user experience, performance, and reliability across different devices and network conditions.