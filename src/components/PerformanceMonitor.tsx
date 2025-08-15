import { useEffect, useState } from 'react';
import { usePerformanceMonitor, getMemoryUsage, FrameRateMonitor } from '@/utils/performance';

interface PerformanceMonitorProps {
  enabled?: boolean;
  showInProduction?: boolean;
}

export const PerformanceMonitor = ({ 
  enabled = process.env.NODE_ENV === 'development',
  showInProduction = false 
}: PerformanceMonitorProps) => {
  const { getMetricsSummary } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState<Record<string, { latest: number; rating: string; count: number }>>({});
  const [memory, setMemory] = useState<{ used: number; total: number; limit: number } | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [frameMonitor] = useState(() => new FrameRateMonitor());

  useEffect(() => {
    if (!enabled && !showInProduction) return;

    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      setMetrics(getMetricsSummary());
      setMemory(getMemoryUsage());
      setFps(frameMonitor.getAverageFPS());
    }, 2000);

    // Start frame monitoring
    frameMonitor.start();

    return () => {
      clearInterval(interval);
      frameMonitor.stop();
    };
  }, [enabled, showInProduction, getMetricsSummary, frameMonitor]);

  if (!enabled && !showInProduction) return null;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-400';
      case 'needs-improvement': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 backdrop-blur-sm text-white p-3 rounded-lg text-xs font-mono max-w-xs">
      <div className="mb-2 font-semibold text-cyan-400">Performance Monitor</div>
      
      {/* Core Web Vitals */}
      <div className="space-y-1 mb-3">
        <div className="text-gray-300 font-medium">Core Web Vitals</div>
        {Object.entries(metrics).map(([name, data]) => (
          <div key={name} className="flex justify-between">
            <span>{name}:</span>
            <span className={getRatingColor(data.rating)}>
              {data.latest?.toFixed(0)}ms ({data.rating})
            </span>
          </div>
        ))}
      </div>

      {/* Memory Usage */}
      {memory && (
        <div className="space-y-1 mb-3">
          <div className="text-gray-300 font-medium">Memory</div>
          <div className="flex justify-between">
            <span>Used:</span>
            <span className="text-blue-400">{memory.used}MB</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="text-blue-400">{memory.total}MB</span>
          </div>
          <div className="flex justify-between">
            <span>Usage:</span>
            <span className={memory.used / memory.total > 0.8 ? 'text-red-400' : 'text-green-400'}>
              {((memory.used / memory.total) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Frame Rate */}
      <div className="space-y-1">
        <div className="text-gray-300 font-medium">Performance</div>
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
            {fps}
          </span>
        </div>
      </div>
    </div>
  );
};