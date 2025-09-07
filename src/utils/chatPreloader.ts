
/**
 * Chat Pre-loader Service
 * Pre-loads the text generator models to reduce chatbot response time
 */

import { AutoTokenizer } from "@huggingface/transformers";
import { initializeTransformersLLM, isTransformersLLMSupported } from "./transformersLLM";
import { initializeWebLLM, isWebLLMSupported, DEFAULT_MODEL } from "./webllm";

interface PreloadStatus {
  tokenizer: 'idle' | 'loading' | 'ready' | 'error';
  textGenerator: 'idle' | 'loading' | 'ready' | 'error';
  engine: 'webllm' | 'transformers' | 'none';
  progress: string;
}

class ChatPreloader {
  private status: PreloadStatus = {
    tokenizer: 'idle',
    textGenerator: 'idle',
    engine: 'none',
    progress: ''
  };

  private tokenizer: AutoTokenizer | null = null;
  private textGenerator: any = null;
  private listeners: ((status: PreloadStatus) => void)[] = [];
  private preloadStarted = false;

  /**
   * Start pre-loading the chat components
   */
  async startPreloading(): Promise<void> {
    if (this.preloadStarted) {
      console.log('🔄 Chat pre-loading already started');
      return;
    }

    this.preloadStarted = true;
    console.log('🚀 Starting chat pre-loading...');

    // Pre-load in parallel for better performance
    await Promise.allSettled([
      this.preloadTokenizer(),
      this.preloadTextGenerator(),
      this.preloadEmbeddings()
    ]);

    console.log('✅ Chat pre-loading completed');
  }

  /**
   * Pre-load the GPT-4 tokenizer
   */
  private async preloadTokenizer(): Promise<void> {
    if (this.status.tokenizer !== 'idle') return;

    try {
      this.updateStatus({ tokenizer: 'loading', progress: 'Loading tokenizer...' });
      
      console.log('🤖 Pre-loading GPT-4 tokenizer...');
      this.tokenizer = await AutoTokenizer.from_pretrained('models/gpt-4/');
      
      // Test tokenizer to ensure it's working
      const testText = 'Hello! I can encode, decode, and generate text.';
      const testTokens = this.tokenizer.encode(testText);
      
      this.updateStatus({ tokenizer: 'ready', progress: 'Tokenizer ready' });
      console.log('✅ Tokenizer pre-loaded successfully!');
      
    } catch (error) {
      console.error('❌ Failed to pre-load tokenizer:', error);
      this.updateStatus({ tokenizer: 'error', progress: 'Tokenizer failed to load' });
    }
  }

  /**
   * Pre-load the text generator (WebLLM or Transformers.js)
   */
  private async preloadTextGenerator(): Promise<void> {
    if (this.status.textGenerator !== 'idle') return;

    try {
      this.updateStatus({ textGenerator: 'loading', progress: 'Initializing text generator...' });

      // Check which engine is supported
      const webllmSupported = isWebLLMSupported();
      const transformersSupported = isTransformersLLMSupported();

      console.log('🔍 Engine support check:', { webllmSupported, transformersSupported });

      if (transformersSupported) {
        // Prefer Transformers.js for better compatibility and smaller size
        await this.preloadTransformersLLM();
      } else if (webllmSupported) {
        // Fallback to WebLLM if Transformers.js is not supported
        await this.preloadWebLLM();
      } else {
        console.warn('⚠️ No supported text generation engine found');
        this.updateStatus({ 
          textGenerator: 'error', 
          engine: 'none',
          progress: 'No supported engine found' 
        });
      }

    } catch (error) {
      console.error('❌ Failed to pre-load text generator:', error);
      this.updateStatus({ textGenerator: 'error', progress: 'Text generator failed to load' });
    }
  }

  /**
   * Pre-load Transformers.js LLM
   */
  private async preloadTransformersLLM(): Promise<void> {
    const model = `models/SmolLM3-3B-ONNX/`;
    try {
      console.log(`🤖 Pre-loading Transformers.js LLM (${model})...`);
      
      const onProgress = (status: string) => {
        this.updateStatus({ progress: `Transformers.js: ${status}` });
      };

      this.textGenerator = await initializeTransformersLLM({
        model: model as any
      }, onProgress);

      this.updateStatus({ 
        textGenerator: 'ready', 
        engine: 'transformers',
        progress: 'Transformers.js ready' 
      });
      
      console.log(`✅ Transformers.js LLM pre-loaded successfully with ${model}!`);
      
    } catch (error) {
      console.error(`❌ Failed to pre-load Transformers.js LLM (${model}):`, error);
      throw error;
    }
  }

