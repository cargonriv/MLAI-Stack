/**
 * Analytics Integration for ML Model Performance and User Interactions
 * Tracks model usage, performance metrics, and user behavior
 */

export interface AnalyticsEvent {
  eventType: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  context?: AnalyticsContext;
}

export interface AnalyticsContext {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserName: string;
  browserVersion: string;
  screenResolution: string;
  networkType?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface ModelPerformanceEvent extends AnalyticsEvent {
  eventType: 'model_performance';
  properties: {
    modelId: string;
    modelType: 'sentiment' | 'recommendation' | 'classification';
    loadTime: number;
    inferenceTime: number;
    memoryUsage: number;
    accuracy?: number;
    batchSize?: number;
    deviceCapabilities: any;
    errorOccurred: boolean;
    errorType?: string;
  };
}

export interface UserInteractionEvent extends AnalyticsEvent {
  eventType: 'user_interaction';
  properties: {
    action: string;
    component: string;
    inputType?: string;
    inputSize?: number;
    resultQuality?: number;
    userSatisfaction?: number;
    timeSpent: number;
    retryCount?: number;
  };
}

export interface ABTestEvent extends AnalyticsEvent {
  eventType: 'ab_test';
  properties: {
    testId: string;
    variantId: string;
    conversionEvent: string;
    conversionValue?: number;
    metadata?: Record<string, any>;
  };
}

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number; // milliseconds
  enableUserTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  samplingRate: number; // 0-1, percentage of events to track
}

export class AnalyticsIntegration {
  private static instance: AnalyticsIntegration;
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;
  private context: AnalyticsContext;

  private constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.context = this.buildContext();
    
    if (config.enabled) {
      this.startFlushTimer();
    }
  }

  static getInstance(config?: AnalyticsConfig): AnalyticsIntegration {
    if (!AnalyticsIntegration.instance) {
      const defaultConfig: AnalyticsConfig = {
        enabled: true,
        batchSize: 10,
        flushInterval: 30000, // 30 seconds
        enableUserTracking: true,
        enablePerformanceTracking: true,
        enableErrorTracking: true,
        samplingRate: 1.0
      };
      
      AnalyticsIntegration.instance = new AnalyticsIntegration({
        ...defaultConfig,
        ...config
      });
    }
    return AnalyticsIntegration.instance;
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Track model performance metrics
   */
  trackModelPerformance(data: Omit<ModelPerformanceEvent['properties'], 'deviceCapabilities'>): void {
    if (!this.shouldTrackEvent()) return;

    const event: ModelPerformanceEvent = {
      eventType: 'model_performance',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        ...data,
        deviceCapabilities: this.getDeviceCapabilities()
      },
      context: this.context
    };

    this.addEvent(event);
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(data: UserInteractionEvent['properties']): void {
    if (!this.shouldTrackEvent()) return;

    const event: UserInteractionEvent = {
      eventType: 'user_interaction',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: data,
      context: this.context
    };

    this.addEvent(event);
  }

  /**
   * Track A/B test events
   */
  trackABTest(data: ABTestEvent['properties']): void {
    if (!this.shouldTrackEvent()) return;

    const event: ABTestEvent = {
      eventType: 'ab_test',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: data,
      context: this.context
    };

    this.addEvent(event);
  }

  /**
   * Track custom events
   */
  trackEvent(eventType: string, properties: Record<string, any>): void {
    if (!this.shouldTrackEvent()) return;

    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties,
      context: this.context
    };

    this.addEvent(event);
  }

  /**
   * Track error events
   */
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.config.enableErrorTracking || !this.shouldTrackEvent()) return;

    const event: AnalyticsEvent = {
      eventType: 'error',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        context
      },
      context: this.context
    };

    this.addEvent(event);
  }

  /**
   * Flush events immediately
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    sessionId: string;
    userId?: string;
    eventsQueued: number;
    eventsTracked: number;
    context: AnalyticsContext;
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventsQueued: this.eventQueue.length,
      eventsTracked: this.getTrackedEventsCount(),
      context: this.context
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.flushTimer) {
      this.startFlushTimer();
    } else if (!this.config.enabled && this.flushTimer) {
      this.stopFlushTimer();
    }
  }

  private addEvent(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private shouldTrackEvent(): boolean {
    return this.config.enabled && Math.random() < this.config.samplingRate;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.endpoint) {
      // Log to console in development
      console.log('Analytics Events:', events);
      return;
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify({
        events,
        timestamp: Date.now(),
        sessionId: this.sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildContext(): AnalyticsContext {
    const userAgent = navigator.userAgent;
    const deviceType = this.getDeviceType();
    const { browserName, browserVersion } = this.getBrowserInfo();
    const screenResolution = `${screen.width}x${screen.height}`;

    return {
      userAgent,
      deviceType,
      browserName,
      browserVersion,
      screenResolution,
      networkType: this.getNetworkType()
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent;
    
    if (/Mobile|Android|iPhone/.test(userAgent)) {
      return 'mobile';
    } else if (/iPad|Tablet/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private getBrowserInfo(): { browserName: string; browserVersion: string } {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { browserName: 'Chrome', browserVersion: match?.[1] || 'unknown' };
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { browserName: 'Firefox', browserVersion: match?.[1] || 'unknown' };
    } else if (userAgent.includes('Safari')) {
      const match = userAgent.match(/Safari\/(\d+)/);
      return { browserName: 'Safari', browserVersion: match?.[1] || 'unknown' };
    } else if (userAgent.includes('Edge')) {
      const match = userAgent.match(/Edge\/(\d+)/);
      return { browserName: 'Edge', browserVersion: match?.[1] || 'unknown' };
    }
    
    return { browserName: 'Unknown', browserVersion: 'unknown' };
  }

  private getNetworkType(): string | undefined {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || undefined;
  }

  private getDeviceCapabilities(): any {
    return {
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      memory: (navigator as any).deviceMemory || undefined,
      webglSupported: this.isWebGLSupported(),
      wasmSupported: typeof WebAssembly === 'object',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      indexedDBSupported: 'indexedDB' in window
    };
  }

  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private getTrackedEventsCount(): number {
    // In a real implementation, this would be stored persistently
    return parseInt(localStorage.getItem('analytics_events_tracked') || '0', 10);
  }
}

/**
 * Convenience functions for common tracking scenarios
 */
