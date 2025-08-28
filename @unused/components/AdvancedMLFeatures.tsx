/**
 * Advanced ML Features Integration Component
 * Demonstrates model quantization, batch processing, A/B testing, analytics, and offline caching
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Zap, 
  BarChart3, 
  Wifi, 
  WifiOff,
  Settings,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

import { modelQuantizer, QuantizationConfig } from '@/utils/modelQuantization';
import { BatchProcessor, BatchProcessorFactory } from '@/utils/batchProcessor';
import { abTestingFramework, ABTestConfig } from '@/utils/abTesting';
import { analytics, MLAnalytics } from '@/utils/analyticsIntegration';
import { serviceWorkerCache } from '@/utils/serviceWorkerCache';

interface AdvancedMLFeaturesProps {
  className?: string;
}

export const AdvancedMLFeatures: React.FC<AdvancedMLFeaturesProps> = ({ className }) => {
  const [quantizationStats, setQuantizationStats] = useState<any>(null);
  const [batchStats, setBatchStats] = useState<any>(null);
  const [abTestResults, setAbTestResults] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeFeatures, setActiveFeatures] = useState({
    quantization: false,
    batching: false,
    abTesting: false,
    analytics: true,
    caching: false
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateAllStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateAllStats = useCallback(async () => {
    // Update quantization stats
    if (activeFeatures.quantization) {
      setQuantizationStats(modelQuantizer.getMemoryStats());
    }

    // Update batch processing stats
    if (activeFeatures.batching) {
      const sentimentProcessor = BatchProcessorFactory.getProcessor('sentiment');
      if (sentimentProcessor) {
        setBatchStats({
          sentiment: sentimentProcessor.getMetrics(),
          queue: sentimentProcessor.getQueueStatus()
        });
      }
    }

    // Update A/B test results
    if (activeFeatures.abTesting) {
      const activeTests = abTestingFramework.getActiveTests();
      if (activeTests.length > 0) {
        const testResults = await Promise.all(
          activeTests.map(test => abTestingFramework.analyzeTest(test.testId))
        );
        setAbTestResults(testResults.filter(Boolean));
      }
    }

    // Update cache stats
    if (activeFeatures.caching) {
      setCacheStats(serviceWorkerCache.getCacheStats());
    }
  }, [activeFeatures]);

  const handleQuantizationDemo = async () => {
    try {
      setActiveFeatures(prev => ({ ...prev, quantization: true }));
      
      // Simulate model quantization
      const mockModel = { weights: new Map([['layer1', new Float32Array(1000)]]) };
      const config: QuantizationConfig = {
        precision: 'int8',
        enableDynamicQuantization: true,
        targetMemoryReduction: 75
      };

      await modelQuantizer.quantizeModel('demo-model', mockModel, config);
      
      // Track analytics
      MLAnalytics.trackComponentUsage('AdvancedMLFeatures', 'quantization_demo');
      
      updateAllStats();
    } catch (error) {
      console.error('Quantization demo failed:', error);
    }
  };

  const handleBatchProcessingDemo = async () => {
    try {
      setActiveFeatures(prev => ({ ...prev, batching: true }));
      
      // Create batch processor
      const processor = BatchProcessorFactory.createSentimentBatchProcessor(
        { analyze: async (text: string) => ({ sentiment: 'positive', confidence: 0.8 }) },
        { maxBatchSize: 5, maxWaitTime: 1000 }
      );

      // Submit multiple requests
      const requests = [
        'This is great!',
        'I love this feature',
        'Amazing work',
        'Fantastic implementation',
        'Really impressive'
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(text => processor.addRequest(text))
      );
      const processingTime = Date.now() - startTime;

      // Track analytics
      MLAnalytics.trackInference('batch-demo', processingTime, 0, requests.length);
      
      updateAllStats();
    } catch (error) {
      console.error('Batch processing demo failed:', error);
    }
  };

  const handleABTestDemo = async () => {
    try {
      setActiveFeatures(prev => ({ ...prev, abTesting: true }));
      
      // Create A/B test
      const testConfig: ABTestConfig = {
        testId: 'sentiment-model-comparison',
        name: 'Sentiment Model A/B Test',
        description: 'Compare BERT vs DistilBERT performance',
        variants: [
          {
            id: 'control-bert',
            name: 'BERT Base',
            description: 'Full BERT model',
            modelConfig: { model: 'bert-base' },
            isControl: true
          },
          {
            id: 'variant-distilbert',
            name: 'DistilBERT',
            description: 'Lightweight DistilBERT',
            modelConfig: { model: 'distilbert' },
            isControl: false
          }
        ],
        trafficSplit: [50, 50],
        startDate: new Date(),
        targetMetrics: ['accuracy', 'latency'],
        minimumSampleSize: 100,
        confidenceLevel: 0.95
      };

      abTestingFramework.createTest(testConfig);

      // Simulate some test results
      for (let i = 0; i < 20; i++) {
        const userId = `user_${i}`;
        const variant = abTestingFramework.getVariantForUser(testConfig.testId, userId);
        
        if (variant) {
          abTestingFramework.recordResult(testConfig.testId, userId, {
            accuracy: 0.85 + Math.random() * 0.1,
            latency: 100 + Math.random() * 50
          });
        }
      }

      // Track analytics
      analytics.trackABTest({
        testId: testConfig.testId,
        variantId: 'demo',
        conversionEvent: 'test_created'
      });

      updateAllStats();
    } catch (error) {
      console.error('A/B test demo failed:', error);
    }
  };

  const handleCachingDemo = async () => {
    try {
      setActiveFeatures(prev => ({ ...prev, caching: true }));
      
      // Simulate model caching
      const mockModelData = new ArrayBuffer(1024 * 1024); // 1MB mock model
      await serviceWorkerCache.cacheModel('demo-sentiment-model', mockModelData, '1.0.0', 'high');
      
      // Test retrieval
      const cachedModel = await serviceWorkerCache.getCachedModel('demo-sentiment-model');
      
      // Track analytics
      MLAnalytics.trackComponentUsage('AdvancedMLFeatures', 'caching_demo', mockModelData.byteLength);
      
      updateAllStats();
    } catch (error) {
      console.error('Caching demo failed:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced ML Features</h2>
          <p className="text-muted-foreground">
            Production-ready optimizations and monitoring capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="text-green-600">
              <Wifi className="w-3 h-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="quantization" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quantization">Quantization</TabsTrigger>
          <TabsTrigger value="batching">Batch Processing</TabsTrigger>
          <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="caching">Offline Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="quantization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Model Quantization
              </CardTitle>
              <CardDescription>
                Reduce model memory usage through precision optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleQuantizationDemo} disabled={activeFeatures.quantization}>
                {activeFeatures.quantization ? 'Quantization Active' : 'Start Quantization Demo'}
              </Button>
              
              {quantizationStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Memory Savings</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatBytes(quantizationStats.totalSavings)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Models Quantized</div>
                    <div className="text-2xl font-bold">
                      {quantizationStats.modelsCount}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Batch Processing
              </CardTitle>
              <CardDescription>
                Optimize inference throughput with intelligent batching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleBatchProcessingDemo} disabled={activeFeatures.batching}>
                {activeFeatures.batching ? 'Batch Processing Active' : 'Start Batch Demo'}
              </Button>
              
              {batchStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Throughput</div>
                      <div className="text-lg font-bold">
                        {batchStats.sentiment.throughput.toFixed(1)} req/s
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Avg Batch Size</div>
                      <div className="text-lg font-bold">
                        {batchStats.sentiment.averageBatchSize.toFixed(1)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Queue Length</div>
                      <div className="text-lg font-bold">
                        {batchStats.queue.queueLength}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Error Rate</div>
                    <Progress value={batchStats.sentiment.errorRate * 100} className="w-full" />
                    <div className="text-xs text-muted-foreground">
                      {(batchStats.sentiment.errorRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abtesting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                A/B Testing
              </CardTitle>
              <CardDescription>
                Compare model variants and measure performance impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleABTestDemo} disabled={activeFeatures.abTesting}>
                {activeFeatures.abTesting ? 'A/B Test Running' : 'Start A/B Test Demo'}
              </Button>
              
              {abTestResults && abTestResults.length > 0 && (
                <div className="space-y-4">
                  {abTestResults.map((test: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{test.testId}</h4>
                        <Badge variant={test.statisticalSignificance ? 'default' : 'secondary'}>
                          {test.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Samples:</span>
                          <span className="ml-2 font-medium">{test.totalSamples}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="ml-2 font-medium">{(test.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      {test.winner && (
                        <Alert className="mt-2">
                          <TrendingUp className="h-4 w-4" />
                          <AlertDescription>
                            Winner: {test.winner}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Integration
              </CardTitle>
              <CardDescription>
                Track model performance and user interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Session ID</div>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    {analytics.getAnalyticsSummary().sessionId}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Events Tracked</div>
                  <div className="text-2xl font-bold">
                    {analytics.getAnalyticsSummary().eventsTracked}
                  </div>
                </div>
              </div>
              
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  Analytics are actively tracking model performance and user interactions.
                  All data is processed locally for privacy.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Offline Model Cache
              </CardTitle>
              <CardDescription>
                Enable offline model availability with intelligent caching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCachingDemo} disabled={activeFeatures.caching}>
                {activeFeatures.caching ? 'Caching Active' : 'Start Caching Demo'}
              </Button>
              
              {cacheStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Cache Size</div>
                      <div className="text-lg font-bold">
                        {formatBytes(cacheStats.totalSize)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Models Cached</div>
                      <div className="text-lg font-bold">
                        {cacheStats.modelCount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Cache Utilization</div>
                    <Progress value={cacheStats.utilizationPercentage} className="w-full" />
                    <div className="text-xs text-muted-foreground">
                      {cacheStats.utilizationPercentage.toFixed(1)}% of available space
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hit Rate:</span>
                      <span className="ml-2 font-medium">{cacheStats.hitRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Compression Savings:</span>
                      <span className="ml-2 font-medium">{formatBytes(cacheStats.compressionSavings)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};