  /**
   * Pre-load WebLLM
   */
  private async preloadWebLLM(): Promise<void> {
    try {
      console.log('🤖 Pre-loading WebLLM...');
      
      const onProgress = (progress: any) => {
        if (progress.text) {
          this.updateStatus({ progress: `WebLLM: ${progress.text}` });
        }
      };

/**
 * Chat Pre-loader Service
 * Pre-loads the text generator models to reduce chatbot response time
 */

import { AutoTokenizer } from "@huggingface/transformers";
import { initializeTransformersLLM, isTransformersLLMSupported } from "./transformersLLM";
import { initializeWebLLM, isWebLLMSupported, DEFAULT_MODEL } from "./webllm";

interface PreloadStatus {
  tokenizer: 'idle' | 'loading' | 'ready' | 'error';
  textGenerator: 'idle' | 'loading' | 'ready' | 'error';
  engine: 'webllm' | 'transformers' | 'none';
  progress: string;
}

class ChatPreloader {
  private status: PreloadStatus = {
    tokenizer: 'idle',
    textGenerator: 'idle',
    engine: 'none',
    progress: ''
  };

  private tokenizer: AutoTokenizer | null = null;
  private textGenerator: any = null;
  private listeners: ((status: PreloadStatus) => void)[] = [];
  private preloadStarted = false;

  /**
   * Start pre-loading the chat components
   */
  async startPreloading(): Promise<void> {
    if (this.preloadStarted) {
      console.log('🔄 Chat pre-loading already started');
      return;
    }

    this.preloadStarted = true;
    console.log('🚀 Starting chat pre-loading...');

    // Pre-load in parallel for better performance
    await Promise.allSettled([
      this.preloadTokenizer(),
      this.preloadTextGenerator(),
      this.preloadEmbeddings()
    ]);

    console.log('✅ Chat pre-loading completed');
  }

  /**
   * Pre-load the GPT-4 tokenizer
   */
  private async preloadTokenizer(): Promise<void> {
    if (this.status.tokenizer !== 'idle') return;

    try {
      this.updateStatus({ tokenizer: 'loading', progress: 'Loading tokenizer...' });
      
      console.log('🤖 Pre-loading GPT-4 tokenizer...');
      const baseUrl = window.location.origin;
      this.tokenizer = await AutoTokenizer.from_pretrained(`${baseUrl}/models/gpt-4/tokenizer.json`);
      
      // Test tokenizer to ensure it's working
      const testText = 'Hello! I can encode, decode, and generate text.';
      const testTokens = this.tokenizer.encode(testText);
      
      this.updateStatus({ tokenizer: 'ready', progress: 'Tokenizer ready' });
      console.log('✅ Tokenizer pre-loaded successfully!');
      
    } catch (error) {
      console.error('❌ Failed to pre-load tokenizer:', error);
      this.updateStatus({ tokenizer: 'error', progress: 'Tokenizer failed to load' });
    }
  }

  /**
   * Pre-load the text generator (WebLLM or Transformers.js)
   */
  private async preloadTextGenerator(): Promise<void> {
    if (this.status.textGenerator !== 'idle') return;

    try {
      this.updateStatus({ textGenerator: 'loading', progress: 'Initializing text generator...' });

      // Check which engine is supported
      const webllmSupported = isWebLLMSupported();
      const transformersSupported = isTransformersLLMSupported();

      console.log('🔍 Engine support check:', { webllmSupported, transformersSupported });

      if (transformersSupported) {
        // Prefer Transformers.js for better compatibility and smaller size
        await this.preloadTransformersLLM();
      } else if (webllmSupported) {
        // Fallback to WebLLM if Transformers.js is not supported
        await this.preloadWebLLM();
      } else {
        console.warn('⚠️ No supported text generation engine found');
        this.updateStatus({ 
          textGenerator: 'error', 
          engine: 'none',
          progress: 'No supported engine found' 
        });
      }

    } catch (error) {
      console.error('❌ Failed to pre-load text generator:', error);
      this.updateStatus({ textGenerator: 'error', progress: 'Text generator failed to load' });
    }
  }

  /**
   * Pre-load Transformers.js LLM
   */
  private async preloadTransformersLLM(): Promise<void> {
    const model = `models/SmolLM3-3B-ONNX/`;
    try {
      console.log(`🤖 Pre-loading Transformers.js LLM (${model})...`);
      
      const onProgress = (status: string) => {
        this.updateStatus({ progress: `Transformers.js: ${status}` });
      };

      this.textGenerator = await initializeTransformersLLM({
        model: model as any
      }, onProgress);

      this.updateStatus({ 
        textGenerator: 'ready', 
        engine: 'transformers',
        progress: 'Transformers.js ready' 
      });
      
      console.log(`✅ Transformers.js LLM pre-loaded successfully with ${model}!`);
      
    } catch (error) {
      console.error(`❌ Failed to pre-load Transformers.js LLM (${model}):`, error);
      throw error;
    }
  }

  /**
   * Pre-load WebLLM
   */
  private async preloadWebLLM(): Promise<void> {
    try {
      console.log('🤖 Pre-loading WebLLM...');
      
      const onProgress = (progress: any) => {
        if (progress.text) {
          this.updateStatus({ progress: `WebLLM: ${progress.text}` });
        }
      };

      this.textGenerator = await initializeWebLLM({
        model: DEFAULT_MODEL
      }, on_progress);

      this.updateStatus({ 
        textGenerator: 'ready', 
        engine: 'webllm',
        progress: 'WebLLM ready' 
      });
      
      console.log('✅ WebLLM pre-loaded successfully!');
      
    } catch (error) {
      console.error('❌ Failed to pre-load WebLLM:', error);
      throw error;
    }
  }

  /**
   * Pre-load workspace embeddings for RAG
   */
  private async preloadEmbeddings(): Promise<void> {
    try {
      console.log('📚 Pre-loading workspace embeddings...');
      this.updateStatus({ progress: 'Loading workspace embeddings...' });

      // Import embeddings utilities
      const { loadWorkspaceEmbeddings, initializeEmbeddingModel } = await import('./embeddings');
      
      // Load workspace embeddings and embedding model in parallel
      await Promise.all([
        loadWorkspaceEmbeddings(),
        initializeEmbeddingModel()
      ]);

      console.log('✅ Workspace embeddings pre-loaded successfully!');
      this.updateStatus({ progress: 'Embeddings ready for RAG' });
      
    } catch (error) {
      console.warn('⚠️ Failed to pre-load embeddings (RAG will be limited):', error);
      // Don't throw error as embeddings are not critical for basic functionality
    }
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(updates: Partial<PreloadStatus>): void {
    this.status = { ...this.status, ...updates };
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Get current pre-loading status
   */
  getStatus(): PreloadStatus {
    return { ...this.status };
  }

  /**
   * Check if chat components are ready
   */
  isReady(): boolean {
    return this.status.tokenizer === 'ready' && this.status.textGenerator === 'ready';
  }

  /**
   * Get pre-loaded tokenizer
   */
  getTokenizer(): AutoTokenizer | null {
    return this.tokenizer;
  }

  /**
   * Get pre-loaded text generator
   */
  getTextGenerator(): any {
    return this.textGenerator;
  }

  /**
   * Subscribe to status updates
   */
  onStatusChange(listener: (status: PreloadStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get estimated loading time based on connection and device
   */
  getEstimatedLoadTime(): string {
    const connection = (navigator as any).connection;
    const deviceMemory = navigator.deviceMemory || 4;
    
    let estimatedSeconds = 30; // Base estimate
    
    // Adjust based on connection speed
    if (connection) {
      const effectiveType = connection.effectiveType;
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          estimatedSeconds = 120;
          break;
        case '3g':
          estimatedSeconds = 60;
          break;
        case '4g':
          estimatedSeconds = 20;
          break;
        default:
          estimatedSeconds = 15;
      }
    }
    
    // Adjust based on device memory
    if (deviceMemory < 2) {
      estimatedSeconds *= 2;
    } else if (deviceMemory >= 8) {
      estimatedSeconds *= 0.7;
    }
    
    return `~${Math.round(estimatedSeconds)}s`;
  }
}

// Create singleton instance
export const chatPreloader = new ChatPreloader();

/**
 * Initialize chat pre-loading when called
 * This should be called early in the application lifecycle
 */
export const initializeChatPreloading = async (): Promise<void> => {
  // Add a small delay to not interfere with initial page load
  setTimeout(() => {
    chatPreloader.startPreloading().catch(error => {
      console.warn('Chat pre-loading failed:', error);
    });
  }, 2000); // Start pre-loading 2 seconds after page load
};

/**
 * Hook for React components to use pre-loading status
 */
export const useChatPreloader = () => {
  return {
    status: chatPreloader.getStatus(),
    isReady: chatPreloader.isReady(),
    tokenizer: chatPreloader.getTokenizer(),
    textGenerator: chatPreloader.getTextGenerator(),
    estimatedLoadTime: chatPreloader.getEstimatedLoadTime(),
    onStatusChange: chatPreloader.onStatusChange.bind(chatPreloader)
  };
};

      this.updateStatus({ 
        textGenerator: 'ready', 
        engine: 'webllm',
        progress: 'WebLLM ready' 
      });
      
      console.log('✅ WebLLM pre-loaded successfully!');
      
    } catch (error) {
      console.error('❌ Failed to pre-load WebLLM:', error);
      throw error;
    }
  }

  /**
   * Pre-load workspace embeddings for RAG
   */
  private async preloadEmbeddings(): Promise<void> {
    try {
      console.log('📚 Pre-loading workspace embeddings...');
      this.updateStatus({ progress: 'Loading workspace embeddings...' });

      // Import embeddings utilities
      const { loadWorkspaceEmbeddings, initializeEmbeddingModel } = await import('./embeddings');
      
      // Load workspace embeddings and embedding model in parallel
      await Promise.all([
        loadWorkspaceEmbeddings(),
        initializeEmbeddingModel()
      ]);

      console.log('✅ Workspace embeddings pre-loaded successfully!');
      this.updateStatus({ progress: 'Embeddings ready for RAG' });
      
    } catch (error) {
      console.warn('⚠️ Failed to pre-load embeddings (RAG will be limited):', error);
      // Don't throw error as embeddings are not critical for basic functionality
    }
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(updates: Partial<PreloadStatus>): void {
    this.status = { ...this.status, ...updates };
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Get current pre-loading status
   */
  getStatus(): PreloadStatus {
    return { ...this.status };
  }

  /**
   * Check if chat components are ready
   */
  isReady(): boolean {
    return this.status.tokenizer === 'ready' && this.status.textGenerator === 'ready';
  }

  /**
   * Get pre-loaded tokenizer
   */
  getTokenizer(): AutoTokenizer | null {
    return this.tokenizer;
  }

  /**
   * Get pre-loaded text generator
   */
  getTextGenerator(): any {
    return this.textGenerator;
  }

  /**
   * Subscribe to status updates
   */
  onStatusChange(listener: (status: PreloadStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get estimated loading time based on connection and device
   */
  getEstimatedLoadTime(): string {
    const connection = (navigator as any).connection;
    const deviceMemory = navigator.deviceMemory || 4;
    
    let estimatedSeconds = 30; // Base estimate
    
    // Adjust based on connection speed
    if (connection) {
      const effectiveType = connection.effectiveType;
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          estimatedSeconds = 120;
          break;
        case '3g':
          estimatedSeconds = 60;
          break;
        case '4g':
          estimatedSeconds = 20;
          break;
        default:
          estimatedSeconds = 15;
      }
    }
    
    // Adjust based on device memory
    if (deviceMemory < 2) {
      estimatedSeconds *= 2;
    } else if (deviceMemory >= 8) {
      estimatedSeconds *= 0.7;
    }
    
    return `~${Math.round(estimatedSeconds)}s`;
  }
}

// Create singleton instance
export const chatPreloader = new ChatPreloader();

/**
 * Initialize chat pre-loading when called
 * This should be called early in the application lifecycle
 */
export const initializeChatPreloading = async (): Promise<void> => {
  // Add a small delay to not interfere with initial page load
  setTimeout(() => {
    chatPreloader.startPreloading().catch(error => {
      console.warn('Chat pre-loading failed:', error);
    });
  }, 2000); // Start pre-loading 2 seconds after page load
};

/**
 * Hook for React components to use pre-loading status
 */
export const useChatPreloader = () => {
  return {
    status: chatPreloader.getStatus(),
    isReady: chatPreloader.isReady(),
    tokenizer: chatPreloader.getTokenizer(),
    textGenerator: chatPreloader.getTextGenerator(),
    estimatedLoadTime: chatPreloader.getEstimatedLoadTime(),
    onStatusChange: chatPreloader.onStatusChange.bind(chatPreloader)
  };
};