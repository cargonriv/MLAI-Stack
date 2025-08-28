import React, { useState, useEffect } from 'react';
import { onnxSentiment } from '@/utils/onnxSentiment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const TestSentimentDemo = () => {
  console.log('🚨 TestSentimentDemo component loaded successfully!');

  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize the Hugging Face model
  useEffect(() => {
    const initModel = async () => {
      try {
        console.log('🚀 Initializing Hugging Face model...');
        setIsLoading(true);

        await onnxSentiment.initialize((progress) => {
          console.log(`📊 Loading progress: ${progress}%`);
        });

        setIsModelReady(true);
        setIsLoading(false);
        console.log('✅ Hugging Face model ready!');
      } catch (err) {
        console.error('❌ Model initialization failed:', err);
        setError(`Model failed to load: ${err}`);
        setIsLoading(false);
      }
    };

    initModel();
  }, []);

  const analyzeSentiment = async () => {
    if (!text.trim() || !isModelReady) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('🤖 Analyzing sentiment with Hugging Face...');

      const sentimentResult = await onnxSentiment.analyze(text);
      console.log('📊 Sentiment result:', sentimentResult);

      setResult(sentimentResult);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(`Analysis failed: ${err}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 border-4 border-green-500 bg-green-100 text-center rounded-lg">
        <h1 className="text-3xl font-bold text-green-800 mb-2">
          🤖 Hugging Face Sentiment Analysis
        </h1>
        <p className="text-lg text-green-700">
          Using Twitter RoBERTa model via Transformers.js
        </p>
      </div>

      {/* Model Status */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Model Status:</h3>
        {isLoading && !isModelReady && (
          <div className="text-blue-600">🔄 Loading Hugging Face model...</div>
        )}
        {isModelReady && (
          <div className="text-green-600">✅ Model ready!</div>
        )}
        {error && (
          <div className="text-red-600">❌ {error}</div>
        )}
      </div>

      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Enter text to analyze:
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something like 'I love this!' or 'This is terrible'"
            className="min-h-[100px]"
            disabled={!isModelReady}
          />
        </div>

        <Button
          onClick={analyzeSentiment}
          disabled={!text.trim() || !isModelReady || isLoading}
          className="w-full"
        >
          {isLoading ? '🔄 Analyzing...' : '🚀 Analyze Sentiment'}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-3">Results:</h3>
          <div className="space-y-2">
            <div className={`text-lg font-bold ${result.label === 'POSITIVE' ? 'text-green-600' : 'text-red-600'
              }`}>
              Sentiment: {result.label}
            </div>
            <div>Confidence: {(result.confidence * 100).toFixed(1)}%</div>
            <div>Processing Time: {result.processingTime.toFixed(1)}ms</div>
            <div className="text-sm text-gray-600">
              Model: {result.modelInfo.name} ({result.modelInfo.architecture})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSentimentDemo;