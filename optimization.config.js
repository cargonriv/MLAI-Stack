/**
 * Comprehensive optimization configuration for the ML Portfolio
 */

export const optimizationConfig = {
  // Bundle optimization settings
  bundle: {
    // Target bundle sizes (in KB)
    targets: {
      js: {
        main: 250,      // Main application bundle
        vendor: 500,    // Vendor libraries bundle
        chunks: 100,    // Individual route chunks
      },
      css: {
        main: 50,       // Main CSS bundle
        components: 25, // Component-specific CSS
      },
      images: {
        hero: 200,      // Hero section images
        thumbnails: 50, // Thumbnail images
        icons: 10,      // Icon files
      },
    },
    
    // Code splitting configuration
    splitting: {
      vendor: ['react', 'react-dom', 'react-router-dom'],
      ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
      ml: ['@huggingface/transformers'],
      supabase: ['@supabase/supabase-js', '@tanstack/react-query'],
    },
    
    // Tree shaking configuration
    treeShaking: {
      enabled: true,
      sideEffects: false,
      unusedExports: true,
    },
  },

  // Image optimization settings
  images: {
    formats: {
      modern: ['avif', 'webp'],
      fallback: ['jpeg', 'png'],
    },
    quality: {
      high: 90,
      medium: 80,
      low: 60,
    },
    sizes: {
      hero: [1920, 1280, 640],
      card: [800, 600, 400],
      thumbnail: [300, 200, 150],
      avatar: [200, 150, 100],
    },
    lazy: {
      enabled: true,
      threshold: '50px',
      placeholder: 'blur',
    },
  },

  // CSS optimization settings
  css: {
    purge: {
      enabled: true,
      safelist: [
        // Always keep these classes
        'sr-only',
        'focus-visible',
        'dark',
        'light',
        /^animate-/,
        /^transition-/,
      ],
      blocklist: [
        // Remove these classes
        /^debug-/,
        /^test-/,
      ],
    },
    critical: {
      enabled: true,
      inline: true,
      extract: true,
      dimensions: [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1366, height: 768 },  // Laptop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 },   // Mobile
      ],
    },
    minification: {
      enabled: true,
      removeComments: true,
      removeUnusedRules: true,
      mergeRules: true,
    },
  },

  // Performance optimization settings
  performance: {
    // Core Web Vitals targets
    vitals: {
      lcp: 2500,  // Largest Contentful Paint (ms)
      fid: 100,   // First Input Delay (ms)
      cls: 0.1,   // Cumulative Layout Shift
      fcp: 1800,  // First Contentful Paint (ms)
      ttfb: 800,  // Time to First Byte (ms)
    },
    
    // Resource hints
    preload: [
      '/avatar.png',
      '/placeholder.svg',
    ],
    prefetch: [
      // Routes to prefetch
      '/about',
      '/projects',
    ],
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    
    // Lazy loading configuration
    lazyLoading: {
      images: true,
      components: true,
      routes: true,
      threshold: 0.1,
      rootMargin: '50px',
    },
  },

  // Service Worker configuration
  serviceWorker: {
    enabled: true,
    scope: '/',
    caching: {
      strategies: {
        static: 'cache-first',
        api: 'network-first',
        images: 'cache-first',
        documents: 'network-first',
      },
      maxAge: {
        static: 30 * 24 * 60 * 60 * 1000,  // 30 days
        api: 5 * 60 * 1000,                 // 5 minutes
        images: 7 * 24 * 60 * 60 * 1000,    // 7 days
        documents: 24 * 60 * 60 * 1000,     // 24 hours
      },
    },
    offline: {
      enabled: true,
      fallbacks: {
        document: '/index.html',
        image: '/placeholder.svg',
        font: null,
      },
    },
  },

  // Build optimization settings
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false, // Disable in production
    rollup: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    terser: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
  },

  // Development optimization settings
  development: {
    hmr: true,
    sourcemap: true,
    optimization: false,
    bundleAnalyzer: false,
  },

  // Monitoring and analytics
  monitoring: {
    performance: {
      enabled: true,
      sampleRate: 1.0, // 100% in development, reduce in production
      reportInterval: 30000, // 30 seconds
    },
    errors: {
      enabled: true,
      captureUnhandledRejections: true,
      captureConsoleErrors: true,
    },
    analytics: {
      enabled: false, // Enable with your analytics service
      trackingId: null,
      events: {
        pageViews: true,
        interactions: true,
        performance: true,
        errors: true,
      },
    },
  },

  // Accessibility optimization
  accessibility: {
    focusManagement: true,
    screenReaderSupport: true,
    keyboardNavigation: true,
    colorContrast: {
      level: 'AA',
      largeText: 3.0,
      normalText: 4.5,
    },
    reducedMotion: {
      respectPreference: true,
      fallbackAnimations: true,
    },
  },

  // SEO optimization
  seo: {
    meta: {
      generateSitemap: true,
      generateRobots: true,
      structuredData: true,
    },
    prerendering: {
      enabled: false, // Enable for static generation
      routes: [
        '/',
        '/about',
        '/projects',
        '/blog',
      ],
    },
  },
};

export default optimizationConfig;