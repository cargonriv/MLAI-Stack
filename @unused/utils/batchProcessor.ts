/**
 * Batch Processing Utilities
 * Handles batching of multiple inference requests for improved performance
 */

export interface BatchRequest<T = any> {
  id: string;
  input: T;
  timestamp: number;
  priority?: 'high' | 'normal' | 'low';
  callback?: (result: any, error?: Error) => void;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  enablePrioritization: boolean;
  adaptiveBatching: boolean;
}

export interface BatchResult<T = any> {
  id: string;
  result?: T;
  error?: Error;
  processingTime: number;
}

export interface BatchMetrics {
  totalRequests: number;
  batchesProcessed: number;
  averageBatchSize: number;
  averageProcessingTime: number;
  throughput: number; // requests per second
  errorRate: number;
}

export class BatchProcessor<TInput = any, TOutput = any> {
  private pendingRequests: Map<string, BatchRequest<TInput>> = new Map();
  private processingQueue: BatchRequest<TInput>[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private metrics: BatchMetrics = {
    totalRequests: 0,
    batchesProcessed: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0,
    throughput: 0,
    errorRate: 0
  };
  private processingTimes: number[] = [];
  private errorCount = 0;

  constructor(
    private config: BatchConfig,
    private processor: (inputs: TInput[]) => Promise<TOutput[]>
  ) {}

  /**
   * Add a request to the batch processing queue
   */
  async addRequest(
    input: TInput,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest<TInput> = {
        id: this.generateRequestId(),
        input,
        timestamp: Date.now(),
        priority,
        callback: (result, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      };

      this.pendingRequests.set(request.id, request);
      this.processingQueue.push(request);
      this.metrics.totalRequests++;

      // Sort by priority if enabled
      if (this.config.enablePrioritization) {
        this.sortByPriority();
      }

      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.startBatchTimer();
      }

      // Process immediately if batch is full or high priority
      if (
        this.processingQueue.length >= this.config.maxBatchSize ||
        (priority === 'high' && this.processingQueue.length > 0)
      ) {
        this.processBatch();
      }
    });
  }

  /**
   * Process the current batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Extract batch to process
    const batchSize = Math.min(this.config.maxBatchSize, this.processingQueue.length);
    const batch = this.processingQueue.splice(0, batchSize);
    const startTime = performance.now();

    try {
      // Extract inputs for processing
      const inputs = batch.map(req => req.input);
      
      // Process the batch
      const results = await this.processor(inputs);
      const processingTime = performance.now() - startTime;

      // Update metrics
      this.updateMetrics(batch.length, processingTime, false);

      // Resolve individual requests
      batch.forEach((request, index) => {
        const result = results[index];
        this.pendingRequests.delete(request.id);
        
        if (request.callback) {
          request.callback(result);
        }
      });

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateMetrics(batch.length, processingTime, true);

      // Reject all requests in the batch
      batch.forEach(request => {
        this.pendingRequests.delete(request.id);
        
        if (request.callback) {
          request.callback(null, error as Error);
        }
      });
    }

    // Continue processing if there are more requests
    if (this.processingQueue.length > 0) {
      this.startBatchTimer();
    }
  }

  /**
   * Start the batch processing timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) return;

    const waitTime = this.config.adaptiveBatching 
      ? this.calculateAdaptiveWaitTime()
      : this.config.maxWaitTime;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, waitTime);
  }

  /**
   * Calculate adaptive wait time based on current load
   */
  private calculateAdaptiveWaitTime(): number {
    const queueLength = this.processingQueue.length;
    const baseWaitTime = this.config.maxWaitTime;
    
    // Reduce wait time as queue grows
    const adaptiveFactor = Math.max(0.1, 1 - (queueLength / this.config.maxBatchSize));
    return Math.round(baseWaitTime * adaptiveFactor);
  }

  /**
   * Sort processing queue by priority
   */
  private sortByPriority(): void {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    
    this.processingQueue.sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'normal'];
      const bPriority = priorityOrder[b.priority || 'normal'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Same priority, sort by timestamp (FIFO)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Update processing metrics
   */
  private updateMetrics(batchSize: number, processingTime: number, hasError: boolean): void {
    this.metrics.batchesProcessed++;
    this.processingTimes.push(processingTime);
    
    if (hasError) {
      this.errorCount++;
    }

    // Calculate running averages
    this.metrics.averageBatchSize = 
      (this.metrics.averageBatchSize * (this.metrics.batchesProcessed - 1) + batchSize) / 
      this.metrics.batchesProcessed;

    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;

    // Calculate throughput (requests per second)
    const totalTime = this.processingTimes.reduce((sum, time) => sum + time, 0) / 1000;
    this.metrics.throughput = totalTime > 0 ? this.metrics.totalRequests / totalTime : 0;

    // Calculate error rate
    this.metrics.errorRate = this.errorCount / this.metrics.totalRequests;

    // Keep only recent processing times for rolling average
    if (this.processingTimes.length > 100) {
      this.processingTimes = this.processingTimes.slice(-50);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current processing metrics
   */
  getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    pendingRequests: number;
    queueLength: number;
    isProcessing: boolean;
    oldestRequestAge: number;
  } {
    const oldestRequest = this.processingQueue[0];
    const oldestRequestAge = oldestRequest 
      ? Date.now() - oldestRequest.timestamp 
      : 0;

    return {
      pendingRequests: this.pendingRequests.size,
      queueLength: this.processingQueue.length,
      isProcessing: this.batchTimer !== null,
      oldestRequestAge
    };
  }

  /**
   * Clear all pending requests
   */
  clearQueue(): void {
    // Cancel pending requests
    this.processingQueue.forEach(request => {
      this.pendingRequests.delete(request.id);
      if (request.callback) {
        request.callback(null, new Error('Request cancelled'));
      }
    });

    this.processingQueue = [];
    this.pendingRequests.clear();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Update batch configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      batchesProcessed: 0,
      averageBatchSize: 0,
      averageProcessingTime: 0,
      throughput: 0,
      errorRate: 0
    };
    this.processingTimes = [];
    this.errorCount = 0;
  }
}

