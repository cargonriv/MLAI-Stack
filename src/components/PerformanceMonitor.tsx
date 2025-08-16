/**
 * Performance Monitor Component with Toggle Functionality
 * Provides real-time performance monitoring with collapsible interface
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor, type PerformanceMetrics } from '../utils/performanceMonitoring';
import { ChevronDown, ChevronUp, Activity, Zap, Clock, BarChart3 } from 'lucide-react';

interface PerformanceMonitorProps {
  defaultOpen?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  updateInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  defaultOpen = false,
  position = 'bottom-right',
  updateInterval = 2000
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [performanceScore, setPerformanceScore] = useState<{
    score: number;
    grade: 'good' | 'needs-improvement' | 'poor';
    details: Record<string, { value: number; status: string }>;
  }>({ score: 0, grade: 'good', details: {} });

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics();
      const currentScore = performanceMonitor.getPerformanceScore();
      setMetrics(currentMetrics);
      setPerformanceScore(currentScore);
    };

    // Initial update
    updateMetrics();

    // Set up interval for updates
    const interval = setInterval(updateMetrics, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'needs-improvement':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatValue = (key: string, value: number) => {
    if (key === 'cls') {
      return value.toFixed(3);
    }
    if (key.includes('Size')) {
      return `${Math.round(value / 1024)}KB`;
    }
    return `${Math.round(value)}ms`;
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 max-w-sm`}>
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
        {/* Header with toggle */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Performance Monitor</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(performanceScore.grade)}`} />
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Collapsible content */}
        {isOpen && (
          <div className="border-t border-border p-3 space-y-4">
            {/* Overall Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getGradeColor(performanceScore.grade)}`}>
                  {performanceScore.score}/100
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getGradeColor(performanceScore.grade)} bg-current/10`}>
                  {performanceScore.grade.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Core Web Vitals */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-foreground">Core Web Vitals</span>
              </div>
              <div className="space-y-2">
                {Object.entries(performanceScore.details).map(([key, detail]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(detail.status)}`} />
                      <span className="text-muted-foreground uppercase">{key}</span>
                    </div>
                    <span className="text-foreground font-mono">
                      {formatValue(key, detail.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Metrics */}
            {(metrics.fcp || metrics.ttfb || metrics.pageLoadTime) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">Other Metrics</span>
                </div>
                <div className="space-y-1">
                  {metrics.fcp && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">FCP</span>
                      <span className="text-foreground font-mono">{Math.round(metrics.fcp)}ms</span>
                    </div>
                  )}
                  {metrics.ttfb && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">TTFB</span>
                      <span className="text-foreground font-mono">{Math.round(metrics.ttfb)}ms</span>
                    </div>
                  )}
                  {metrics.pageLoadTime && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Page Load</span>
                      <span className="text-foreground font-mono">{Math.round(metrics.pageLoadTime)}ms</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bundle Sizes */}
            {(metrics.jsSize || metrics.cssSize || metrics.totalSize) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">Bundle Sizes</span>
                </div>
                <div className="space-y-1">
                  {metrics.jsSize && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">JavaScript</span>
                      <span className="text-foreground font-mono">{Math.round(metrics.jsSize / 1024)}KB</span>
                    </div>
                  )}
                  {metrics.cssSize && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">CSS</span>
                      <span className="text-foreground font-mono">{Math.round(metrics.cssSize / 1024)}KB</span>
                    </div>
                  )}
                  {metrics.totalSize && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-foreground font-mono">{Math.round(metrics.totalSize / 1024)}KB</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  console.log(performanceMonitor.generateReport());
                }}
                className="flex-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
              >
                Log Report
              </button>
              <button
                onClick={() => {
                  const currentMetrics = performanceMonitor.getMetrics();
                  const currentScore = performanceMonitor.getPerformanceScore();
                  setMetrics(currentMetrics);
                  setPerformanceScore(currentScore);
                }}
                className="flex-1 text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;