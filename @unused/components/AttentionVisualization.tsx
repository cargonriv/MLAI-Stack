import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Layers, Zap, Info } from 'lucide-react';

export interface AttentionData {
  tokens: string[];
  attentionWeights: number[][][]; // [layer][head][token_i][token_j]
  layerNames?: string[];
  headNames?: string[];
}

interface AttentionVisualizationProps {
  attentionData: AttentionData;
  selectedText: string;
  className?: string;
}

const AttentionVisualization: React.FC<AttentionVisualizationProps> = ({
  attentionData,
  selectedText,
  className = ''
}) => {
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [showAllHeads, setShowAllHeads] = useState(false);
  const [intensityThreshold, setIntensityThreshold] = useState(0.1);

  const { tokens, attentionWeights, layerNames, headNames } = attentionData;

  // Calculate attention statistics
  const attentionStats = useMemo(() => {
    if (!attentionWeights || attentionWeights.length === 0) return null;

    const currentLayerWeights = attentionWeights[selectedLayer];
    if (!currentLayerWeights || currentLayerWeights.length === 0) return null;

    const currentHeadWeights = currentLayerWeights[selectedHead];
    if (!currentHeadWeights) return null;

    // Calculate max attention for each token
    const maxAttentions = currentHeadWeights.map(tokenAttentions => 
      Math.max(...tokenAttentions)
    );

    // Calculate average attention
    const avgAttention = currentHeadWeights.reduce((sum, tokenAttentions) => 
      sum + tokenAttentions.reduce((tokenSum, weight) => tokenSum + weight, 0), 0
    ) / (currentHeadWeights.length * currentHeadWeights[0].length);

    return {
      maxAttentions,
      avgAttention,
      totalTokens: tokens.length
    };
  }, [attentionWeights, selectedLayer, selectedHead, tokens.length]);

  // Get attention color based on weight
  const getAttentionColor = (weight: number, isSelected: boolean = false): string => {
    if (weight < intensityThreshold) return 'rgba(156, 163, 175, 0.1)'; // gray-400 with low opacity
    
    const intensity = Math.min(weight, 1.0);
    const baseColor = isSelected ? '59, 130, 246' : '34, 197, 94'; // blue-500 or green-500
    return `rgba(${baseColor}, ${intensity * 0.8 + 0.2})`;
  };

  // Get text color for readability
  const getTextColor = (weight: number): string => {
    return weight > 0.5 ? 'text-white' : 'text-gray-900 dark:text-gray-100';
  };

  // Handle token click
  const handleTokenClick = (tokenIndex: number) => {
    setSelectedToken(selectedToken === tokenIndex ? null : tokenIndex);
  };

  // Get attention weights for visualization
  const getVisualizationWeights = () => {
    if (!attentionWeights || !attentionWeights[selectedLayer] || !attentionWeights[selectedLayer][selectedHead]) {
      return [];
    }

    if (selectedToken !== null) {
      return attentionWeights[selectedLayer][selectedHead][selectedToken] || [];
    }

    // Show average attention across all tokens
    const headWeights = attentionWeights[selectedLayer][selectedHead];
    return headWeights.map((_, tokenIndex) => {
      const avgWeight = headWeights.reduce((sum, tokenAttentions) => 
        sum + tokenAttentions[tokenIndex], 0
      ) / headWeights.length;
      return avgWeight;
    });
  };

  const visualizationWeights = getVisualizationWeights();

  if (!attentionData || !tokens || tokens.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Eye className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No attention data available for visualization
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="w-5 h-5" />
          BERT Attention Visualization
        </CardTitle>
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {attentionWeights.length} Layers
          </Badge>
          <Badge variant="outline" className="text-xs">
            {attentionWeights[0]?.length || 0} Heads
          </Badge>
          <Badge variant="outline" className="text-xs">
            {tokens.length} Tokens
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Layer:</label>
            <Select 
              value={selectedLayer.toString()} 
              onValueChange={(value) => setSelectedLayer(parseInt(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {attentionWeights.map((_, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {layerNames?.[index] || `L${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Head:</label>
            <Select 
              value={selectedHead.toString()} 
              onValueChange={(value) => setSelectedHead(parseInt(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(attentionWeights[selectedLayer] || []).map((_, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {headNames?.[index] || `H${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Threshold:</label>
            <Select 
              value={intensityThreshold.toString()} 
              onValueChange={(value) => setIntensityThreshold(parseFloat(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.0">0.0</SelectItem>
                <SelectItem value="0.1">0.1</SelectItem>
                <SelectItem value="0.2">0.2</SelectItem>
                <SelectItem value="0.3">0.3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllHeads(!showAllHeads)}
            className="flex items-center gap-2"
          >
            {showAllHeads ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAllHeads ? 'Single Head' : 'All Heads'}
          </Button>
        </div>

        {/* Attention Statistics */}
        {attentionStats && (
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">Attention Statistics</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Avg Attention:</span>
                <div className="font-mono">{attentionStats.avgAttention.toFixed(3)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Max Token Attention:</span>
                <div className="font-mono">
                  {Math.max(...attentionStats.maxAttentions).toFixed(3)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Selected Token:</span>
                <div className="font-mono">
                  {selectedToken !== null ? tokens[selectedToken] : 'None'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Visualization */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">
              {selectedToken !== null 
                ? `Attention from "${tokens[selectedToken]}"` 
                : 'Average Attention Weights'
              }
            </h4>
            {selectedToken !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedToken(null)}
                className="text-xs"
              >
                Clear Selection
              </Button>
            )}
          </div>

          <div className="bg-secondary/20 rounded-lg p-4 border border-border/50">
            <div className="flex flex-wrap gap-1 leading-relaxed">
              {tokens.map((token, index) => {
                const weight = visualizationWeights[index] || 0;
                const isSelected = selectedToken === index;
                const backgroundColor = getAttentionColor(weight, isSelected);
                const textColor = getTextColor(weight);

                return (
                  <span
                    key={index}
                    onClick={() => handleTokenClick(index)}
                    className={`
                      px-2 py-1 rounded cursor-pointer transition-all duration-200 text-sm
                      hover:scale-105 hover:shadow-sm border border-transparent
                      ${textColor}
                      ${isSelected ? 'border-primary ring-2 ring-primary/20' : ''}
                    `}
                    style={{ backgroundColor }}
                    title={`Token: ${token}, Weight: ${weight.toFixed(3)}`}
                  >
                    {token}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getAttentionColor(0.1) }} />
              <span>Low Attention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getAttentionColor(0.5) }} />
              <span>Medium Attention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getAttentionColor(1.0) }} />
              <span>High Attention</span>
            </div>
          </div>
          <div className="text-xs">
            Click tokens to see their attention patterns
          </div>
        </div>

        {/* Multi-head visualization */}
        {showAllHeads && attentionWeights[selectedLayer] && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              All Attention Heads (Layer {selectedLayer + 1})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {attentionWeights[selectedLayer].map((headWeights, headIndex) => {
                const avgHeadAttention = headWeights.reduce((sum, tokenAttentions) => 
                  sum + tokenAttentions.reduce((tokenSum, weight) => tokenSum + weight, 0), 0
                ) / (headWeights.length * headWeights[0].length);

                return (
                  <div
                    key={headIndex}
                    onClick={() => setSelectedHead(headIndex)}
                    className={`
                      p-2 rounded-lg border cursor-pointer transition-all duration-200
                      ${selectedHead === headIndex 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-secondary/30 hover:bg-secondary/50'
                      }
                    `}
                  >
                    <div className="text-xs font-medium mb-1">
                      Head {headIndex + 1}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {avgHeadAttention.toFixed(3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How to interpret attention:</p>
              <ul className="space-y-1 text-xs">
                <li>• Darker colors indicate stronger attention weights</li>
                <li>• Click on tokens to see what they attend to</li>
                <li>• Different layers and heads capture different linguistic patterns</li>
                <li>• Early layers often focus on syntax, later layers on semantics</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttentionVisualization;