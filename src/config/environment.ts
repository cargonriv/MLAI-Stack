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
  
  return {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'false',
    isDevelopment,
    isProduction,
  };
};

export const config = getConfig();