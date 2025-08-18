/**
 * Test Configuration
 * Centralized configuration for all ML testing scenarios
 */

export interface TestConfig {
  performance: {
    maxLoadTime: number;
    maxInferenceTime: number;
    maxMemoryUsage: number;
    minAccuracy: number;
  };
  accuracy: {
    sentimentThreshold: number;
    recommendationMAE: number;
    consistencyThreshold: number;
  };
  compatibility: {
    supportedBrowsers: string[];
    requiredFeatures: string[];
    fallbackStrategies: string[];
  };
  integration: {
    timeouts: {
      modelLoad: number;
      inference: number;
      userInteraction: number;
    };
    retries: number;
  };
}

export const defaultTestConfig: TestConfig = {
  performance: {
    maxLoadTime: 5000, // 5 seconds
    maxInferenceTime: 500, // 500ms
    maxMemoryUsage: 500 * 1024 * 1024, // 500MB
    minAccuracy: 0.8 // 80%
  },
  accuracy: {
    sentimentThreshold: 0.7, // 70% accuracy threshold
    recommendationMAE: 1.5, // Mean Absolute Error < 1.5 stars
    consistencyThreshold: 0.2 // Confidence variation < 20%
  },
  compatibility: {
    supportedBrowsers: [
      'Chrome >= 80',
      'Firefox >= 75',
      'Safari >= 13',
      'Edge >= 80'
    ],
    requiredFeatures: [
      'WebGL',
      'WebAssembly',
      'ES2018',
      'Fetch API'
    ],
    fallbackStrategies: [
      'CPU inference when WebGL unavailable',
      'Smaller models for limited memory',
      'Progressive loading for slow networks',
      'Cached results for offline scenarios'
    ]
  },
  integration: {
    timeouts: {
      modelLoad: 10000, // 10 seconds
      inference: 2000, // 2 seconds
      userInteraction: 5000 // 5 seconds
    },
    retries: 3
  }
};

export const mobileTestConfig: TestConfig = {
  ...defaultTestConfig,
  performance: {
    ...defaultTestConfig.performance,
    maxLoadTime: 8000, // Slower on mobile
    maxInferenceTime: 1000, // Slower inference
    maxMemoryUsage: 200 * 1024 * 1024 // 200MB limit
  }
};

export const lowEndDeviceConfig: TestConfig = {
  ...defaultTestConfig,
  performance: {
    ...defaultTestConfig.performance,
    maxLoadTime: 15000, // Much slower
    maxInferenceTime: 2000, // Much slower inference
    maxMemoryUsage: 100 * 1024 * 1024 // 100MB limit
  },
  accuracy: {
    ...defaultTestConfig.accuracy,
    sentimentThreshold: 0.6, // Lower accuracy acceptable
    recommendationMAE: 2.0 // Higher error acceptable
  }
};

export const highEndDeviceConfig: TestConfig = {
  ...defaultTestConfig,
  performance: {
    ...defaultTestConfig.performance,
    maxLoadTime: 2000, // Very fast
    maxInferenceTime: 200, // Very fast inference
    maxMemoryUsage: 1024 * 1024 * 1024 // 1GB available
  },
  accuracy: {
    ...defaultTestConfig.accuracy,
    sentimentThreshold: 0.85, // Higher accuracy expected
    recommendationMAE: 1.0 // Lower error expected
  }
};

/**
 * Test data sets for validation
 */
