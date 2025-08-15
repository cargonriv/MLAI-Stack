import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useState, Suspense } from "react";
import { LazyComponent } from "@/components/ui/lazy-component";
import { DemoSkeleton } from "@/components/ui/demo-skeleton";
import { useScrollAnimation, useReducedMotion } from "@/hooks/use-optimized-animation";
import { Hover3D, GradientBorder, DynamicColorScheme, ThemeTransition } from "@/components/ui/advanced-visual-effects";

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
  const animationRef = useScrollAnimation(0.1);
  const prefersReducedMotion = useReducedMotion();
  return (
    <ThemeTransition>
      <DynamicColorScheme hueShift={15} saturationBoost={0.2} brightnessBoost={0.05}>
        <Hover3D intensity={prefersReducedMotion ? "subtle" : "medium"}>
          <GradientBorder animated thickness={2}>
            <Card 
              ref={animationRef}
              className="group relative overflow-hidden bg-gradient-card backdrop-blur-sm glass-effect hover:glass-effect-intense transition-all duration-500 touch-manipulation"
            >
              {/* Advanced gradient mesh overlay */}
              <div className="absolute inset-0 bg-gradient-mesh opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-gradient-mesh-shift" />
              
              {/* Interactive glow effect */}
              <div className="absolute inset-0 bg-gradient-interactive-hover opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500" />
      
      <CardHeader className="relative z-10 p-4 sm:p-6">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl mb-2 bg-gradient-to-r from-fg-primary to-accent-primary bg-clip-text text-transparent group-hover:from-accent-primary group-hover:to-accent-secondary transition-all duration-300 break-words">
              {title}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-fg-secondary group-hover:text-fg-primary transition-colors duration-300 leading-relaxed">
              {description}
            </CardDescription>
          </div>
          
          {/* Quick action buttons - always visible on mobile */}
          <div className="flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform translate-x-0 sm:translate-x-2 sm:group-hover:translate-x-0 ml-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-accent-primary/20 hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 touch-manipulation active:scale-95"
              onClick={() => window.open(githubUrl, '_blank')}
            >
              <Github className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-accent-secondary/20 hover:shadow-lg hover:shadow-accent-secondary/30 transition-all duration-300 touch-manipulation active:scale-95"
              onClick={() => window.open(githubUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        
        {/* Enhanced tags with advanced gradient effects */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {tags.map((tag, index) => (
            <DynamicColorScheme key={index} hueShift={index * 10} saturationBoost={0.1}>
              <Hover3D intensity="subtle">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-gradient-dynamic border border-accent-primary/20 hover:bg-gradient-interactive-hover hover:shadow-glow-sm transition-all duration-300 touch-manipulation active:scale-95 px-2 py-1"
                >
                  {tag}
                </Badge>
              </Hover3D>
            </DynamicColorScheme>
          ))}
        </div>
        
        {/* Enhanced metrics with confidence meter - mobile optimized */}
        {(accuracy || dataset || confidence !== undefined) && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-fg-secondary">
              {accuracy && (
                <span className="flex items-center gap-1">
                  Accuracy: <strong className="text-accent-primary">{accuracy}</strong>
                </span>
              )}
              {dataset && (
                <span className="flex items-center gap-1">
                  Dataset: <strong className="text-fg-primary">{dataset}</strong>
                </span>
              )}
            </div>
            
            {/* Advanced gradient confidence meter */}
            {confidence !== undefined && (
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-fg-secondary">Confidence</span>
                  <span className="text-accent-primary font-semibold">{confidence}%</span>
                </div>
                <GradientBorder thickness={1}>
                  <div className="relative h-1.5 sm:h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-interactive rounded-full transition-all duration-700 ease-out shadow-glow-primary animate-gradient-x"
                      style={{ width: `${confidence}%` }}
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-gradient-shift" />
                    )}
                  </div>
                </GradientBorder>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative z-10 p-4 sm:p-6 pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* Enhanced explanation section - mobile optimized */}
          <div>
            <h4 className="font-semibold mb-2 text-accent-primary flex items-center text-sm sm:text-base">
              How it works:
            </h4>
            <p className="text-xs sm:text-sm text-fg-secondary leading-relaxed group-hover:text-fg-primary transition-colors duration-300">
              {explanation}
            </p>
          </div>
          
          {/* Expandable demo section with smooth transitions - mobile optimized */}
          {demoComponent && (
            <div className="space-y-2 sm:space-y-3">
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full justify-between p-2.5 sm:p-3 h-auto bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 hover:from-accent-primary/10 hover:to-accent-secondary/10 border border-accent-primary/20 hover:border-accent-primary/40 transition-all duration-300 group/demo touch-manipulation active:scale-95"
              >
                <span className="font-semibold text-accent-primary flex items-center text-sm sm:text-base">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover/demo:scale-110 transition-transform duration-300" />
                  Interactive Demo
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-accent-secondary transition-transform duration-300" />
                ) : (
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-accent-secondary transition-transform duration-300" />
                )}
              </Button>
              
              {/* Expandable demo content with smooth animation and lazy loading */}
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isExpanded ? 'max-h-[500px] sm:max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-gradient-to-br from-bg-secondary/50 to-bg-tertiary/50 rounded-lg p-3 sm:p-4 border border-accent-primary/10 backdrop-blur-sm">
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
          
          {/* Enhanced action buttons with advanced effects */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <DynamicColorScheme hueShift={10} saturationBoost={0.2}>
              <Hover3D intensity="subtle">
                <Button 
                  className="flex-1 bg-gradient-interactive hover:bg-gradient-interactive-hover text-white font-semibold shadow-glow-md hover:shadow-glow-lg transition-all duration-300 group/btn touch-manipulation active:scale-95 text-sm sm:text-base py-2.5 sm:py-3"
                  onClick={() => window.open(githubUrl, '_blank')}
                >
                  <Github className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover/btn:rotate-12 transition-transform duration-300" />
                  View Code
                </Button>
              </Hover3D>
            </DynamicColorScheme>
            
            {demoComponent && (
              <DynamicColorScheme hueShift={20} saturationBoost={0.15}>
                <Hover3D intensity="subtle">
                  <GradientBorder animated thickness={1}>
                    <Button 
                      variant="outline"
                      className="flex-1 border-accent-primary/30 hover:border-accent-primary text-accent-primary hover:bg-accent-primary/10 hover:shadow-glow-sm transition-all duration-300 group/btn touch-manipulation active:scale-95 text-sm sm:text-base py-2.5 sm:py-3"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                      {isExpanded ? 'Hide Demo' : 'Try Demo'}
                    </Button>
                  </GradientBorder>
                </Hover3D>
              </DynamicColorScheme>
            )}
          </div>
        </div>
      </CardContent>
            </Card>
          </GradientBorder>
        </Hover3D>
      </DynamicColorScheme>
    </ThemeTransition>
  );
};

export default ModelCard;