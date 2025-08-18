/**
 * Simple BERT Sentiment Analysis using Transformers.js
 * This is a straightforward implementation that just works
 */

import { SentimentResult } from './mlUtils';

let pipeline: any = null;

export class SimpleBertSentiment {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(progressCallback?: (progress: number) => void): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(progressCallback);
    return this.initializationPromise;
  }

  private async performInitialization(progressCallback?: (progress: number) => void): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🤖 Loading BERT sentiment model...');
      
      if (progressCallback) progressCallback(10);

      // Import Transformers.js and configure it
      const transformers = await import('@xenova/transformers');
      const { pipeline: createPipeline, env } = transformers;

      // Configure Transformers.js environment
      env.allowRemoteModels = true;
      env.allowLocalModels = false;
      
      // Try different CDN endpoints
      const originalRemoteURL = env.remoteURL;
      const cdnOptions = [
        'https://huggingface.co/',
        'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/',
        originalRemoteURL
      ];

      console.log('🌐 Configuring Transformers.js environment...');
      
      if (progressCallback) progressCallback(30);

      console.log('📥 Downloading DistilBERT model...');
      
      // Try different models in order of preference
      const modelsToTry = [
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        'Xenova/cardiffnlp-twitter-roberta-base-sentiment-latest',
        'Xenova/nlptown-bert-base-multilingual-uncased-sentiment'
      ];

      let lastError: Error | null = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`🔄 Trying model: ${modelName}`);
          
          // Load the sentiment analysis pipeline
          pipeline = await createPipeline(
            'sentiment-analysis',
            modelName,
            {
              quantized: false,
              revision: 'main',
              cache_dir: './.cache/transformers',
              progress_callback: (data: any) => {
                if (data.status === 'downloading' && progressCallback) {
                  const progress = 30 + (data.progress || 0) * 0.6; // 30% to 90%
                  progressCallback(Math.min(progress, 90));
                }
              }
            }
          );

          console.log(`✅ Successfully loaded model: ${modelName}`);
          break; // Success, exit the loop

        } catch (error) {
          lastError = error as Error;
          console.warn(`❌ Failed to load model ${modelName}:`, error);
          
          // Continue to next model
          continue;
        }
      }

      // If all models failed, throw the last error
      if (!pipeline) {
        throw lastError || new Error('All models failed to load');
      }

      if (progressCallback) progressCallback(95);

      // Test the model
      console.log('🧪 Testing BERT model...');
      const testResult = await pipeline('I love this!');
      console.log('✅ BERT model test result:', testResult);

      this.isInitialized = true;
      
      if (progressCallback) progressCallback(100);
      
      console.log('✅ BERT sentiment model ready!');
      
    } catch (error) {
      this.initializationPromise = null;
      console.error('❌ Failed to initialize BERT model:', error);
      throw error;
    }
  }

  async analyze(text: string): Promise<SentimentResult> {
    if (!this.isInitialized) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    if (!pipeline) {
      throw new Error('Pipeline not available');
    }

    const startTime = performance.now();

    try {
      // Run sentiment analysis
      const results = await pipeline(text);
      const result = Array.isArray(results) ? results[0] : results;
      
      const processingTime = performance.now() - startTime;

      // Convert to our format
      const sentimentResult: SentimentResult = {
        label: result.label.toUpperCase() as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
        confidence: result.score,
        processingTime,
        modelInfo: {
          name: 'DistilBERT',
          size: '67MB',
          architecture: 'Transformer'
        }
      };

      console.log('🎯 BERT analysis result:', sentimentResult);
      return sentimentResult;

    } catch (error) {
      console.error('❌ BERT analysis failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && pipeline !== null;
  }

  getModelInfo() {
    return {
      name: 'DistilBERT Base Uncased (SST-2)',
      architecture: 'Transformer',
      size: '67MB',
      source: 'Hugging Face',
      quantized: false
    };
  }

  dispose(): void {
    pipeline = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

// Export a singleton instance
export const simpleBertSentiment = new SimpleBertSentiment();