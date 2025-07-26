import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Play } from "lucide-react";

interface ModelCardProps {
  title: string;
  description: string;
  explanation: string;
  githubUrl: string;
  tags: string[];
  demoComponent?: React.ReactNode;
  accuracy?: string;
  dataset?: string;
}

const ModelCard = ({ 
  title, 
  description, 
  explanation, 
  githubUrl, 
  tags, 
  demoComponent, 
  accuracy, 
  dataset 
}: ModelCardProps) => {
  return (
    <Card className="group hover:shadow-glow-primary/50 transition-all duration-300 bg-gradient-card border-border/50 hover:border-primary/30">
      <CardHeader>
        <div className="flex justify-between items-start mb-4">
          <div>
            <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(githubUrl, '_blank')}
            >
              <Github className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        {(accuracy || dataset) && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            {accuracy && <span>Accuracy: <strong className="text-foreground">{accuracy}</strong></span>}
            {dataset && <span>Dataset: <strong className="text-foreground">{dataset}</strong></span>}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Explanation */}
          <div>
            <h4 className="font-semibold mb-2 text-primary">How it works:</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          </div>
          
          {/* Demo Section */}
          {demoComponent && (
            <div>
              <h4 className="font-semibold mb-3 text-primary flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Interactive Demo:
              </h4>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                {demoComponent}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1 bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
              onClick={() => window.open(githubUrl, '_blank')}
            >
              <Github className="w-4 h-4 mr-2" />
              View Code
            </Button>
            <Button variant="secondary" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Live Demo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelCard;