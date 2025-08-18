/**
 * TensorFlow.js-based sentiment analysis
 * Uses a smaller, more reliable model approach
 */

import { SentimentResult } from './mlUtils';

// Simple but effective sentiment analysis using TensorFlow.js
export class TensorFlowSentiment {
  private model: any = null;
  private tokenizer: any = null;
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
      console.log('🤖 Loading TensorFlow.js sentiment model...');
      
      if (progressCallback) progressCallback(10);

      // Import TensorFlow.js
      const tf = await import('@tensorflow/tfjs');
      
      if (progressCallback) progressCallback(30);

      // Create a simple sentiment model using TensorFlow.js
      // This is a lightweight approach that doesn't require downloading large models
      this.model = await this.createSimpleModel(tf);
      this.tokenizer = this.createSimpleTokenizer();

      if (progressCallback) progressCallback(90);

      // Test the model
      console.log('🧪 Testing TensorFlow sentiment model...');
      const testResult = await this.analyze('I love this!');
      console.log('✅ TensorFlow model test result:', testResult);

      this.isInitialized = true;
      
      if (progressCallback) progressCallback(100);
      
      console.log('✅ TensorFlow sentiment model ready!');
      
    } catch (error) {
      this.initializationPromise = null;
      console.error('❌ Failed to initialize TensorFlow model:', error);
      throw error;
    }
  }

  private async createSimpleModel(tf: any): Promise<any> {
    // Create a simple neural network for sentiment analysis
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Pre-train with some basic patterns (this is a simplified approach)
    await this.preTrainModel(model, tf);

    return model;
  }

  private async preTrainModel(model: any, tf: any): Promise<void> {
    // Create some basic training data for sentiment patterns
    const positivePatterns = [
      'love', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'good', 'nice', 'perfect', 'brilliant', 'outstanding', 'superb'
    ];

    const negativePatterns = [
      'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'disgusting',
      'poor', 'useless', 'pathetic', 'ridiculous', 'boring', 'ugly'
    ];

    // Create training vectors (simplified approach)
    const trainingData = [];
    const labels = [];

    // Positive examples
    positivePatterns.forEach(word => {
      const vector = this.createWordVector(word, 100);
      trainingData.push(vector);
      labels.push(1); // Positive
    });

    // Negative examples
    negativePatterns.forEach(word => {
      const vector = this.createWordVector(word, 100);
      trainingData.push(vector);
      labels.push(0); // Negative
    });

    const xs = tf.tensor2d(trainingData);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Quick training (just a few epochs for basic patterns)
    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 4,
      verbose: 0
    });

    xs.dispose();
    ys.dispose();
  }

  private createWordVector(word: string, size: number): number[] {
    // Simple hash-based word embedding
    const vector = new Array(size).fill(0);
    
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const index = (charCode * (i + 1)) % size;
      vector[index] = Math.sin(charCode / 100);
    }
    
    return vector;
  }

  private createSimpleTokenizer() {
    return {
      tokenize: (text: string): string[] => {
        return text.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 0);
      },
      
      vectorize: (tokens: string[], size: number = 100): number[] => {
        const vector = new Array(size).fill(0);
        
        tokens.forEach((token, index) => {
          const wordVector = this.createWordVector(token, size);
          for (let i = 0; i < size; i++) {
            vector[i] += wordVector[i] / tokens.length;
          }
        });
        
        return vector;
      }
    };
  }

  async analyze(text: string): Promise<SentimentResult> {
    if (!this.isInitialized || !this.model || !this.tokenizer) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    const startTime = performance.now();

    try {
      // Tokenize and vectorize the input
      const tokens = this.tokenizer.tokenize(text);
      const vector = this.tokenizer.vectorize(tokens, 100);

      // Import TensorFlow.js for prediction
      const tf = await import('@tensorflow/tfjs');
      
      // Make prediction
      const inputTensor = tf.tensor2d([vector]);
      const prediction = this.model.predict(inputTensor) as any;
      const score = await prediction.data();
      
      inputTensor.dispose();
      prediction.dispose();

      const confidence = score[0];
      const label = confidence > 0.5 ? 'POSITIVE' : 'NEGATIVE';
      
      const processingTime = performance.now() - startTime;

      const result: SentimentResult = {
        label: label as 'POSITIVE' | 'NEGATIVE',
        confidence: confidence > 0.5 ? confidence : 1 - confidence,
        processingTime,
        modelInfo: {
          name: 'TensorFlow.js Neural Network',
          size: '< 1MB',
          architecture: 'Dense Neural Network'
        }
      };

      console.log('🎯 TensorFlow analysis result:', result);
      return result;

    } catch (error) {
      console.error('❌ TensorFlow analysis failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  getModelInfo() {
    return {
      name: 'TensorFlow.js Sentiment Classifier',
      architecture: 'Dense Neural Network',
      size: '< 1MB',
      source: 'Local Training',
      quantized: false
    };
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.tokenizer = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

// Export a singleton instance
export const tensorflowSentiment = new TensorFlowSentiment();