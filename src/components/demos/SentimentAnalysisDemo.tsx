import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Zap } from "lucide-react";

const SentimentAnalysisDemo = () => {
  const [text, setText] = useState("");
  const [sentiment, setSentiment] = useState<{label: string, score: number, color: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const analyzeSentiment = () => {
    const sanitizedText = validateAndSanitizeInput(text);
    if (!sanitizedText.trim() || sanitizedText.length < 3) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // Simple mock sentiment analysis
      const positiveWords = ['good', 'great', 'amazing', 'excellent', 'wonderful', 'fantastic', 'love', 'awesome'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'disgusting', 'worst'];
      
      const words = sanitizedText.toLowerCase().split(' ');
      const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
      const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
      
      let result;
      if (positiveCount > negativeCount) {
        result = { label: 'Positive', score: 0.75 + Math.random() * 0.24, color: 'bg-green-500' };
      } else if (negativeCount > positiveCount) {
        result = { label: 'Negative', score: 0.75 + Math.random() * 0.24, color: 'bg-red-500' };
      } else {
        result = { label: 'Neutral', score: 0.4 + Math.random() * 0.2, color: 'bg-yellow-500' };
      }
      
      setSentiment(result);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2 sm:space-y-3">
        <Textarea
          placeholder="Enter text to analyze sentiment... (e.g., 'I love this amazing product!')"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[80px] sm:min-h-[100px] bg-background/50 border-border/50 focus:border-primary/50 text-sm touch-manipulation resize-none"
          maxLength={1000}
        />
        <div className="text-xs text-muted-foreground text-right">
          {text.length}/1000 characters
        </div>
        <Button 
          onClick={analyzeSentiment}
          disabled={!text.trim() || text.length < 3 || isAnalyzing}
          className="w-full bg-gradient-accent hover:shadow-glow-accent transition-all duration-300 touch-manipulation active:scale-95 text-sm sm:text-base py-2.5 sm:py-3"
        >
          {isAnalyzing ? (
            <>
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Analyze Sentiment
            </>
          )}
        </Button>
      </div>
      
      {sentiment && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="font-semibold text-primary text-sm sm:text-base">Result:</span>
            <Badge className={`${sentiment.color} text-white border-none text-xs sm:text-sm px-2 py-1`}>
              {sentiment.label}
            </Badge>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Confidence:</span>
            <span className="text-xs sm:text-sm font-medium">{(sentiment.score * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
            <div 
              className={`${sentiment.color} h-1.5 sm:h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${sentiment.score * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisDemo;