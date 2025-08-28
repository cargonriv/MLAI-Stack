/**
 * Example usage of BERT Sentiment Analysis Engine
 * This demonstrates how to integrate the sentiment analyzer into React components
 */

import { BERTSentimentAnalyzer, createDistilBERTAnalyzer } from './sentimentAnalysis';
import type { SentimentResult } from './mlUtils';

// Example: Basic usage
export async function basicSentimentExample() {
  // Create analyzer with default DistilBERT model
  const analyzer = createDistilBERTAnalyzer();
  
  try {
    // Initialize the model (this will download and cache the model)
    console.log('Initializing BERT model...');
    await analyzer.initialize();
    console.log('Model initialized successfully!');
    
    // Analyze some sample texts
    const sampleTexts = [
      "I love this amazing product! It's fantastic!",
      "This is terrible and I hate it.",
      "It's okay, nothing special.",
      "The weather is nice today.",
      "I'm feeling great about this project!"
    ];
    
    console.log('Analyzing sample texts...');
    for (const text of sampleTexts) {
      const result = await analyzer.analyze(text);
      console.log(`Text: "${text}"`);
      console.log(`Sentiment: ${result.label} (${(result.confidence * 100).toFixed(1)}%)`);
      console.log(`Processing time: ${result.processingTime.toFixed(2)}ms`);
      console.log('---');
    }
    
    // Get model information
    const modelInfo = analyzer.getModelInfo();
    console.log('Model Info:', {
      modelName: modelInfo.config.modelName,
      isInitialized: modelInfo.isInitialized,
      architecture: modelInfo.modelInfo?.architecture
    });
    
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
  } finally {
    // Clean up resources
    await analyzer.dispose();
  }
}

// Example: Batch processing
export async function batchSentimentExample() {
  const analyzer = createDistilBERTAnalyzer();
  
  try {
    await analyzer.initialize();
    
    const texts = [
      "Great service and friendly staff!",
      "Poor quality and overpriced.",
      "Average experience, nothing remarkable.",
      "Excellent value for money!",
      "Disappointing and frustrating."
    ];
    
    console.log('Processing batch of texts...');
    const results = await analyzer.analyzeBatch(texts, { batchSize: 3 });
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. "${texts[index]}" -> ${result.label} (${(result.confidence * 100).toFixed(1)}%)`);
    });
    
  } catch (error) {
    console.error('Batch processing error:', error);
  } finally {
    await analyzer.dispose();
  }
}

// Example: Custom configuration
export async function customConfigExample() {
  // Create analyzer with custom configuration
  const analyzer = new BERTSentimentAnalyzer({
    modelName: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    maxLength: 256, // Shorter sequences for faster processing
    device: 'cpu', // Force CPU usage
    quantized: true // Use quantized model for smaller size
  });
  
  try {
    await analyzer.initialize({
      priority: 'high',
      timeout: 30000 // 30 second timeout
    });
    
    const result = await analyzer.analyze("This custom configuration works well!");
    console.log('Custom config result:', result);
    
  } catch (error) {
    console.error('Custom config error:', error);
  } finally {
    await analyzer.dispose();
  }
}

// Example: Error handling and validation
export async function errorHandlingExample() {
  const analyzer = createDistilBERTAnalyzer();
  
  try {
    await analyzer.initialize();
    
    // Test various edge cases
    const testCases = [
      "", // Empty string
      "Hi", // Very short text
      "A".repeat(5000), // Very long text
      "Hello 🌍 world! 你好", // Mixed languages and emojis
      "   Multiple    spaces   and   punctuation!!!   " // Formatting issues
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: "${testCase.substring(0, 50)}${testCase.length > 50 ? '...' : ''}"`);
        const result = await analyzer.analyze(testCase);
        console.log(`Result: ${result.label} (${(result.confidence * 100).toFixed(1)}%)`);
      } catch (error) {
        console.log(`Error: ${(error as Error).message}`);
      }
      console.log('---');
    }
    
  } catch (error) {
    console.error('Error handling example failed:', error);
  } finally {
    await analyzer.dispose();
  }
}

// React Hook example for integration
export function useSentimentAnalysis() {
  const [analyzer, setAnalyzer] = useState<BERTSentimentAnalyzer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize analyzer
  useEffect(() => {
    const initAnalyzer = async () => {
      try {
        const newAnalyzer = createDistilBERTAnalyzer();
        await newAnalyzer.initialize();
        setAnalyzer(newAnalyzer);
        setIsInitialized(true);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    
    initAnalyzer();
    
    // Cleanup on unmount
    return () => {
      if (analyzer) {
        analyzer.dispose();
      }
    };
  }, []);
  
  const analyzeSentiment = async (text: string): Promise<SentimentResult | null> => {
    if (!analyzer || !isInitialized) {
      throw new Error('Analyzer not initialized');
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzer.analyze(text);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return {
    analyzeSentiment,
    isInitialized,
    isAnalyzing,
    error,
    modelInfo: analyzer?.getModelInfo()
  };
}

// Note: Import React hooks if using the hook example
// import { useState, useEffect } from 'react';

export default {
  basicSentimentExample,
  batchSentimentExample,
  customConfigExample,
  errorHandlingExample,
  // useSentimentAnalysis // Uncomment if React is available
};