import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/' : '/',
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Enable SharedArrayBuffer for WebLLM
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize bundle splitting for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          // ML utilities chunk
          ml: ['@huggingface/transformers'],
          // WebLLM chunk (separate due to size)
          webllm: ['@mlc-ai/web-llm'],
          // Supabase chunk
          supabase: ['@supabase/supabase-js', '@tanstack/react-query'],
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Enable source maps for production debugging
    sourcemap: mode === 'development',
    // Optimize minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize asset inlining
    assetsInlineLimit: 4096,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [
      '@huggingface/transformers', // Large ML library - load on demand
      '@mlc-ai/web-llm', // WebLLM - load on demand
    ],
  },
  // CSS optimization
  css: {
    devSourcemap: mode === 'development',
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },
  // Performance optimizations
  esbuild: {
    // Remove console logs in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Optimize for modern browsers
    target: 'es2020',
  },
}));