export class MLAnalytics {
  private static analytics = AnalyticsIntegration.getInstance();

  static trackModelLoad(modelId: string, loadTime: number, success: boolean, error?: string): void {
    this.analytics.trackModelPerformance({
      modelId,
      modelType: this.getModelType(modelId),
      loadTime,
      inferenceTime: 0,
      memoryUsage: 0,
      errorOccurred: !success,
      errorType: error
    });
  }

  static trackInference(
    modelId: string,
    inferenceTime: number,
    memoryUsage: number,
    batchSize: number = 1,
    accuracy?: number
  ): void {
    this.analytics.trackModelPerformance({
      modelId,
      modelType: this.getModelType(modelId),
      loadTime: 0,
      inferenceTime,
      memoryUsage,
      batchSize,
      accuracy,
      errorOccurred: false
    });
  }

  static trackUserFeedback(component: string, satisfaction: number, timeSpent: number): void {
    this.analytics.trackUserInteraction({
      action: 'feedback',
      component,
      userSatisfaction: satisfaction,
      timeSpent
    });
  }

  static trackComponentUsage(component: string, action: string, inputSize?: number): void {
    this.analytics.trackUserInteraction({
      action,
      component,
      inputSize,
      timeSpent: 0
    });
  }

  private static getModelType(modelId: string): 'sentiment' | 'recommendation' | 'classification' {
    if (modelId.includes('sentiment') || modelId.includes('bert')) {
      return 'sentiment';
    } else if (modelId.includes('recommendation') || modelId.includes('collaborative')) {
      return 'recommendation';
    } else {
      return 'classification';
    }
  }
}

export const analytics = AnalyticsIntegration.getInstance();