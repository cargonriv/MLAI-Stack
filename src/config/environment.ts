/**
 * Environment configuration for the application
 */

export interface AppConfig {
  apiUrl: string;
  apiTimeout: number;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enablePerformanceMonitoring: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get environment configuration with fallbacks
 */
export const getConfig = (): AppConfig => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  let defaultApiUrl: string;

  if (isDevelopment) {
    // In development, construct the URL based on the browser's hostname.
    // This works for both 'localhost' and network IPs.
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    defaultApiUrl = `http://${hostname}:8000`;
  } else {
    // In production, use a relative path for the proxy.
    defaultApiUrl = '/api';
  }

  return {
    apiUrl: import.meta.env.VITE_API_URL || defaultApiUrl,
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'false',
    isDevelopment,
    isProduction,
  };
};

export const config = getConfig();