import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useState, Suspense } from "react";
import { LazyComponent } from "@/components/ui/lazy-component";
import { DemoSkeleton } from "@/components/ui/demo-skeleton";

interface ModelCardProps {
  title: string;
  description: string;
  explanation: string;
  githubUrl: string;
  tags: string[];
  demoComponent?: React.ReactNode;
  accuracy?: string;
  dataset?: string;
  confidence?: number; // For confidence meters (0-100)
  isProcessing?: boolean; // For loading states
}

const ModelCard = ({ 
  title, 
  description, 
  explanation, 
  githubUrl, 
  tags, 
  demoComponent, 
  accuracy, 
  dataset,
  confidence,
  isProcessing = false
}: ModelCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="group relative overflow-hidden bg-card backdrop-blur-sm transition-all duration-300 touch-manipulation hover:shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative z-10 p-4 sm:p-6">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl mb-2 text-foreground break-words">
              {title}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </CardDescription>
          </div>
          
          {/* Quick action buttons - always visible on mobile */}
          <div className="flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 ml-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/20 transition-all duration-300 touch-manipulation"
              onClick={() => window.open(githubUrl, '_blank')}
            >
              <Github className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/20 transition-all duration-300 touch-manipulation"
              onClick={() => window.open(githubUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {tags.map((tag, index) => (
            <Badge 
              key={index}
              variant="secondary" 
              className="text-xs px-2 py-1"
            >
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Metrics */}
        {(accuracy || dataset || confidence !== undefined) && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {accuracy && (
                <span className="flex items-center gap-1">
                  Accuracy: <strong className="text-primary">{accuracy}</strong>
                </span>
              )}
              {dataset && (
                <span className="flex items-center gap-1">
                  Dataset: <strong className="text-foreground">{dataset}</strong>
                </span>
              )}
            </div>
            
            {/* Confidence meter */}
            {confidence !== undefined && (
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="text-primary font-semibold">{confidence}%</span>
                </div>
                <div className="relative h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative z-10 p-4 sm:p-6 pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* Explanation section */}
          <div>
            <h4 className="font-semibold mb-2 text-primary flex items-center text-sm sm:text-base">
              How it works:
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          </div>
          
          {/* Expandable demo section */}
          {demoComponent && (
            <div className="space-y-2 sm:space-y-3">
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full justify-between p-2.5 sm:p-3 h-auto bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 touch-manipulation"
              >
                <span className="font-semibold text-primary flex items-center text-sm sm:text-base">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Interactive Demo
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                )}
              </Button>
              
              {/* Expandable demo content */}
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isExpanded ? 'max-h-[500px] sm:max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-primary/10">
                  {isExpanded ? (
                    <LazyComponent
                      fallback={<DemoSkeleton type="image-classification" />}
                      minHeight="200px"
                    >
                      <Suspense fallback={<DemoSkeleton type="image-classification" />}>
                        {demoComponent}
                      </Suspense>
                    </LazyComponent>
                  ) : null}
                </div>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 touch-manipulation text-sm sm:text-base py-2.5 sm:py-3"
              onClick={() => window.open(githubUrl, '_blank')}
            >
              <Github className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              View Code
            </Button>
            
            {demoComponent && (
              <Button 
                variant="outline"
                className="flex-1 border-primary/30 hover:border-primary text-primary hover:bg-primary/10 transition-all duration-300 touch-manipulation text-sm sm:text-base py-2.5 sm:py-3"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {isExpanded ? 'Hide Demo' : 'Try Demo'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelCard;