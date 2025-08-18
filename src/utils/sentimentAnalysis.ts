/**
 * BERT Sentiment Analysis Engine
 * Implements real BERT-based sentiment analysis with preprocessing, model loading, and inference
 */

import { 
  SentimentResult, 
  BERTConfig, 
  TextPreprocessor, 
  TokenizedInput, 
  ValidationResult,
  ModelLoadOptions,
  mlUtils 
} from './mlUtils';
import { modelManager } from './modelManager';

// Hugging Face Transformers.js imports
let AutoTokenizer: unknown;
let AutoModelForSequenceClassification: unknown;
let pipeline: unknown;

// Lazy load Transformers.js to avoid bundle size issues
async function loadTransformers() {
  if (!AutoTokenizer) {
    const transformers = await import('@xenova/transformers');
    AutoTokenizer = transformers.AutoTokenizer;
    AutoModelForSequenceClassification = transformers.AutoModelForSequenceClassification;
    pipeline = transformers.pipeline;
  }
  return { AutoTokenizer, AutoModelForSequenceClassification, pipeline };
}

export interface BERTSentimentConfig extends BERTConfig {
  modelName: string;
  maxLength: number;
  truncation: boolean;
  padding: boolean;
  returnTensors: 'pt' | 'tf';
  device?: 'cpu' | 'wasm' | 'webgl';
  quantized?: boolean;
}

export interface SentimentAnalysisOptions {
  includeNeutral?: boolean;
  confidenceThreshold?: number;
  batchSize?: number;
  timeout?: number;
}

export class BERTTextPreprocessor implements TextPreprocessor {
  private config: BERTSentimentConfig;

  constructor(config: BERTSentimentConfig) {
    this.config = config;
  }

  clean(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .trim()
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive punctuation
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      .replace(/[.]{3,}/g, '...')
      // Remove control characters but keep basic punctuation
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Limit length for processing
      .substring(0, this.config.maxLength * 4); // Allow some buffer for tokenization
  }

  async tokenize(text: string): Promise<TokenizedInput> {
    const { AutoTokenizer } = await loadTransformers();
    
    try {
      const tokenizer = await AutoTokenizer.from_pretrained(this.config.modelName);
      
      const encoded = await tokenizer(text, {
        truncation: this.config.truncation,
        padding: this.config.padding,
        max_length: this.config.maxLength,
        return_tensors: this.config.returnTensors
      });

      return {
        inputIds: Array.from(encoded.input_ids.data),
        attentionMask: Array.from(encoded.attention_mask.data),
        tokenTypeIds: encoded.token_type_ids ? Array.from(encoded.token_type_ids.data) : undefined,
        tokens: encoded.tokens || []
      };
    } catch (error) {
      throw mlUtils.error.createError(
        `Tokenization failed: ${(error as Error).message}`,
        'TOKENIZATION_ERROR',
        this.config.modelName,
        'BERTTextPreprocessor.tokenize'
      );
    }
  }

