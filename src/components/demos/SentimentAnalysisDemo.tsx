import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Zap } from "lucide-react";

const SentimentAnalysisDemo = () => {
  const [text, setText] = useState("");
  const [sentiment, setSentiment] = useState<{label: string, score: number, color: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSentiment = () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // Simple mock sentiment analysis
      const positiveWords = ['good', 'great', 'amazing', 'excellent', 'wonderful', 'fantastic', 'love', 'awesome'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'disgusting', 'worst'];
      
      const words = text.toLowerCase().split(' ');
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
    <div className="space-y-4">
      <div className="space-y-3">
        <Textarea
          placeholder="Enter text to analyze sentiment... (e.g., 'I love this amazing product!')"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[100px] bg-background/50 border-border/50 focus:border-primary/50"
        />
        <Button 
          onClick={analyzeSentiment}
          disabled={!text.trim() || isAnalyzing}
          className="w-full bg-gradient-accent hover:shadow-glow-accent transition-all duration-300"
        >
          {isAnalyzing ? (
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
      
      {sentiment && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-primary">Result:</span>
            <Badge className={`${sentiment.color} text-white border-none`}>
              {sentiment.label}
            </Badge>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <span className="text-sm font-medium">{(sentiment.score * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className={`${sentiment.color} h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${sentiment.score * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisDemo;