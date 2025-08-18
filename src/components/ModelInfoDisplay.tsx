import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Clock, 
  BarChart3, 
  Zap, 
  Brain, 
  Database,
  Target,
  TrendingUp,
  Info,
  Activity,
  HardDrive,
  Wifi
} from 'lucide-react';

export interface ModelMetrics {
  modelSize: number; // in bytes
  loadTime: number; // in milliseconds
  inferenceTime: number; // in milliseconds
  accuracy?: number; // percentage
  memoryUsage: number; // in bytes
  throughput?: number; // items per second
}

export interface ModelInfo {
  name: string;
  architecture: string;
  version?: string;
  description: string;
  parameters?: number;
  quantized?: boolean;
  device: 'cpu' | 'gpu' | 'wasm';
  metrics: ModelMetrics;
  capabilities: string[];
  limitations: string[];
}

interface ModelInfoDisplayProps {
  modelInfo: ModelInfo;
  isExpanded?: boolean;
  onToggle?: () => void;
  showComparison?: boolean;
  comparisonData?: ModelInfo[];
}

const ModelInfoDisplay: React.FC<ModelInfoDisplayProps> = ({
  modelInfo,
  isExpanded = false,
  onToggle,
  showComparison = false,
  comparisonData = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'comparison'>('overview');

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

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'gpu': return <Zap className="w-4 h-4 text-green-500" />;
      case 'wasm': return <Cpu className="w-4 h-4 text-blue-500" />;
      default: return <Cpu className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return 'text-green-600 dark:text-green-400';
    if (value <= thresholds.fair) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {modelInfo.name}
            {modelInfo.quantized && (
              <Badge variant="secondary" className="text-xs">
                Quantized
              </Badge>
            )}
          </CardTitle>
          {onToggle && (
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {getDeviceIcon(modelInfo.device)}
            <span className="capitalize">{modelInfo.device}</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            <span>{modelInfo.architecture}</span>
          </div>
          {modelInfo.parameters && (
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>{formatNumber(modelInfo.parameters)} params</span>
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'metrics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Performance
            </button>
            {showComparison && comparisonData.length > 0 && (
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comparison'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Comparison
              </button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{modelInfo.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Capabilities
                  </h4>
                  <ul className="space-y-1">
                    {modelInfo.capabilities.map((capability, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Limitations
                  </h4>
                  <ul className="space-y-1">
                    {modelInfo.limitations.map((limitation, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Model Size</span>
                  </div>
                  <div className="text-lg font-bold">{formatBytes(modelInfo.metrics.modelSize)}</div>
                </div>

                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Load Time</span>
                  </div>
                  <div className={`text-lg font-bold ${getPerformanceColor(
                    modelInfo.metrics.loadTime, 
                    { good: 2000, fair: 5000 }
                  )}`}>
                    {formatTime(modelInfo.metrics.loadTime)}
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Inference</span>
                  </div>
                  <div className={`text-lg font-bold ${getPerformanceColor(
                    modelInfo.metrics.inferenceTime, 
                    { good: 100, fair: 500 }
                  )}`}>
                    {formatTime(modelInfo.metrics.inferenceTime)}
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                  <div className="text-lg font-bold">{formatBytes(modelInfo.metrics.memoryUsage)}</div>
                </div>
              </div>

              {modelInfo.metrics.accuracy && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Accuracy</span>
                    <span className="text-sm font-bold">{modelInfo.metrics.accuracy.toFixed(1)}%</span>
                  </div>
                  <Progress value={modelInfo.metrics.accuracy} className="h-2" />
                </div>
              )}

              {modelInfo.metrics.throughput && (
                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Throughput</span>
                  </div>
                  <div className="text-lg font-bold">
                    {modelInfo.metrics.throughput.toFixed(1)} items/sec
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && showComparison && comparisonData.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2">Model</th>
                      <th className="text-right py-2">Size</th>
                      <th className="text-right py-2">Load Time</th>
                      <th className="text-right py-2">Inference</th>
                      <th className="text-right py-2">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border bg-primary/10">
                      <td className="py-2 font-medium">{modelInfo.name} (Current)</td>
                      <td className="text-right py-2">{formatBytes(modelInfo.metrics.modelSize)}</td>
                      <td className="text-right py-2">{formatTime(modelInfo.metrics.loadTime)}</td>
                      <td className="text-right py-2">{formatTime(modelInfo.metrics.inferenceTime)}</td>
                      <td className="text-right py-2">
                        {modelInfo.metrics.accuracy ? `${modelInfo.metrics.accuracy.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                    {comparisonData.map((model, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-2">{model.name}</td>
                        <td className="text-right py-2">{formatBytes(model.metrics.modelSize)}</td>
                        <td className="text-right py-2">{formatTime(model.metrics.loadTime)}</td>
                        <td className="text-right py-2">{formatTime(model.metrics.inferenceTime)}</td>
                        <td className="text-right py-2">
                          {model.metrics.accuracy ? `${model.metrics.accuracy.toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ModelInfoDisplay;