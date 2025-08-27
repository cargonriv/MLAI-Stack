/**
 * Hugging Face Transformers sentiment analysis
 * Uses @huggingface/transformers pipeline for reliable model inference
 */

import { pipeline } from '@huggingface/transformers';
import { SentimentResult } from './mlUtils';

export class ONNXSentiment {
  private classifier: any = null;
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
      console.log('🤖 Loading Hugging Face sentiment model...');

      if (progressCallback) progressCallback(10);

      console.log('📥 Loading DistilBERT sentiment model (Xenova)...');

      if (progressCallback) progressCallback(50);

      // Initialize the pipeline with the specified model
      // Using a working sentiment analysis model
      // this.classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      this.classifier = await pipeline('text-classification', 'Xenova/twitter-roberta-base-sentiment-latest');

      if (progressCallback) progressCallback(90);

      // Set initialized flag before testing
      this.isInitialized = true;

      // Test the model
      console.log('🧪 Testing Hugging Face model...');
      const testResult = await this.analyze('I love this!');
      console.log('✅ Hugging Face model test result:', testResult);

      if (progressCallback) progressCallback(100);

      console.log('✅ Hugging Face sentiment model ready!');

    } catch (error) {
      this.initializationPromise = null;
      console.error('❌ Failed to initialize Hugging Face model:', error);
      throw error;
    }
  }



  async analyze(text: string): Promise<SentimentResult> {
    if (!this.isInitialized || !this.classifier) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    const startTime = performance.now();

    try {
      console.log('🤖 Analyzing with Hugging Face Transformers:', text);

      // Run inference using the pipeline
      const results = await this.classifier(text);

      // The pipeline returns an array of results
      const result = Array.isArray(results) ? results[0] : results;

      const processingTime = performance.now() - startTime;

      const sentimentResult: SentimentResult = {
        label: result.label.toUpperCase() as 'POSITIVE' | 'NEGATIVE',
        confidence: result.score,
        scores: {
          positive: result.label.toUpperCase() === 'POSITIVE' ? result.score : 1 - result.score,
          negative: result.label.toUpperCase() === 'NEGATIVE' ? result.score : 1 - result.score
        },
        processingTime,
        modelInfo: {
          name: 'DistilBERT Sentiment',
          size: '~67MB',
          architecture: 'DistilBERT-base'
        }
      };

      console.log('✅ Hugging Face analysis result:', sentimentResult);
      return sentimentResult;

    } catch (error) {
      console.error('❌ Hugging Face analysis failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.classifier !== null;
  }

  getModelInfo() {
    return {
      name: 'DistilBERT Base Sentiment Classifier',
      architecture: 'DistilBERT-base',
      size: '~67MB',
      source: 'Hugging Face Transformers.js',
      quantized: false,
      backend: 'WebAssembly/WebGL'
    };
  }

  dispose(): void {
    if (this.classifier) {
      // Transformers.js pipelines handle cleanup automatically
      this.classifier = null;
    }
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

// Export a singleton instance
export const onnxSentiment = new ONNXSentiment();