/**
 * Factory function to create batch processors for different model types
 */
export class BatchProcessorFactory {
  private static processors: Map<string, BatchProcessor> = new Map();

  static createSentimentBatchProcessor(
    sentimentAnalyzer: any,
    config?: Partial<BatchConfig>
  ): BatchProcessor<string, any> {
    const defaultConfig: BatchConfig = {
      maxBatchSize: 8,
      maxWaitTime: 100,
      enablePrioritization: true,
      adaptiveBatching: true
    };

    const finalConfig = { ...defaultConfig, ...config };

    const processor = new BatchProcessor(
      finalConfig,
      async (texts: string[]) => {
        // Process texts in batch
        const results = await Promise.all(
          texts.map(text => sentimentAnalyzer.analyze(text))
        );
        return results;
      }
    );

    this.processors.set('sentiment', processor);
    return processor;
  }

  static createRecommendationBatchProcessor(
    recommendationEngine: any,
    config?: Partial<BatchConfig>
  ): BatchProcessor<any, any> {
    const defaultConfig: BatchConfig = {
      maxBatchSize: 4,
      maxWaitTime: 200,
      enablePrioritization: true,
      adaptiveBatching: true
    };

    const finalConfig = { ...defaultConfig, ...config };

    const processor = new BatchProcessor(
      finalConfig,
      async (userProfiles: any[]) => {
        // Process recommendation requests in batch
        const results = await Promise.all(
          userProfiles.map(profile => 
            recommendationEngine.generateRecommendations(profile.ratings)
          )
        );
        return results;
      }
    );

    this.processors.set('recommendation', processor);
    return processor;
  }

  static getProcessor(type: string): BatchProcessor | null {
    return this.processors.get(type) || null;
  }

  static clearAll(): void {
    this.processors.forEach(processor => processor.clearQueue());
    this.processors.clear();
  }
}