  validate(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if text is provided
    if (!text || typeof text !== 'string') {
      errors.push('Text input is required and must be a string');
    }

    // Check text length
    if (text && text.length === 0) {
      errors.push('Text cannot be empty');
    }

    if (text && text.length > 10000) {
      warnings.push('Text is very long and will be truncated');
    }

    // Check for potentially problematic content
    if (text && text.length < 3) {
      warnings.push('Very short text may not provide reliable sentiment analysis');
    }

    // Check for non-English characters (basic check)
    // eslint-disable-next-line no-control-regex
    if (text && /[^\x00-\x7F]/.test(text)) {
      warnings.push('Non-ASCII characters detected - model is optimized for English text');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export class BERTSentimentAnalyzer {
  private config: BERTSentimentConfig;
  private preprocessor: BERTTextPreprocessor;
  private model: unknown = null;
  private tokenizer: unknown = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Default configuration for DistilBERT
  private static readonly DEFAULT_CONFIG: BERTSentimentConfig = {
    modelName: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    maxLength: 512,
    truncation: true,
    padding: true,
    returnTensors: 'pt',
    device: 'cpu',
    quantized: true
  };

  // Alternative models to try if primary fails (in order of preference)
  private static readonly FALLBACK_MODELS = [
    'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    'Xenova/cardiffnlp-twitter-roberta-base-sentiment-latest',
    'Xenova/nlptown-bert-base-multilingual-uncased-sentiment',
    'Xenova/bert-base-uncased'
  ];

  constructor(config?: Partial<BERTSentimentConfig>) {
    this.config = { ...BERTSentimentAnalyzer.DEFAULT_CONFIG, ...config };
    this.preprocessor = new BERTTextPreprocessor(this.config);
  }

  async initialize(options?: ModelLoadOptions): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(options);
    return this.initializationPromise;
  }

  private async performInitialization(options?: ModelLoadOptions): Promise<void> {
    const startTime = performance.now();
    
    try {
      mlUtils.performance.startTimer('bert_initialization');

      // Detect optimal device
      await mlUtils.device.detectCapabilities();
      const optimalDevice = mlUtils.device.getOptimalDevice();
      
      // Update config with optimal device if not specified
      if (!this.config.device || this.config.device === 'cpu') {
        this.config.device = optimalDevice;
      }

      // Load model using model manager
      const modelLoadOptions: ModelLoadOptions = {
        device: this.config.device,
        quantized: this.config.quantized,
        priority: 'high',
        timeout: 60000, // 60 seconds for model loading
        ...options
      };

      await modelManager.loadModel(
        this.config.modelName,
        () => this.loadBERTModel(),
        modelLoadOptions
      );

      const initTime = mlUtils.performance.endTimer('bert_initialization');
      
      this.isInitialized = true;
      
      console.log(`BERT Sentiment Analyzer initialized in ${initTime.toFixed(2)}ms`);
      
    } catch (error) {
      this.initializationPromise = null;
      throw mlUtils.error.createError(
        `Failed to initialize BERT sentiment analyzer: ${(error as Error).message}`,
        'INITIALIZATION_ERROR',
        this.config.modelName,
        'BERTSentimentAnalyzer.initialize'
      );
    }
  }

  private async loadBERTModel(): Promise<unknown> {
    const { pipeline } = await loadTransformers();
    
    console.log('🤖 Loading BERT sentiment analysis model...');
    
    try {
      // Use the most reliable model with simple configuration
      const sentimentPipeline = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        {
          quantized: false,
          progress_callback: (progress: any) => {
            if (progress.status === 'downloading') {
              console.log(`📥 Downloading: ${progress.name} (${Math.round(progress.progress)}%)`);
            } else if (progress.status === 'loading') {
              console.log(`⚡ Loading: ${progress.name}`);
            }
          }
        }
      );

      console.log('✅ BERT model loaded successfully!');
      
      // Test the model
      const testResult = await (sentimentPipeline as any)('I love this!');
      console.log('🧪 Model test result:', testResult);
      
      return sentimentPipeline;
      
    } catch (error) {
      console.error('❌ Failed to load BERT model:', error);
      throw error;
    }
  }

  async analyze(text: string, options?: SentimentAnalysisOptions): Promise<SentimentResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    mlUtils.performance.startTimer('bert_inference');

    try {
      // Validate input
      const validation = this.preprocessor.validate(text);
      if (!validation.isValid) {
        throw mlUtils.error.createError(
          `Invalid input: ${validation.errors.join(', ')}`,
          'INVALID_INPUT',
          this.config.modelName,
          'BERTSentimentAnalyzer.analyze'
        );
      }

      // Preprocess text
      const cleanedText = this.preprocessor.clean(text);
      
      // Get model from cache
      const model = await modelManager.loadModel(
        this.config.modelName,
        () => this.loadBERTModel()
      );

      // Run inference
      const results = await model(cleanedText);
      
      const processingTime = mlUtils.performance.endTimer('bert_inference');

      // Process results
      const sentimentResult = this.processResults(results, processingTime, validation.warnings);

      // Record performance metrics
      mlUtils.performance.recordMetrics('bert_inference', {
        inferenceTime: processingTime,
        modelLoadTime: 0, // Already loaded
        memoryUsage: modelManager.getModelInfo(this.config.modelName)?.memoryUsage || 0,
        throughput: 1000 / processingTime, // items per second
        deviceInfo: await mlUtils.device.detectCapabilities()
      });

      return sentimentResult;

    } catch (error) {
      mlUtils.performance.endTimer('bert_inference');
      
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw ML errors as-is
      }

      throw mlUtils.error.createError(
        `Sentiment analysis failed: ${(error as Error).message}`,
        'INFERENCE_ERROR',
        this.config.modelName,
        'BERTSentimentAnalyzer.analyze'
      );
    }
  }

  private processResults(results: Array<{ label: string; score: number }>, processingTime: number, warnings: string[] = []): SentimentResult {
    if (!results || results.length === 0) {
      throw mlUtils.error.createError(
        'No results returned from model',
        'EMPTY_RESULTS',
        this.config.modelName,
        'BERTSentimentAnalyzer.processResults'
      );
    }

    const result = results[0];
    const label = result.label.toUpperCase() as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    const confidence = result.score;

    // Create scores object
    const scores = {
      positive: label === 'POSITIVE' ? confidence : 1 - confidence,
      negative: label === 'NEGATIVE' ? confidence : 1 - confidence,
      neutral: label === 'NEUTRAL' ? confidence : undefined
    };

    // Get model info
    const modelInfo = modelManager.getModelInfo(this.config.modelName);

    const sentimentResult: SentimentResult = {
      label,
      confidence,
      scores,
      processingTime,
      modelInfo: {
        name: this.config.modelName,
        size: modelInfo ? mlUtils.memory.formatBytes(modelInfo.size) : 'Unknown',
        architecture: modelInfo?.architecture || 'DistilBERT'
      }
    };

    // Add warnings if any
    if (warnings.length > 0) {
      console.warn('Sentiment analysis warnings:', warnings);
    }

    return sentimentResult;
  }

  async analyzeBatch(texts: string[], options?: SentimentAnalysisOptions): Promise<SentimentResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const batchSize = options?.batchSize || 10;
    const results: SentimentResult[] = [];

    // Process in batches to avoid memory issues
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.analyze(text, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  getModelInfo() {
    return {
      config: this.config,
      isInitialized: this.isInitialized,
      modelInfo: modelManager.getModelInfo(this.config.modelName),
      memoryUsage: modelManager.getMemoryUsage()
    };
  }

  async dispose(): Promise<void> {
    if (this.isInitialized) {
      modelManager.unloadModel(this.config.modelName);
      this.isInitialized = false;
      this.initializationPromise = null;
      this.model = null;
      this.tokenizer = null;
    }
  }

  // Static factory methods for different model variants
  static createDistilBERT(config?: Partial<BERTSentimentConfig>): BERTSentimentAnalyzer {
    return new BERTSentimentAnalyzer({
      modelName: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      ...config
    });
  }

  static createRoBERTa(config?: Partial<BERTSentimentConfig>): BERTSentimentAnalyzer {
    return new BERTSentimentAnalyzer({
      modelName: 'Xenova/roberta-base-sentiment',
      ...config
    });
  }

  static createBERT(config?: Partial<BERTSentimentConfig>): BERTSentimentAnalyzer {
    return new BERTSentimentAnalyzer({
      modelName: 'Xenova/bert-base-uncased',
      maxLength: 512,
      ...config
    });
  }
}

// Export convenience functions
export const createSentimentAnalyzer = (config?: Partial<BERTSentimentConfig>) => {
  return new BERTSentimentAnalyzer(config);
};

export const createDistilBERTAnalyzer = (config?: Partial<BERTSentimentConfig>) => {
  return BERTSentimentAnalyzer.createDistilBERT(config);
};

// Default export
export default BERTSentimentAnalyzer;