export const testDatasets = {
  sentiment: {
    positive: [
      'This product is absolutely amazing!',
      'I love this service, it\'s excellent.',
      'Great experience, highly recommended!',
      'Wonderful quality and fast delivery.',
      'Outstanding customer support!',
      'Perfect solution for my needs.',
      'Exceeded all my expectations.',
      'Brilliant design and functionality.',
      'Fantastic value for money.',
      'Superb performance and reliability.'
    ],
    negative: [
      'This product is terrible!',
      'I hate this service, it\'s awful.',
      'Horrible experience, waste of money.',
      'Worst quality I\'ve ever seen.',
      'Terrible customer support!',
      'Complete disappointment.',
      'Broken and useless.',
      'Overpriced and underwhelming.',
      'Poor design and functionality.',
      'Unreliable and frustrating.'
    ],
    neutral: [
      'The weather is okay today.',
      'This product is fine, nothing special.',
      'Average quality for the price.',
      'It works as expected.',
      'Standard service, no complaints.',
      'Decent but not outstanding.',
      'Meets basic requirements.',
      'Acceptable performance.',
      'Neither good nor bad.',
      'Typical for this category.'
    ]
  },
  
  movies: {
    ratings: [
      { movieId: 1, title: 'The Matrix', rating: 5, genres: ['Action', 'Sci-Fi'] },
      { movieId: 2, title: 'Titanic', rating: 4, genres: ['Romance', 'Drama'] },
      { movieId: 3, title: 'The Hangover', rating: 3, genres: ['Comedy'] },
      { movieId: 4, title: 'The Shining', rating: 2, genres: ['Horror', 'Thriller'] },
      { movieId: 5, title: 'Inception', rating: 5, genres: ['Action', 'Sci-Fi'] },
      { movieId: 6, title: 'The Notebook', rating: 4, genres: ['Romance', 'Drama'] },
      { movieId: 7, title: 'Superbad', rating: 3, genres: ['Comedy'] },
      { movieId: 8, title: 'It', rating: 1, genres: ['Horror', 'Thriller'] }
    ],
    
    expectedRecommendations: {
      actionLover: {
        input: [
          { movieId: 1, rating: 5 }, // The Matrix
          { movieId: 5, rating: 5 }  // Inception
        ],
        expectedGenres: ['Action', 'Sci-Fi'],
        minRating: 4.0
      },
      
      romanceFan: {
        input: [
          { movieId: 2, rating: 5 }, // Titanic
          { movieId: 6, rating: 4 }  // The Notebook
        ],
        expectedGenres: ['Romance', 'Drama'],
        minRating: 3.5
      }
    }
  }
};

/**
 * Browser configurations for compatibility testing
 */
export const browserConfigs = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    features: {
      webgl: true,
      webgl2: true,
      wasm: true,
      simd: true,
      threads: true
    },
    performance: 'high'
  },
  
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    features: {
      webgl: true,
      webgl2: true,
      wasm: true,
      simd: true,
      threads: false
    },
    performance: 'high'
  },
  
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    features: {
      webgl: true,
      webgl2: false,
      wasm: true,
      simd: false,
      threads: false
    },
    performance: 'medium'
  },
  
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    features: {
      webgl: true,
      webgl2: true,
      wasm: true,
      simd: true,
      threads: true
    },
    performance: 'high'
  },
  
  mobileSafari: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    features: {
      webgl: true,
      webgl2: false,
      wasm: true,
      simd: false,
      threads: false
    },
    performance: 'low',
    constraints: {
      memory: 2 * 1024 * 1024 * 1024, // 2GB
      cores: 2
    }
  },
  
  chromeAndroid: {
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    features: {
      webgl: true,
      webgl2: true,
      wasm: true,
      simd: false,
      threads: false
    },
    performance: 'medium',
    constraints: {
      memory: 4 * 1024 * 1024 * 1024, // 4GB
      cores: 4
    }
  }
};

/**
 * Performance benchmarking configurations
 */
export const benchmarkConfigs = {
  modelLoading: {
    models: [
      'distilbert-base-uncased-finetuned-sst-2-english',
      'bert-base-uncased',
      'roberta-base'
    ],
    metrics: ['loadTime', 'memoryUsage', 'cacheHitRate'],
    iterations: 5
  },
  
  inference: {
    batchSizes: [1, 5, 10, 20, 50],
    textLengths: [10, 50, 100, 200, 500], // words
    metrics: ['inferenceTime', 'throughput', 'memoryUsage'],
    iterations: 10
  },
  
  recommendation: {
    userProfiles: [
      { ratings: 5, genres: 2 },   // Light user
      { ratings: 20, genres: 5 },  // Medium user
      { ratings: 100, genres: 10 } // Heavy user
    ],
    algorithms: ['svd', 'neural', 'hybrid'],
    metrics: ['generationTime', 'accuracy', 'diversity'],
    iterations: 5
  }
};

/**
 * Get test configuration based on environment
 */
export function getTestConfig(environment: 'default' | 'mobile' | 'low-end' | 'high-end' = 'default'): TestConfig {
  switch (environment) {
    case 'mobile':
      return mobileTestConfig;
    case 'low-end':
      return lowEndDeviceConfig;
    case 'high-end':
      return highEndDeviceConfig;
    default:
      return defaultTestConfig;
  }
}

/**
 * Validate test environment setup
 */
export function validateTestEnvironment(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check required globals
  if (typeof global.fetch === 'undefined') {
    issues.push('fetch API not available');
  }
  
  if (typeof global.performance === 'undefined') {
    issues.push('Performance API not available');
  }
  
  if (typeof global.WebAssembly === 'undefined') {
    issues.push('WebAssembly not available');
  }
  
  // Check test utilities
  if (typeof global.document === 'undefined') {
    issues.push('DOM not available (jsdom not configured)');
  }
  
  if (typeof global.localStorage === 'undefined') {
    issues.push('localStorage not mocked');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}