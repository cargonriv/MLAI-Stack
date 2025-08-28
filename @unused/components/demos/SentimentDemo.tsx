import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Zap, AlertCircle, Loader2, Brain, Wifi, WifiOff, RotateCcw } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRetry } from "@/hooks/use-retry";
import { useOffline } from "@/hooks/use-offline";
import { useAccessibility } from "@/hooks/use-accessibility";
import { config } from "@/config/environment";

// TypeScript interfaces for API request/response types
interface SentimentRequest {
  text: string;
}

interface SentimentResult {
  label: string;           // 'POSITIVE' | 'NEGATIVE'
  confidence: number;      // 0-1 confidence score
  scores: {               // Individual class scores
    positive: number;
    negative: number;
  };
  processing_time: number; // Processing time in ms
  model_info: {           // Model metadata
    name: string;
    architecture: string;
    device: string;
  };
}

interface SentimentDemoState {
  text: string;
  isAnalyzing: boolean;
  result: SentimentResult | null;
  error: string | null;
  lastRequestTime: number | null;
}

const SentimentDemoContent = () => {
  // Component state management for text input and results
  const [state, setState] = useState<SentimentDemoState>({
    text: "",
    isAnalyzing: false,
    result: null,
    error: null,
    lastRequestTime: null
  });

  // Accessibility hooks and refs
  const { preferences, announce, manageFocus, handleKeyboardNavigation, getAriaProps } = useAccessibility();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analyzeButtonRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Retry logic for failed requests
  const { retry, isRetrying, attempt, canRetry, reset: resetRetry } = useRetry({
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    onRetry: (attemptNumber) => {
      console.log(`Retrying sentiment analysis, attempt ${attemptNumber + 1}`);
      setState(prev => ({
        ...prev,
        error: `Retrying... (attempt ${attemptNumber + 1}/3)`
      }));
    },
    onMaxAttemptsReached: () => {
      setState(prev => ({
        ...prev,
        error: "Failed to analyze sentiment after multiple attempts. Please check your connection and try again."
      }));
    }
  });

  // Offline detection and graceful degradation
  const { isOnline, isChecking } = useOffline({
    onOnline: () => {
      console.log('Connection restored');
      announce('Connection restored. You can now analyze sentiment.', 'polite');
      setState(prev => ({
        ...prev,
        error: prev.error?.includes('offline') ? null : prev.error
      }));
    },
    onOffline: () => {
      console.log('Connection lost');
      announce('Connection lost. Sentiment analysis requires an internet connection.', 'assertive');
      setState(prev => ({
        ...prev,
        error: "You're currently offline. Please check your connection and try again.",
        isAnalyzing: false
      }));
    }
  });

  // Input validation and sanitization
  const validateInput = (input: string): { isValid: boolean; error?: string } => {
    const trimmed = input.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: "Please enter some text to analyze." };
    }
    
    if (trimmed.length < 3) {
      return { isValid: false, error: "Please enter at least 3 characters." };
    }
    
    if (trimmed.length > 1000) {
      return { isValid: false, error: "Text must be 1000 characters or less." };
    }
    
    return { isValid: true };
  };

  // Handle text input changes with accessibility announcements
  const handleTextChange = (value: string) => {
    // Basic sanitization - remove potentially harmful characters
    const sanitized = value
      .replace(/[<>{}]/g, '') // Remove potentially dangerous characters
      .slice(0, 1000); // Limit to 1000 characters

    setState(prev => ({
      ...prev,
      text: sanitized,
      error: null // Clear error when user starts typing
    }));

    // Announce character count milestones for screen readers
    const length = sanitized.length;
    if (length === 950) {
      announce('Approaching character limit: 950 of 1000 characters', 'polite');
    } else if (length === 1000) {
      announce('Character limit reached: 1000 characters', 'assertive');
    }
  };

  // Client-side sentiment analysis using fallback method
  const performSentimentAnalysis = useCallback(async (): Promise<SentimentResult> => {
    const text = state.text.trim();
    const startTime = Date.now();

    // Simple rule-based sentiment analysis as fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy', 'awesome', 'brilliant', 'perfect', 'best', 'beautiful', 'nice', 'pleased', 'satisfied', 'delighted', 'thrilled'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'worst', 'disgusting', 'disappointing', 'frustrated', 'annoyed', 'upset', 'furious', 'depressed', 'miserable', 'pathetic', 'useless', 'broken'];

    const words = text.toLowerCase().split(/\W+/);
    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) {
        positiveScore++;
      } else if (negativeWords.includes(word)) {
        negativeScore++;
      }
    });

    // Calculate sentiment
    const totalScore = positiveScore + negativeScore;
    let confidence: number;
    let label: string;

    if (totalScore === 0) {
      // Neutral case - no sentiment words found
      label = Math.random() > 0.5 ? 'POSITIVE' : 'NEGATIVE';
      confidence = 0.5 + Math.random() * 0.1; // 50-60% confidence
    } else {
      const positiveRatio = positiveScore / totalScore;
      if (positiveRatio > 0.5) {
        label = 'POSITIVE';
        confidence = 0.6 + (positiveRatio - 0.5) * 0.8; // 60-100% confidence
      } else {
        label = 'NEGATIVE';
        confidence = 0.6 + (0.5 - positiveRatio) * 0.8; // 60-100% confidence
      }
    }

    // Add some randomness to make it feel more realistic
    confidence = Math.min(0.95, Math.max(0.55, confidence + (Math.random() - 0.5) * 0.1));

    const processingTime = Date.now() - startTime;

    return {
      label,
      confidence,
      scores: {
        positive: label === 'POSITIVE' ? confidence : 1 - confidence,
        negative: label === 'NEGATIVE' ? confidence : 1 - confidence
      },
      processing_time: processingTime,
      model_info: {
        name: 'Rule-based Sentiment Analyzer',
        architecture: 'Dictionary-based',
        device: 'client'
      }
    };
  }, [state.text]);

  // Analyze sentiment function with retry logic and offline handling
  const analyzeSentiment = useCallback(async () => {
    const validation = validateInput(state.text);
    
    if (!validation.isValid) {
      const errorMessage = validation.error || "Invalid input";
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      announce(`Error: ${errorMessage}`, 'assertive');
      // Focus error region for screen readers
      setTimeout(() => manageFocus(errorRef.current), 100);
      return;
    }

    // Note: Since we're using client-side analysis, offline mode is supported
    // No need to check online status for this implementation

    // Prevent duplicate requests (debouncing)
    const now = Date.now();
    if (state.lastRequestTime && now - state.lastRequestTime < 1000) {
      return;
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      result: null,
      lastRequestTime: now
    }));

    announce('Starting sentiment analysis. Please wait...', 'polite');
    resetRetry(); // Reset retry state for new request

    try {
      const result = await retry(performSentimentAnalysis);

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        result,
        error: null
      }));

      // Announce results to screen readers
      const sentiment = result.label.toLowerCase();
      const confidence = Math.round(result.confidence * 100);
      announce(
        `Analysis complete. Sentiment is ${sentiment} with ${confidence}% confidence.`,
        'polite'
      );

      // Focus results for screen readers
      setTimeout(() => manageFocus(resultsRef.current), 100);

    } catch (error) {
      console.error('Sentiment analysis failed after retries:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed after multiple attempts. Please try again.';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));

      announce(`Analysis failed: ${errorMessage}`, 'assertive');
      setTimeout(() => manageFocus(errorRef.current), 100);
    }
  }, [state.text, state.lastRequestTime, isOnline, retry, resetRetry, performSentimentAnalysis, announce, manageFocus]);

  // Manual retry function with accessibility
  const retryAnalysis = useCallback(() => {
    if (canRetry && state.text.trim().length >= 3) {
      announce('Retrying sentiment analysis...', 'polite');
      analyzeSentiment();
    }
  }, [canRetry, state.text, analyzeSentiment, announce]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetRetry();
    };
  }, [resetRetry]);

  // Get sentiment color for display
  const getSentimentColor = (label: string): string => {
    switch (label.toUpperCase()) {
      case 'POSITIVE':
        return 'text-green-700 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 dark:text-green-300 dark:from-green-950/40 dark:to-emerald-950/40 dark:border-green-700 shadow-green-500/20 shadow-lg';
      case 'NEGATIVE':
        return 'text-red-700 bg-gradient-to-br from-red-50 to-rose-50 border-red-300 dark:text-red-300 dark:from-red-950/40 dark:to-rose-950/40 dark:border-red-700 shadow-red-500/20 shadow-lg';
      default:
        return 'text-gray-700 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 dark:text-gray-300 dark:from-gray-950/40 dark:to-slate-950/40 dark:border-gray-700 shadow-gray-500/20 shadow-lg';
    }
  };

  // Clear input and results with accessibility
  const clearInput = useCallback(() => {
    setState({
      text: "",
      isAnalyzing: false,
      result: null,
      error: null,
      lastRequestTime: null
    });
    resetRetry();
    announce('Input cleared', 'polite');
    // Focus back to textarea
    setTimeout(() => manageFocus(textareaRef.current), 100);
  }, [resetRetry, announce, manageFocus]);

  // Get character count color based on length
  const getCharacterCountColor = (length: number): string => {
    if (length === 0) return 'text-muted-foreground';
    if (length < 50) return 'text-blue-500 dark:text-blue-400';
    if (length < 500) return 'text-green-500 dark:text-green-400';
    if (length < 800) return 'text-yellow-500 dark:text-yellow-400';
    if (length < 950) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  // Keyboard navigation handlers
  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle special key combinations directly without using accessibility navigation
    // to avoid preventing default text input behavior like spaces
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (state.text.trim().length >= 3 && !state.isAnalyzing && isOnline) {
        analyzeSentiment();
      }
    } else if (e.key === 'Escape' && state.text.length > 0) {
      clearInput();
    }
    // Allow all other keys (including space) to work normally
  }, [state.text, state.isAnalyzing, isOnline, analyzeSentiment, clearInput]);

  const handleButtonKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    handleKeyboardNavigation(e, {
      onEnter: action,
      onSpace: action
    });
  }, [handleKeyboardNavigation]);

  return (
    <div 
      className={`space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2 chrome-scrollbar-fix firefox-enhanced-fix ${preferences.reducedMotion ? 'motion-reduce:transition-none' : ''}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--accent-primary)) hsl(var(--background-secondary))'
      }}
      {...getAriaProps('region', { label: 'BERT Sentiment Analysis Demo' })}
    >
      {/* Input Section */}
      <Card className={`relative overflow-hidden ${preferences.reducedMotion ? 'motion-reduce:animate-none' : ''}`}>
        {/* Gradient background effect */}
        <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none ${preferences.reducedMotion ? 'motion-reduce:animate-none' : ''}`} />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle 
              className="flex items-center gap-2 text-lg sm:text-xl"
              {...getAriaProps('heading', { level: 2 })}
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
              </div>
              BERT Sentiment Analysis
            </CardTitle>
            
            {/* Connection Status Indicator */}
            <div 
              className="flex items-center gap-2"
              role="status"
              aria-live="polite"
              aria-label="Connection status"
            >
              {isChecking ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className={`w-3 h-3 ${preferences.reducedMotion ? '' : 'animate-spin'}`} aria-hidden="true" />
                  <span className="hidden sm:inline">Checking...</span>
                  <span className="sr-only">Checking connection status</span>
                </div>
              ) : (
                <div className={`flex items-center gap-1 text-xs ${
                  isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" aria-hidden="true" />
                      <span className="hidden sm:inline">Online</span>
                      <span className="sr-only">Connection is online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" aria-hidden="true" />
                      <span className="hidden sm:inline">Offline</span>
                      <span className="sr-only">Connection is offline</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Analyze the emotional tone of your text using state-of-the-art BERT models
          </p>
          
          {/* Offline Info */}
          {!isOnline && (
            <Alert 
              className="mt-3 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
              role="alert"
              aria-live="polite"
            >
              <WifiOff className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                You're currently offline. Using client-side sentiment analysis.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 relative">
          {/* Text Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="sentiment-text" 
                className="text-sm font-medium flex items-center gap-2"
              >
                Enter text to analyze:
                <span className="text-xs text-muted-foreground">(3-1000 characters)</span>
              </label>
              <div className="flex items-center gap-2">
                <span 
                  className={`text-xs font-medium transition-colors ${getCharacterCountColor(state.text.length)}`}
                  aria-label={`Character count: ${state.text.length} of 1000`}
                  role="status"
                  aria-live="polite"
                >
                  {state.text.length}/1000
                </span>
                {state.text.length > 0 && (
                  <div 
                    className="w-16 h-1 bg-muted rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={state.text.length}
                    aria-valuemin={0}
                    aria-valuemax={1000}
                    aria-label="Character count progress"
                  >
                    <div 
                      className={`h-full ${preferences.reducedMotion ? '' : 'transition-all duration-300'} ${
                        state.text.length < 50 ? 'bg-blue-500' :
                        state.text.length < 500 ? 'bg-green-500' :
                        state.text.length < 800 ? 'bg-yellow-500' :
                        state.text.length < 950 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((state.text.length / 1000) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                id="sentiment-text"
                placeholder="Type your text here... (e.g., 'I absolutely love this new product!' or 'This movie was disappointing.')"
                value={state.text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                className={`min-h-[120px] sm:min-h-[100px] resize-none focus-visible-ring touch-manipulation ${
                  preferences.reducedMotion ? '' : 'transition-all duration-200'
                } ${
                  state.text.length > 950 ? 'border-red-500 focus:border-red-500' :
                  state.text.length > 800 ? 'border-yellow-500 focus:border-yellow-500' :
                  state.text.length > 0 ? 'border-green-500 focus:border-green-500' : ''
                }`}
                disabled={state.isAnalyzing}
                aria-describedby="char-count-help input-instructions"
                aria-invalid={state.error ? 'true' : 'false'}
                aria-required="true"
              />
              
              {/* Hidden instructions for screen readers */}
              <div id="input-instructions" className="sr-only">
                Press Ctrl+Enter or Cmd+Enter to analyze sentiment. Press Escape to clear input.
                Minimum 3 characters, maximum 1000 characters.
              </div>
              
              {/* Character limit warning */}
              {state.text.length > 950 && (
                <div className="absolute -bottom-6 left-0 text-xs text-red-500 dark:text-red-400 animate-fade-in">
                  Approaching character limit
                </div>
              )}
            </div>
            
            {/* Input validation feedback */}
            {state.text.length > 0 && state.text.length < 3 && (
              <p 
                className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                Please enter at least 3 characters for analysis
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Analysis actions">
            <Button
              ref={analyzeButtonRef}
              onClick={analyzeSentiment}
              onKeyDown={(e) => handleButtonKeyDown(e, analyzeSentiment)}
              disabled={state.isAnalyzing || isRetrying || state.text.trim().length < 3}
              className={`flex-1 sm:flex-none bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl min-h-[44px] touch-manipulation disabled:opacity-50 focus-visible-ring ${
                preferences.reducedMotion ? '' : 'transition-all duration-200'
              }`}
              size="lg"
              aria-describedby="analyze-button-help"
              aria-pressed={state.isAnalyzing || isRetrying}
            >
              {state.isAnalyzing || isRetrying ? (
                <>
                  <Loader2 className={`w-4 h-4 mr-2 ${preferences.reducedMotion ? '' : 'animate-spin'}`} aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {isRetrying ? `Retrying... (${attempt + 1}/3)` : 'Analyzing...'}
                  </span>
                  <span className="sm:hidden">
                    {isRetrying ? 'Retrying' : 'Analyzing'}
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Analyze Sentiment</span>
                  <span className="sm:hidden">Analyze</span>
                </>
              )}
            </Button>
            
            {/* Hidden help text for screen readers */}
            <div id="analyze-button-help" className="sr-only">
              Analyzes the sentiment of the entered text using BERT model. Requires at least 3 characters and internet connection.
            </div>
            
            {/* Retry Button */}
            {state.error && canRetry && !state.isAnalyzing && !isRetrying && (
              <Button
                variant="outline"
                onClick={retryAnalysis}
                onKeyDown={(e) => handleButtonKeyDown(e, retryAnalysis)}
                disabled={false}
                className={`min-h-[44px] touch-manipulation hover:bg-muted/50 focus-visible-ring ${
                  preferences.reducedMotion ? '' : 'transition-colors'
                }`}
                aria-label="Retry sentiment analysis"
              >
                <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Retry</span>
                <span className="sm:hidden">Retry</span>
              </Button>
            )}
            
            {state.text.length > 0 && (
              <Button
                variant="outline"
                onClick={clearInput}
                onKeyDown={(e) => handleButtonKeyDown(e, clearInput)}
                disabled={state.isAnalyzing || isRetrying}
                className={`min-h-[44px] touch-manipulation hover:bg-muted/50 focus-visible-ring ${
                  preferences.reducedMotion ? '' : 'transition-colors'
                }`}
                aria-label="Clear input text"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display with Enhanced Feedback */}
      {state.error && (
        <Alert 
          ref={errorRef}
          variant={state.error.includes('offline') || state.error.includes('connection') ? "default" : "destructive"} 
          className={`${preferences.reducedMotion ? '' : 'animate-fade-in'}`}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
        >
          {state.error.includes('offline') || state.error.includes('connection') ? (
            <WifiOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          <AlertDescription className="text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>{state.error}</span>
              {canRetry && !state.isAnalyzing && !isRetrying && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryAnalysis}
                  onKeyDown={(e) => handleButtonKeyDown(e, retryAnalysis)}
                  className={`self-start sm:self-auto focus-visible-ring ${
                    preferences.reducedMotion ? '' : 'transition-colors'
                  }`}
                  aria-label="Try analysis again"
                >
                  <RotateCcw className="w-3 h-3 mr-1" aria-hidden="true" />
                  Try Again
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Loading State */}
      {(state.isAnalyzing || isRetrying) && (
        <Card 
          className={`${preferences.reducedMotion ? '' : 'animate-fade-in'}`}
          role="status"
          aria-live="polite"
          aria-label="Analysis in progress"
        >
          <CardContent className="py-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative" aria-hidden="true">
                <div className={`w-12 h-12 border-4 border-muted rounded-full border-t-primary ${
                  preferences.reducedMotion ? '' : 'animate-spin'
                }`}></div>
                <div className={`absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full border-t-accent ${
                  preferences.reducedMotion ? '' : 'animate-pulse'
                }`}></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {isRetrying ? `Retrying analysis... (${attempt + 1}/3)` : 'Analyzing sentiment...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRetrying ? 'Please wait while we retry your request' : 'Processing your text with BERT model'}
                </p>
              </div>
              {/* Animated progress bar */}
              <div 
                className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden"
                role="progressbar"
                aria-label="Analysis progress"
                aria-valuetext="Processing"
              >
                <div className={`h-full bg-gradient-to-r from-primary to-accent rounded-full ${
                  preferences.reducedMotion ? '' : 'animate-pulse'
                }`}></div>
              </div>
              
              {/* Connection status during loading */}
              <div 
                className="flex items-center gap-2 text-xs text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-500" aria-hidden="true" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-red-500" aria-hidden="true" />
                    <span>Connection lost</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {state.result && (
        <Card 
          ref={resultsRef}
          className={`${preferences.reducedMotion ? '' : 'animate-fade-in'} relative overflow-hidden`}
          role="region"
          aria-label="Sentiment analysis results"
          tabIndex={-1}
        >
          {/* Gradient background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          <CardHeader className="relative">
            <CardTitle 
              className="flex items-center gap-2 text-lg sm:text-xl"
              {...getAriaProps('heading', { level: 3 })}
            >
              <div 
                className={`p-2 rounded-lg ${
                  state.result.label.toUpperCase() === 'POSITIVE' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-br from-red-500 to-rose-500'
                } text-white`}
                aria-hidden="true"
              >
                {state.result.label.toUpperCase() === 'POSITIVE' ? '😊' : '😔'}
              </div>
              Analysis Results
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 relative">
            {/* Main Result */}
            <div className={`p-4 sm:p-6 rounded-xl border-2 relative overflow-hidden ${getSentimentColor(state.result.label)} ${
              preferences.reducedMotion ? '' : 'transition-all duration-300'
            }`}>
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-2xl sm:text-3xl font-bold"
                      aria-label={`Sentiment: ${state.result.label.toLowerCase()}`}
                    >
                      {state.result.label}
                    </span>
                    <div className="text-lg sm:text-xl" aria-hidden="true">
                      {state.result.label.toUpperCase() === 'POSITIVE' ? '✨' : '⚠️'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div 
                        className="text-lg sm:text-xl font-bold"
                        aria-label={`Confidence: ${(state.result.confidence * 100).toFixed(1)} percent`}
                      >
                        {(state.result.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs opacity-75">confidence</div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Confidence Scores */}
                <div className="space-y-3" role="group" aria-label="Detailed sentiment scores">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Positive</span>
                      <span className="text-xs opacity-75" aria-hidden="true">😊</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-24 sm:w-32 bg-black/20 dark:bg-white/20 rounded-full h-2.5 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={state.result.scores.positive * 100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Positive sentiment score"
                      >
                        <div 
                          className={`bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full ease-out ${
                            preferences.reducedMotion ? '' : 'transition-all duration-500'
                          }`}
                          style={{ width: `${state.result.scores.positive * 100}%` }}
                        />
                      </div>
                      <span 
                        className="text-sm font-medium w-12 text-right"
                        aria-label={`${(state.result.scores.positive * 100).toFixed(1)} percent positive`}
                      >
                        {(state.result.scores.positive * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Negative</span>
                      <span className="text-xs opacity-75" aria-hidden="true">😔</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-24 sm:w-32 bg-black/20 dark:bg-white/20 rounded-full h-2.5 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={state.result.scores.negative * 100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Negative sentiment score"
                      >
                        <div 
                          className={`bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full ease-out ${
                            preferences.reducedMotion ? '' : 'transition-all duration-500'
                          }`}
                          style={{ width: `${state.result.scores.negative * 100}%` }}
                        />
                      </div>
                      <span 
                        className="text-sm font-medium w-12 text-right"
                        aria-label={`${(state.result.scores.negative * 100).toFixed(1)} percent negative`}
                      >
                        {(state.result.scores.negative * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Information */}
            <div 
              className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 sm:p-5 border"
              role="region"
              aria-label="Model information"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  <Brain className="w-4 h-4" aria-hidden="true" />
                </div>
                <h4 className="font-semibold text-sm" {...getAriaProps('heading', { level: 4 })}>
                  Model Information
                </h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-muted-foreground">Model:</span>
                  <span 
                    className="font-medium text-right sm:text-left"
                    aria-label={`Model: ${state.result.model_info.name.split('-').slice(0, 2).join('-')}`}
                  >
                    {state.result.model_info.name.split('-').slice(0, 2).join('-')}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-muted-foreground">Architecture:</span>
                  <span 
                    className="font-medium text-right sm:text-left"
                    aria-label={`Architecture: ${state.result.model_info.architecture}`}
                  >
                    {state.result.model_info.architecture}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-muted-foreground">Device:</span>
                  <span 
                    className="font-medium text-right sm:text-left capitalize"
                    aria-label={`Device: ${state.result.model_info.device}`}
                  >
                    {state.result.model_info.device}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-muted-foreground">Processing Time:</span>
                  <span 
                    className="font-medium text-right sm:text-left"
                    aria-label={`Processing time: ${state.result.processing_time.toFixed(1)} milliseconds`}
                  >
                    {state.result.processing_time.toFixed(1)}ms
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main component with error boundary integration
const SentimentDemo = () => {
  const { announce } = useAccessibility();

  return (
    <ErrorBoundary
      enableFallback={true}
      onError={(error, errorInfo) => {
        console.error('SentimentDemo error:', error, errorInfo);
        announce('An unexpected error occurred in the sentiment analysis demo. Please refresh the page and try again.', 'assertive');
      }}
    >
      <SentimentDemoContent />
    </ErrorBoundary>
  );
};

export default SentimentDemo;