/**
 * A/B Testing Framework for ML Models
 * Enables comparison of different model variants and performance tracking
 */

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  trafficSplit: number[]; // Percentage allocation for each variant
  startDate: Date;
  endDate?: Date;
  targetMetrics: string[];
  minimumSampleSize: number;
  confidenceLevel: number; // 0.95 for 95% confidence
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  modelConfig: any;
  isControl: boolean;
}

export interface ABTestResult {
  variantId: string;
  userId: string;
  timestamp: number;
  metrics: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface ABTestAnalysis {
  testId: string;
  status: 'running' | 'completed' | 'stopped';
  totalSamples: number;
  variantResults: VariantAnalysis[];
  winner?: string;
  confidence: number;
  statisticalSignificance: boolean;
  recommendations: string[];
}

export interface VariantAnalysis {
  variantId: string;
  name: string;
  sampleSize: number;
  metrics: Record<string, {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: Record<string, number>;
  }>;
  conversionRate?: number;
  confidenceInterval: Record<string, [number, number]>;
}

export class ABTestingFramework {
  private static instance: ABTestingFramework;
  private activeTests: Map<string, ABTestConfig> = new Map();
  private testResults: Map<string, ABTestResult[]> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  /**
   * Create and start a new A/B test
   */
  createTest(config: ABTestConfig): void {
    // Validate configuration
    this.validateTestConfig(config);
    
    // Initialize test
    this.activeTests.set(config.testId, config);
    this.testResults.set(config.testId, []);
    
    console.log(`A/B Test "${config.name}" started with ${config.variants.length} variants`);
  }

  /**
   * Get variant assignment for a user
   */
  getVariantForUser(testId: string, userId: string): string | null {
    const test = this.activeTests.get(testId);
    if (!test || !this.isTestActive(test)) {
      return null;
    }

    // Check if user already has an assignment
    const userTests = this.userAssignments.get(userId);
    if (userTests?.has(testId)) {
      return userTests.get(testId)!;
    }

    // Assign user to variant based on traffic split
    const variantId = this.assignUserToVariant(test, userId);
    
    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(testId, variantId);

    return variantId;
  }

  /**
   * Record test result for a user
   */
  recordResult(
    testId: string,
    userId: string,
    metrics: Record<string, number>,
    metadata?: Record<string, any>
  ): void {
    const test = this.activeTests.get(testId);
    if (!test || !this.isTestActive(test)) {
      return;
    }

    const variantId = this.getVariantForUser(testId, userId);
    if (!variantId) {
      return;
    }

    const result: ABTestResult = {
      variantId,
      userId,
      timestamp: Date.now(),
      metrics,
      metadata
    };

    const results = this.testResults.get(testId) || [];
    results.push(result);
    this.testResults.set(testId, results);
  }

  /**
   * Analyze test results
   */
  analyzeTest(testId: string): ABTestAnalysis | null {
    const test = this.activeTests.get(testId);
    const results = this.testResults.get(testId);
    
    if (!test || !results) {
      return null;
    }

    const variantResults = this.analyzeVariants(test, results);
    const winner = this.determineWinner(variantResults, test.confidenceLevel);
    const confidence = this.calculateConfidence(variantResults);
    const statisticalSignificance = this.checkStatisticalSignificance(variantResults, test.confidenceLevel);

    return {
      testId,
      status: this.getTestStatus(test, results.length),
      totalSamples: results.length,
      variantResults,
      winner,
      confidence,
      statisticalSignificance,
      recommendations: this.generateRecommendations(variantResults, winner, statisticalSignificance)
    };
  }

  /**
   * Stop a running test
   */
  stopTest(testId: string): void {
    const test = this.activeTests.get(testId);
    if (test) {
      test.endDate = new Date();
      console.log(`A/B Test "${test.name}" stopped`);
    }
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTestConfig[] {
    return Array.from(this.activeTests.values()).filter(test => this.isTestActive(test));
  }

  /**
   * Get test configuration
   */
  getTestConfig(testId: string): ABTestConfig | null {
    return this.activeTests.get(testId) || null;
  }

  private validateTestConfig(config: ABTestConfig): void {
    if (config.variants.length < 2) {
      throw new Error('A/B test must have at least 2 variants');
    }

    if (config.trafficSplit.length !== config.variants.length) {
      throw new Error('Traffic split must match number of variants');
    }

    const totalTraffic = config.trafficSplit.reduce((sum, split) => sum + split, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Traffic split must sum to 100%');
    }

    const controlVariants = config.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Exactly one variant must be marked as control');
    }
  }

  private isTestActive(test: ABTestConfig): boolean {
    const now = new Date();
    return now >= test.startDate && (!test.endDate || now <= test.endDate);
  }

