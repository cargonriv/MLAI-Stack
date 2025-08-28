import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Zap, AlertCircle, CheckCircle, Cpu, Clock, Wifi, WifiOff } from "lucide-react";

interface SentimentResult {
  label: string;
  confidence: number;
  scores: {
    positive: number;
    negative: number;
  };
  processing_time: number;
  model_info: {
    name: string;
    architecture: string;
    size: string;
    device: string;
  };
}

interface SentimentState {
  isAnalyzing: boolean;
  result: SentimentResult | null;
  error: string | null;
  isOnline: boolean;
}

const SentimentAnalysisDemoBackend = () => {
  const [text, setText] = useState("");
  const [state, setState] = useState<SentimentState>({
    isAnalyzing: false,
    result: null,
    error: null,
    isOnline: navigator.onLine
  });

  // Monitor network status
  useState(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  const analyzeSentiment = async () => {
    if (!text.trim() || text.length < 3) {
      setState(prev => ({ ...prev, error: 'Please enter at least 3 characters for analysis.' }));
      return;
    }

    if (!state.isOnline) {
      setState(prev => ({ ...prev, error: 'You are offline. Please check your internet connection.' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      result: null
    }));

    try {
      const response = await fetch('/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SentimentResult = await response.json();

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        result,
        error: null
      }));

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      
      let errorMessage = 'Analysis failed. ';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Cannot connect to the backend server. Make sure the FastAPI server is running on port 8000.';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));
    }
  };

  const getSentimentColor = (label: string): string => {
    switch (label.toUpperCase()) {
      case 'POSITIVE':
        return 'bg-green-500';
      case 'NEGATIVE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSentimentEmoji = (label: string): string => {
    switch (label.toUpperCase()) {
      case 'POSITIVE':
        return '😊';
      case 'NEGATIVE':
        return '😞';
      default:
        return '😐';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      analyzeSentiment();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">BERT Sentiment Analysis</h3>
        <Badge variant="secondary" className="text-xs">
          FastAPI Backend
        </Badge>
      </div>

      {/* Network Status */}
      {!state.isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You are offline. Sentiment analysis requires an internet connection to the backend server.
          </AlertDescription>
        </Alert>
      )}

      {/* Input Section */}
      <div className="space-y-3">
        <div>
          <label htmlFor="sentiment-text" className="block text-sm font-medium mb-2">
            Enter text to analyze:
          </label>
          <Textarea
            id="sentiment-text"
            placeholder="Type your text here... (e.g., 'I love this product!' or 'This is terrible')"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[100px] resize-none"
            maxLength={500}
            disabled={state.isAnalyzing || !state.isOnline}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {text.length}/500 characters
            </p>
            <p className="text-xs text-gray-500">
              Press Ctrl+Enter to analyze
            </p>
          </div>
        </div>

        <Button
          onClick={analyzeSentiment}
          disabled={state.isAnalyzing || !text.trim() || text.length < 3 || !state.isOnline}
          className="w-full"
        >
          {state.isAnalyzing ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4 mr-2" />
              Analyze Sentiment
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {state.result && (
        <div className="space-y-4">
          {/* Main Result */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Analysis Result
              </h4>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Backend API</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Sentiment Label */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getSentimentEmoji(state.result.label)}</span>
                <div>
                  <Badge className={`${getSentimentColor(state.result.label)} text-white`}>
                    {state.result.label}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Confidence: {(state.result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Score Breakdown:
                </h5>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Positive:</span>
                    <span className="text-sm font-mono">
                      {(state.result.scores.positive * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Negative:</span>
                    <span className="text-sm font-mono">
                      {(state.result.scores.negative * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Information */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h5 className="font-medium text-blue-800 dark:text-blue-200">
                Model Information
              </h5>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-600 dark:text-blue-400">Architecture:</span>
                <p className="font-mono text-xs">{state.result.model_info.architecture}</p>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Size:</span>
                <p className="font-mono text-xs">{state.result.model_info.size}</p>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Device:</span>
                <p className="font-mono text-xs">{state.result.model_info.device.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 dark:text-blue-400">Time:</span>
                <p className="font-mono text-xs">{state.result.processing_time}ms</p>
              </div>
            </div>
          </div>

          {/* Backend Status */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Powered by FastAPI + DistilBERT</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4">
        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
          How it works:
        </h5>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Frontend sends text to FastAPI backend via <code>/api/sentiment</code></li>
          <li>• Backend uses DistilBERT model for real-time analysis</li>
          <li>• Returns sentiment label, confidence scores, and timing info</li>
          <li>• Supports both positive and negative sentiment classification</li>
        </ul>
      </div>
    </div>
  );
};

export default SentimentAnalysisDemoBackend;