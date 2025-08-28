import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Clock, 
  Zap, 
  Target, 
  TrendingUp, 
  HardDrive,
  Activity,
  Cpu,
  Trophy,
  AlertTriangle
} from 'lucide-react';

export interface AlgorithmMetrics {
  name: string;
  displayName: string;
  type: 'sentiment' | 'recommendation' | 'classification';
  metrics: {
    accuracy?: number; // percentage
    precision?: number; // percentage
    recall?: number; // percentage
    f1Score?: number; // percentage
    loadTime: number; // milliseconds
    inferenceTime: number; // milliseconds
    modelSize: number; // bytes
    memoryUsage: number; // bytes
    throughput?: number; // items per second
    rmse?: number; // for recommendation systems
    mae?: number; // mean absolute error
  };
  pros: string[];
  cons: string[];
  bestFor: string[];
}

interface PerformanceComparisonProps {
  algorithms: AlgorithmMetrics[];
  currentAlgorithm?: string;
  onAlgorithmSelect?: (algorithm: string) => void;
  className?: string;
}

const PerformanceComparison: React.FC<PerformanceComparisonProps> = ({
  algorithms,
  currentAlgorithm,
  onAlgorithmSelect,
  className = ''
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'detailed'>('chart');

  // Calculate normalized scores for comparison
  const normalizedData = useMemo(() => {
    if (algorithms.length === 0) return [];

    const metrics = ['accuracy', 'loadTime', 'inferenceTime', 'modelSize', 'memoryUsage'];
    const normalized = algorithms.map(algo => {
      const scores: Record<string, number> = {};
      
      metrics.forEach(metric => {
        const values = algorithms.map(a => {
          if (metric === 'accuracy') return a.metrics.accuracy || 0;
          if (metric === 'loadTime') return a.metrics.loadTime;
          if (metric === 'inferenceTime') return a.metrics.inferenceTime;
          if (metric === 'modelSize') return a.metrics.modelSize;
          if (metric === 'memoryUsage') return a.metrics.memoryUsage;
          return 0;
        });

        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min;

        let value = 0;
        if (metric === 'accuracy') {
          value = algo.metrics.accuracy || 0;
        } else if (metric === 'loadTime') {
          value = algo.metrics.loadTime;
        } else if (metric === 'inferenceTime') {
          value = algo.metrics.inferenceTime;
        } else if (metric === 'modelSize') {
          value = algo.metrics.modelSize;
        } else if (metric === 'memoryUsage') {
          value = algo.metrics.memoryUsage;
        }

        // For accuracy, higher is better. For others, lower is better.
        if (metric === 'accuracy') {
          scores[metric] = range > 0 ? ((value - min) / range) * 100 : 50;
        } else {
          scores[metric] = range > 0 ? ((max - value) / range) * 100 : 50;
        }
      });

      // Calculate overall score
      scores.overall = (scores.accuracy + scores.loadTime + scores.inferenceTime + 
                       (100 - scores.modelSize) + (100 - scores.memoryUsage)) / 5;

      return {
        ...algo,
        normalizedScores: scores
      };
    });

    return normalized;
  }, [algorithms]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'accuracy': return <Target className="w-4 h-4" />;
      case 'loadTime': return <Clock className="w-4 h-4" />;
      case 'inferenceTime': return <Zap className="w-4 h-4" />;
      case 'modelSize': return <HardDrive className="w-4 h-4" />;
      case 'memoryUsage': return <Activity className="w-4 h-4" />;
      case 'overall': return <Trophy className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBestAlgorithm = (metric: string) => {
    if (normalizedData.length === 0) return null;
    return normalizedData.reduce((best, current) => 
      (current.normalizedScores[metric] || 0) > (best.normalizedScores[metric] || 0) ? current : best
    );
  };

  if (algorithms.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No algorithms available for comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Algorithm Performance Comparison
        </CardTitle>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Score</SelectItem>
              <SelectItem value="accuracy">Accuracy</SelectItem>
              <SelectItem value="loadTime">Load Time</SelectItem>
              <SelectItem value="inferenceTime">Inference Speed</SelectItem>
              <SelectItem value="modelSize">Model Size</SelectItem>
              <SelectItem value="memoryUsage">Memory Usage</SelectItem>
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={(value: 'chart' | 'table' | 'detailed') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chart">Chart View</SelectItem>
              <SelectItem value="table">Table View</SelectItem>
              <SelectItem value="detailed">Detailed View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chart View */}
        {viewMode === 'chart' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {getMetricIcon(selectedMetric)}
              <span className="font-medium">
                {selectedMetric === 'overall' ? 'Overall Performance Score' : 
                 selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              </span>
              {getBestAlgorithm(selectedMetric) && (
                <Badge variant="outline" className="text-xs">
                  Best: {getBestAlgorithm(selectedMetric)?.displayName}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {normalizedData.map((algo, index) => {
                const score = algo.normalizedScores[selectedMetric] || 0;
                const isCurrent = currentAlgorithm === algo.name;
                const isBest = getBestAlgorithm(selectedMetric)?.name === algo.name;

                return (
                  <div
                    key={algo.name}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      isCurrent 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-secondary/30 hover:bg-secondary/50'
                    } ${onAlgorithmSelect ? 'cursor-pointer' : ''}`}
                    onClick={() => onAlgorithmSelect?.(algo.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{algo.displayName}</span>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                        {isBest && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Best
                          </Badge>
                        )}
                      </div>
                      <span className={`font-bold ${getScoreColor(score)}`}>
                        {score.toFixed(0)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={`${getBarColor(score)} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Algorithm</th>
                  <th className="text-right py-2">Accuracy</th>
                  <th className="text-right py-2">Load Time</th>
                  <th className="text-right py-2">Inference</th>
                  <th className="text-right py-2">Size</th>
                  <th className="text-right py-2">Memory</th>
                  <th className="text-right py-2">Overall</th>
                </tr>
              </thead>
              <tbody>
                {normalizedData.map((algo, index) => {
                  const isCurrent = currentAlgorithm === algo.name;
                  return (
                    <tr 
                      key={algo.name} 
                      className={`border-b border-border ${
                        isCurrent ? 'bg-primary/10' : 'hover:bg-secondary/30'
                      } ${onAlgorithmSelect ? 'cursor-pointer' : ''}`}
                      onClick={() => onAlgorithmSelect?.(algo.name)}
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {algo.displayName}
                          {isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                        </div>
                      </td>
                      <td className="text-right py-2">
                        {algo.metrics.accuracy ? `${algo.metrics.accuracy.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="text-right py-2">{formatTime(algo.metrics.loadTime)}</td>
                      <td className="text-right py-2">{formatTime(algo.metrics.inferenceTime)}</td>
                      <td className="text-right py-2">{formatBytes(algo.metrics.modelSize)}</td>
                      <td className="text-right py-2">{formatBytes(algo.metrics.memoryUsage)}</td>
                      <td className={`text-right py-2 font-bold ${getScoreColor(algo.normalizedScores.overall)}`}>
                        {algo.normalizedScores.overall.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed View */}
        {viewMode === 'detailed' && (
          <div className="space-y-4">
            {algorithms.map((algo, index) => {
              const isCurrent = currentAlgorithm === algo.name;
              const normalizedAlgo = normalizedData.find(n => n.name === algo.name);
              
              return (
                <Card 
                  key={algo.name}
                  className={`${isCurrent ? 'border-primary bg-primary/5' : ''} ${
                    onAlgorithmSelect ? 'cursor-pointer hover:shadow-md' : ''
                  }`}
                  onClick={() => onAlgorithmSelect?.(algo.name)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {algo.displayName}
                        {isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                      </div>
                      {normalizedAlgo && (
                        <div className={`text-lg font-bold ${getScoreColor(normalizedAlgo.normalizedScores.overall)}`}>
                          {normalizedAlgo.normalizedScores.overall.toFixed(0)}
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {algo.metrics.accuracy && (
                        <div className="bg-secondary/30 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Target className="w-3 h-3" />
                            <span className="text-xs font-medium">Accuracy</span>
                          </div>
                          <div className="font-bold">{algo.metrics.accuracy.toFixed(1)}%</div>
                        </div>
                      )}
                      
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-medium">Load Time</span>
                        </div>
                        <div className="font-bold">{formatTime(algo.metrics.loadTime)}</div>
                      </div>
                      
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="w-3 h-3" />
                          <span className="text-xs font-medium">Inference</span>
                        </div>
                        <div className="font-bold">{formatTime(algo.metrics.inferenceTime)}</div>
                      </div>
                      
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <HardDrive className="w-3 h-3" />
                          <span className="text-xs font-medium">Size</span>
                        </div>
                        <div className="font-bold">{formatBytes(algo.metrics.modelSize)}</div>
                      </div>
                      
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Activity className="w-3 h-3" />
                          <span className="text-xs font-medium">Memory</span>
                        </div>
                        <div className="font-bold">{formatBytes(algo.metrics.memoryUsage)}</div>
                      </div>
                      
                      {algo.metrics.throughput && (
                        <div className="bg-secondary/30 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs font-medium">Throughput</span>
                          </div>
                          <div className="font-bold">{algo.metrics.throughput.toFixed(1)}/s</div>
                        </div>
                      )}
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-green-600 dark:text-green-400">
                          Advantages:
                        </h4>
                        <ul className="space-y-1">
                          {algo.pros.map((pro, i) => (
                            <li key={i} className="text-xs flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-red-600 dark:text-red-400">
                          Limitations:
                        </h4>
                        <ul className="space-y-1">
                          {algo.cons.map((con, i) => (
                            <li key={i} className="text-xs flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Best For */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-200">
                        Best suited for:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {algo.bestFor.map((use, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-sm">Performance Summary</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Fastest Loading:</span>
              <div className="font-medium">
                {getBestAlgorithm('loadTime')?.displayName || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Fastest Inference:</span>
              <div className="font-medium">
                {getBestAlgorithm('inferenceTime')?.displayName || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Most Accurate:</span>
              <div className="font-medium">
                {getBestAlgorithm('accuracy')?.displayName || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceComparison;