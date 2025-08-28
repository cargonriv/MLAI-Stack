/**
 * Progressive Model Loading System
 * Implements chunked downloads and adaptive loading based on device/network conditions
 */

import { deviceDetection, DeviceCapabilities, NetworkCapabilities } from './deviceDetection';

export interface LoadingProgress {
  phase: 'downloading' | 'initializing' | 'ready' | 'error';
  progress: number; // 0-100
  bytesLoaded: number;
  totalBytes: number;
  chunkIndex: number;
  totalChunks: number;
  estimatedTimeRemaining: number; // seconds
  downloadSpeed: number; // bytes/second
}

export interface ModelConfig {
  modelId: string;
  baseUrl: string;
  files: string[];
  totalSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  priority: 'high' | 'medium' | 'low';
  fallbackModel?: string;
}

export interface AdaptiveLoadingOptions {
  enableChunking: boolean;
  chunkSize: number;
  maxConcurrentChunks: number;
  retryAttempts: number;
  timeoutMs: number;
  useCompression: boolean;
  enableCaching: boolean;
}

class ProgressiveLoaderService {
  private loadingTasks = new Map<string, Promise<any>>();
  private progressCallbacks = new Map<string, (progress: LoadingProgress) => void>();
  private abortControllers = new Map<string, AbortController>();

