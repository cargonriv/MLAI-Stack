import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Star, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Target,
  BarChart3,
  Lightbulb,
  User,
  Film,
  Zap
} from 'lucide-react';

export interface SimilarUser {
  userId: string;
  similarity: number;
  commonRatings: number;
  averageRating: number;
  topGenres: string[];
}

export interface ItemFeature {
  name: string;
  value: number;
  importance: number;
  description: string;
}

export interface RecommendationExplanationData {
  movieId: number;
  movieTitle: string;
  predictedRating: number;
  confidence: number;
  algorithm: 'svd' | 'neural' | 'hybrid';
  
  // Collaborative Filtering Explanation
  similarUsers: SimilarUser[];
  userSimilarityScore: number;
  
  // Content-based Features
  itemFeatures: ItemFeature[];
  genreMatch: number;
  
  // Algorithm-specific data
  factorContributions?: { factor: number; contribution: number }[];
  neuralActivations?: { layer: string; activation: number }[];
  
  // Reasoning
  primaryReasons: string[];
  secondaryReasons: string[];
}

interface RecommendationExplanationProps {
  explanation: RecommendationExplanationData;
  userRatings: Array<{ movieId: number; title: string; rating: number; genres: string[] }>;
  className?: string;
}

const RecommendationExplanation: React.FC<RecommendationExplanationProps> = ({
  explanation,
  userRatings,
  className = ''
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'svd': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'neural': return <Target className="w-4 h-4 text-purple-500" />;
      case 'hybrid': return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return 'bg-green-500';
    if (similarity >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Why We Recommend "{explanation.movieTitle}"
          </div>
          <div className="flex items-center gap-2">
            {getAlgorithmIcon(explanation.algorithm)}
            <Badge variant="outline" className="text-xs">
              {explanation.algorithm.toUpperCase()}
            </Badge>
          </div>
        </CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-medium">{explanation.predictedRating.toFixed(1)}</span>
          </div>
          <div className={`flex items-center gap-1 ${getConfidenceColor(explanation.confidence)}`}>
            <Target className="w-4 h-4" />
            <span className="font-medium">{(explanation.confidence * 100).toFixed(0)}% confident</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overview Section */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('overview')}
            className="w-full justify-between p-0 h-auto font-medium text-left"
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Main Reasons
            </span>
            {expandedSection === 'overview' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {expandedSection === 'overview' && (
            <div className="mt-3 space-y-3">
              <div className="bg-primary/10 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Primary Reasons:</h4>
                <ul className="space-y-1">
                  {explanation.primaryReasons.map((reason, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              
              {explanation.secondaryReasons.length > 0 && (
                <div className="bg-secondary/30 rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">Additional Factors:</h4>
                  <ul className="space-y-1">
                    {explanation.secondaryReasons.map((reason, index) => (
                      <li key={index} className="text-sm flex items-start gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Similar Users Section */}
        {explanation.similarUsers.length > 0 && (
          <div>
            <Button
              variant="ghost"
              onClick={() => toggleSection('users')}
              className="w-full justify-between p-0 h-auto font-medium text-left"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Similar Users ({explanation.similarUsers.length})
              </span>
              {expandedSection === 'users' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {expandedSection === 'users' && (
              <div className="mt-3 space-y-3">
                <div className="text-sm text-muted-foreground mb-2">
                  Users with similar taste who also liked this movie:
                </div>
                
                {explanation.similarUsers.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-sm">User {user.userId}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.commonRatings} common movies
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {(user.similarity * 100).toFixed(0)}% similar
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Similarity:</span>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div 
                            className={`${getSimilarityColor(user.similarity)} h-1.5 rounded-full transition-all duration-300`}
                            style={{ width: `${user.similarity * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-mono">{user.similarity.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avg Rating: {user.averageRating.toFixed(1)}</span>
                      <span>Likes: {user.topGenres.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Item Features Section */}
        {explanation.itemFeatures.length > 0 && (
          <div>
            <Button
              variant="ghost"
              onClick={() => toggleSection('features')}
              className="w-full justify-between p-0 h-auto font-medium text-left"
            >
              <span className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                Movie Features
              </span>
              {expandedSection === 'features' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {expandedSection === 'features' && (
              <div className="mt-3 space-y-3">
                <div className="text-sm text-muted-foreground mb-2">
                  How this movie's characteristics match your preferences:
                </div>
                
                {explanation.itemFeatures.map((feature, index) => (
                  <div key={index} className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{feature.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{feature.value.toFixed(2)}</span>
                        <Badge 
                          variant={feature.importance > 0.7 ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {feature.importance > 0.7 ? 'High' : feature.importance > 0.4 ? 'Medium' : 'Low'} Impact
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.abs(feature.value) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
                
                {explanation.genreMatch > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-green-800 dark:text-green-200">
                        Genre Match
                      </span>
                      <span className="text-sm font-bold text-green-800 dark:text-green-200">
                        {(explanation.genreMatch * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      This movie's genres align well with your viewing history
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Technical Details Section */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('technical')}
            className="w-full justify-between p-0 h-auto font-medium text-left"
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Technical Details
            </span>
            {expandedSection === 'technical' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {expandedSection === 'technical' && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Algorithm</div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {getAlgorithmIcon(explanation.algorithm)}
                    {explanation.algorithm.toUpperCase()}
                  </div>
                </div>
                
                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">User Similarity</div>
                  <div className="font-medium text-sm">
                    {(explanation.userSimilarityScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* SVD Factor Contributions */}
              {explanation.factorContributions && explanation.factorContributions.length > 0 && (
                <div className="bg-secondary/30 rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">SVD Factor Contributions:</h4>
                  <div className="space-y-2">
                    {explanation.factorContributions.slice(0, 5).map((factor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs">Factor {factor.factor}</span>
                        <div className="flex items-center gap-2 flex-1 mx-2">
                          <div className="w-full bg-secondary rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full transition-all duration-300 ${
                                factor.contribution > 0 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.abs(factor.contribution) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-12 text-right">
                            {factor.contribution > 0 ? '+' : ''}{factor.contribution.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Neural Network Activations */}
              {explanation.neuralActivations && explanation.neuralActivations.length > 0 && (
                <div className="bg-secondary/30 rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">Neural Network Activations:</h4>
                  <div className="space-y-2">
                    {explanation.neuralActivations.map((activation, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs">{activation.layer}</span>
                        <div className="flex items-center gap-2 flex-1 mx-2">
                          <div className="w-full bg-secondary rounded-full h-1">
                            <div 
                              className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${activation.activation * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-12 text-right">
                            {activation.activation.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confidence Breakdown */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm text-blue-800 dark:text-blue-200">
              Confidence Breakdown
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700 dark:text-blue-300">Overall Confidence:</span>
              <span className="font-bold text-blue-800 dark:text-blue-200">
                {(explanation.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={explanation.confidence * 100} className="h-2" />
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Based on {explanation.similarUsers.length} similar users and {explanation.itemFeatures.length} movie features
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationExplanation;