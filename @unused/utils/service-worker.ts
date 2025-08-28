// Service Worker registration and management utilities

interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

interface ServiceWorkerResponse {
  success?: boolean;
  error?: string;
  size?: number;
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    return this.sendMessage({ type: 'SKIP_WAITING' });
  }

  async cacheUrls(urls: string[]): Promise<boolean> {
    try {
      const response = await this.sendMessage({
        type: 'CACHE_URLS',
        data: { urls }
      });
      return response.success || false;
    } catch (error) {
      console.error('Failed to cache URLs:', error);
      return false;
    }
  }

  async clearCache(): Promise<boolean> {
    try {
      const response = await this.sendMessage({ type: 'CLEAR_CACHE' });
      return response.success || false;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const response = await this.sendMessage({ type: 'GET_CACHE_SIZE' });
      return response.size || 0;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  private async sendMessage(message: ServiceWorkerMessage): Promise<ServiceWorkerResponse> {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      messageChannel.port1.onerror = (error) => {
        reject(error);
      };

      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
  }

  private handleMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data);
        break;
      case 'OFFLINE_FALLBACK':
        console.log('Serving offline fallback');
        break;
      default:
        console.log('Service Worker message:', event.data);
    }
  }

  private notifyUpdate() {
    // Dispatch custom event for update notification
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    }));
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

import { useState, useEffect } from 'react';

// Hook for React components
export const useServiceWorker = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    const registerSW = async () => {
      const registered = await serviceWorkerManager.register();
      setIsRegistered(registered);
      
      if (registered) {
        // Get initial cache size
        const size = await serviceWorkerManager.getCacheSize();
        setCacheSize(size);
      }
    };

    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true);
    };

    registerSW();
    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const updateApp = async () => {
    try {
      await serviceWorkerManager.skipWaiting();
      window.location.reload();
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  };

  const clearCache = async () => {
    try {
      const success = await serviceWorkerManager.clearCache();
      if (success) {
        setCacheSize(0);
      }
      return success;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  };

  const refreshCacheSize = async () => {
    try {
      const size = await serviceWorkerManager.getCacheSize();
      setCacheSize(size);
      return size;
    } catch (error) {
      console.error('Failed to refresh cache size:', error);
      return 0;
    }
  };

  return {
    isRegistered,
    isUpdateAvailable,
    cacheSize,
    updateApp,
    clearCache,
    refreshCacheSize,
    isSupported: serviceWorkerManager.isServiceWorkerSupported()
  };
};

// Utility to format cache size
export const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};