  async loadModelProgressively(
    config: ModelConfig,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<any> {
    const { modelId } = config;

    // Return existing loading task if already in progress
    if (this.loadingTasks.has(modelId)) {
      return this.loadingTasks.get(modelId);
    }

    // Set up progress callback
    if (onProgress) {
      this.progressCallbacks.set(modelId, onProgress);
    }

    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.abortControllers.set(modelId, abortController);

    // Start loading task
    const loadingTask = this.executeProgressiveLoading(config, abortController.signal);
    this.loadingTasks.set(modelId, loadingTask);

    try {
      const result = await loadingTask;
      return result;
    } finally {
      // Cleanup
      this.loadingTasks.delete(modelId);
      this.progressCallbacks.delete(modelId);
      this.abortControllers.delete(modelId);
    }
  }

  private async executeProgressiveLoading(
    config: ModelConfig,
    signal: AbortSignal
  ): Promise<any> {
    const { modelId } = config;
    
    try {
      // Get device and network capabilities
      const [deviceCaps, networkCaps] = await Promise.all([
        deviceDetection.getDeviceCapabilities(),
        deviceDetection.getNetworkCapabilities()
      ]);

      // Determine adaptive loading options
      const options = this.getAdaptiveOptions(deviceCaps, networkCaps);

      this.updateProgress(modelId, {
        phase: 'downloading',
        progress: 0,
        bytesLoaded: 0,
        totalBytes: config.totalSize,
        chunkIndex: 0,
        totalChunks: config.files.length,
        estimatedTimeRemaining: 0,
        downloadSpeed: 0
      });

      // Load model files progressively
      const modelData = await this.loadModelFiles(config, options, signal);

      this.updateProgress(modelId, {
        phase: 'initializing',
        progress: 90,
        bytesLoaded: config.totalSize,
        totalBytes: config.totalSize,
        chunkIndex: config.files.length,
        totalChunks: config.files.length,
        estimatedTimeRemaining: 0,
        downloadSpeed: 0
      });

      // Initialize model
      const model = await this.initializeModel(modelData, signal);

      this.updateProgress(modelId, {
        phase: 'ready',
        progress: 100,
        bytesLoaded: config.totalSize,
        totalBytes: config.totalSize,
        chunkIndex: config.files.length,
        totalChunks: config.files.length,
        estimatedTimeRemaining: 0,
        downloadSpeed: 0
      });

      return model;

    } catch (error) {
      this.updateProgress(modelId, {
        phase: 'error',
        progress: 0,
        bytesLoaded: 0,
        totalBytes: config.totalSize,
        chunkIndex: 0,
        totalChunks: config.files.length,
        estimatedTimeRemaining: 0,
        downloadSpeed: 0
      });
      throw error;
    }
  }

  private getAdaptiveOptions(
    deviceCaps: DeviceCapabilities,
    networkCaps: NetworkCapabilities
  ): AdaptiveLoadingOptions {
    const baseOptions: AdaptiveLoadingOptions = {
      enableChunking: true,
      chunkSize: 1024 * 1024, // 1MB default
      maxConcurrentChunks: 2,
      retryAttempts: 3,
      timeoutMs: 30000,
      useCompression: true,
      enableCaching: true
    };

    // Adjust based on network conditions
    if (networkCaps.bandwidth === 'low') {
      baseOptions.chunkSize = 512 * 1024; // 512KB for slow networks
      baseOptions.maxConcurrentChunks = 1;
      baseOptions.timeoutMs = 60000; // Longer timeout
      baseOptions.retryAttempts = 5;
    } else if (networkCaps.bandwidth === 'high') {
      baseOptions.chunkSize = 2 * 1024 * 1024; // 2MB for fast networks
      baseOptions.maxConcurrentChunks = 4;
      baseOptions.timeoutMs = 15000;
    }

    // Adjust based on device capabilities
    if (deviceCaps.performanceLevel === 'low') {
      baseOptions.maxConcurrentChunks = Math.min(baseOptions.maxConcurrentChunks, 2);
      baseOptions.useCompression = false; // Reduce CPU load
    }

    // Respect save-data preference
    if (networkCaps.saveData) {
      baseOptions.enableChunking = true;
      baseOptions.chunkSize = Math.min(baseOptions.chunkSize, 256 * 1024); // 256KB max
      baseOptions.maxConcurrentChunks = 1;
      baseOptions.useCompression = true;
    }

    return baseOptions;
  }

  private async loadModelFiles(
    config: ModelConfig,
    options: AdaptiveLoadingOptions,
    signal: AbortSignal
  ): Promise<Map<string, ArrayBuffer>> {
    const modelData = new Map<string, ArrayBuffer>();
    let totalBytesLoaded = 0;
    const startTime = Date.now();

    for (let i = 0; i < config.files.length; i++) {
      if (signal.aborted) {
        throw new Error('Loading cancelled');
      }

      const fileName = config.files[i];
      const fileUrl = `${config.baseUrl}/${fileName}`;

      try {
        const fileData = await this.loadFileWithChunking(
          fileUrl,
          options,
          signal,
          (bytesLoaded, totalBytes) => {
            const currentProgress = totalBytesLoaded + bytesLoaded;
            const overallProgress = (currentProgress / config.totalSize) * 80; // Reserve 20% for initialization
            const elapsed = (Date.now() - startTime) / 1000;
            const downloadSpeed = currentProgress / elapsed;
            const remaining = (config.totalSize - currentProgress) / downloadSpeed;

            this.updateProgress(config.modelId, {
              phase: 'downloading',
              progress: overallProgress,
              bytesLoaded: currentProgress,
              totalBytes: config.totalSize,
              chunkIndex: i,
              totalChunks: config.files.length,
              estimatedTimeRemaining: remaining,
              downloadSpeed
            });
          }
        );

        modelData.set(fileName, fileData);
        totalBytesLoaded += fileData.byteLength;

      } catch (error) {
        // Try fallback model if available
        if (config.fallbackModel && i === 0) {
          throw new Error(`Failed to load primary model, fallback needed: ${error}`);
        }
        throw error;
      }
    }

    return modelData;
  }

  private async loadFileWithChunking(
    url: string,
    options: AdaptiveLoadingOptions,
    signal: AbortSignal,
    onProgress: (bytesLoaded: number, totalBytes: number) => void
  ): Promise<ArrayBuffer> {
    if (!options.enableChunking) {
      return this.loadFileDirectly(url, signal, onProgress);
    }

    // Get file size first
    const headResponse = await fetch(url, { 
      method: 'HEAD', 
      signal,
      headers: options.useCompression ? { 'Accept-Encoding': 'gzip, deflate' } : {}
    });
    
    if (!headResponse.ok) {
      throw new Error(`Failed to get file info: ${headResponse.statusText}`);
    }

    const totalSize = parseInt(headResponse.headers.get('content-length') || '0');
    if (totalSize === 0) {
      return this.loadFileDirectly(url, signal, onProgress);
    }

    // Load file in chunks
    const chunks: ArrayBuffer[] = [];
    let bytesLoaded = 0;
    const chunkSize = options.chunkSize;

    for (let start = 0; start < totalSize; start += chunkSize) {
      if (signal.aborted) {
        throw new Error('Loading cancelled');
      }

      const end = Math.min(start + chunkSize - 1, totalSize - 1);
      const chunkData = await this.loadChunk(url, start, end, options, signal);
      
      chunks.push(chunkData);
      bytesLoaded += chunkData.byteLength;
      onProgress(bytesLoaded, totalSize);
    }

    // Combine chunks
    const result = new ArrayBuffer(totalSize);
    const resultView = new Uint8Array(result);
    let offset = 0;

    for (const chunk of chunks) {
      resultView.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    return result;
  }

  private async loadChunk(
    url: string,
    start: number,
    end: number,
    options: AdaptiveLoadingOptions,
    signal: AbortSignal
  ): Promise<ArrayBuffer> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < options.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          signal,
          headers: {
            'Range': `bytes=${start}-${end}`,
            ...(options.useCompression ? { 'Accept-Encoding': 'gzip, deflate' } : {})
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.arrayBuffer();

      } catch (error) {
        lastError = error as Error;
        
        if (signal.aborted) {
          throw new Error('Loading cancelled');
        }

        // Exponential backoff
        if (attempt < options.retryAttempts - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to load chunk after retries');
  }

  private async loadFileDirectly(
    url: string,
    signal: AbortSignal,
    onProgress: (bytesLoaded: number, totalBytes: number) => void
  ): Promise<ArrayBuffer> {
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const totalSize = parseInt(response.headers.get('content-length') || '0');
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const chunks: Uint8Array[] = [];
    let bytesLoaded = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        if (signal.aborted) throw new Error('Loading cancelled');

        chunks.push(value);
        bytesLoaded += value.length;
        onProgress(bytesLoaded, totalSize);
      }
    } finally {
      reader.releaseLock();
    }

    // Combine chunks
    const result = new ArrayBuffer(bytesLoaded);
    const resultView = new Uint8Array(result);
    let offset = 0;

    for (const chunk of chunks) {
      resultView.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  private async initializeModel(modelData: Map<string, ArrayBuffer>, signal: AbortSignal): Promise<any> {
    // This would be implemented based on the specific ML framework
    // For now, return a mock model object
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate initialization
    
    if (signal.aborted) {
      throw new Error('Initialization cancelled');
    }

    return {
      modelData,
      initialized: true,
      timestamp: Date.now()
    };
  }

  private updateProgress(modelId: string, progress: LoadingProgress): void {
    const callback = this.progressCallbacks.get(modelId);
    if (callback) {
      callback(progress);
    }
  }

  // Cancel loading for a specific model
  cancelLoading(modelId: string): void {
    const abortController = this.abortControllers.get(modelId);
    if (abortController) {
      abortController.abort();
    }
  }

  // Cancel all loading tasks
  cancelAllLoading(): void {
    for (const [modelId] of this.abortControllers) {
      this.cancelLoading(modelId);
    }
  }

  // Get loading status
  isLoading(modelId: string): boolean {
    return this.loadingTasks.has(modelId);
  }

  // Get all loading tasks
  getLoadingTasks(): string[] {
    return Array.from(this.loadingTasks.keys());
  }
}

export const progressiveLoader = new ProgressiveLoaderService();