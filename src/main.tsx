import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Performance and optimization utilities
import { optimizeCSSDelivery } from './utils/criticalCss'
import { performanceMonitor } from './utils/performanceMonitoring'
import { preloadCriticalImages } from './utils/imageOptimization'

// Initialize critical CSS optimization
optimizeCSSDelivery()

// Preload critical images
preloadCriticalImages([
  '/avatar.png',
  // '/placeholder.svg',
])

// Register enhanced service worker for offline functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      
      console.log('Service Worker registered successfully:', registration.scope)
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('New service worker available')
              
              // Optionally show update notification to user
              if (window.confirm('A new version is available. Reload to update?')) {
                window.location.reload()
              }
            }
          })
        }
      })
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, version } = event.data
        
        if (type === 'SW_UPDATED') {
          console.log(`Service Worker updated to version ${version}`)
        }
      })
      
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  })
}

// Initialize performance monitoring
if (import.meta.env.PROD) {
  // Monitor Core Web Vitals in production
  window.addEventListener('load', () => {
    setTimeout(() => {
      const report = performanceMonitor.generateReport()
      console.log(report)
      
      // Send metrics to analytics service (placeholder)
      const metrics = performanceMonitor.getMetrics()
      if (metrics.lcp || metrics.fid || metrics.cls) {
        // Example: Send to Google Analytics, DataDog, etc.
        console.log('Sending performance metrics to analytics:', metrics)
      }
    }, 2000)
  })
}

createRoot(document.getElementById("root")!).render(<App />);