  private assignUserToVariant(test: ABTestConfig, userId: string): string {
    // Use consistent hashing to ensure same user always gets same variant
    const hash = this.hashString(userId + test.testId);
    const bucket = hash % 100;
    
    let cumulativeTraffic = 0;
    for (let i = 0; i < test.variants.length; i++) {
      cumulativeTraffic += test.trafficSplit[i];
      if (bucket < cumulativeTraffic) {
        return test.variants[i].id;
      }
    }
    
    // Fallback to first variant
    return test.variants[0].id;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private analyzeVariants(test: ABTestConfig, results: ABTestResult[]): VariantAnalysis[] {
    const variantAnalyses: VariantAnalysis[] = [];

    for (const variant of test.variants) {
      const variantResults = results.filter(r => r.variantId === variant.id);
      const analysis = this.analyzeVariantResults(variant, variantResults, test.targetMetrics);
      variantAnalyses.push(analysis);
    }

    return variantAnalyses;
  }

  private analyzeVariantResults(
    variant: ABTestVariant,
    results: ABTestResult[],
    targetMetrics: string[]
  ): VariantAnalysis {
    const metrics: Record<string, {
      mean: number;
      stdDev: number;
      min: number;
      max: number;
      percentiles: Record<string, number>;
    }> = {};

    const confidenceInterval: Record<string, [number, number]> = {};

    for (const metricName of targetMetrics) {
      const values = results
        .map(r => r.metrics[metricName])
        .filter(v => v !== undefined && !isNaN(v));

      if (values.length > 0) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        values.sort((a, b) => a - b);
        const percentiles = {
          '25': this.percentile(values, 0.25),
          '50': this.percentile(values, 0.5),
          '75': this.percentile(values, 0.75),
          '90': this.percentile(values, 0.9),
          '95': this.percentile(values, 0.95)
        };

        metrics[metricName] = {
          mean,
          stdDev,
          min: Math.min(...values),
          max: Math.max(...values),
          percentiles
        };

        // Calculate 95% confidence interval
        const marginOfError = 1.96 * (stdDev / Math.sqrt(values.length));
        confidenceInterval[metricName] = [mean - marginOfError, mean + marginOfError];
      }
    }

    return {
      variantId: variant.id,
      name: variant.name,
      sampleSize: results.length,
      metrics,
      confidenceInterval
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    const index = p * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private determineWinner(variants: VariantAnalysis[], confidenceLevel: number): string | undefined {
    if (variants.length < 2) return undefined;

    const control = variants.find(v => v.variantId.includes('control')) || variants[0];
    let bestVariant = control;
    let bestScore = 0;

    // Find variant with best performance across all metrics
    for (const variant of variants) {
      if (variant.variantId === control.variantId) continue;

      let score = 0;
      let metricCount = 0;

      for (const [metricName, metricData] of Object.entries(variant.metrics)) {
        const controlMetric = control.metrics[metricName];
        if (controlMetric) {
          // Higher is better assumption - adjust based on metric type
          const improvement = (metricData.mean - controlMetric.mean) / controlMetric.mean;
          score += improvement;
          metricCount++;
        }
      }

      if (metricCount > 0) {
        score /= metricCount;
        if (score > bestScore) {
          bestScore = score;
          bestVariant = variant;
        }
      }
    }

    return bestVariant.variantId;
  }

  private calculateConfidence(variants: VariantAnalysis[]): number {
    // Simplified confidence calculation
    const minSampleSize = Math.min(...variants.map(v => v.sampleSize));
    
    if (minSampleSize < 30) return 0.5; // Low confidence
    if (minSampleSize < 100) return 0.7; // Medium confidence
    if (minSampleSize < 1000) return 0.85; // High confidence
    return 0.95; // Very high confidence
  }

  private checkStatisticalSignificance(variants: VariantAnalysis[], confidenceLevel: number): boolean {
    // Simplified significance test
    return variants.every(v => v.sampleSize >= 30) && 
           this.calculateConfidence(variants) >= confidenceLevel;
  }

  private generateRecommendations(
    variants: VariantAnalysis[],
    winner?: string,
    significant?: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (!significant) {
      recommendations.push('Test needs more data to reach statistical significance');
    }

    if (winner && significant) {
      const winnerVariant = variants.find(v => v.variantId === winner);
      recommendations.push(`Implement ${winnerVariant?.name} as the winning variant`);
    }

    const minSampleSize = Math.min(...variants.map(v => v.sampleSize));
    if (minSampleSize < 100) {
      recommendations.push('Increase sample size for more reliable results');
    }

    return recommendations;
  }

  private getTestStatus(test: ABTestConfig, sampleCount: number): 'running' | 'completed' | 'stopped' {
    if (test.endDate && new Date() > test.endDate) {
      return 'completed';
    }
    
    if (sampleCount >= test.minimumSampleSize) {
      return 'completed';
    }
    
    return 'running';
  }
}

export const abTestingFramework = ABTestingFramework.getInstance();