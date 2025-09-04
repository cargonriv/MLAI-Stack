import * as webllm from "@mlc-ai/web-llm";
import { analyzeInputComplexity } from './complexityAnalysis';

// Extend Navigator interface for Device Memory API (experimental)
declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

// WebLLM Engine instance
let engine: webllm.MLCEngine | null = null;
let isInitializing = false;

// Available models - ordered by size (smallest first for better browser compatibility)
const AVAILABLE_MODELS = [
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", // ~0.5GB - Ultra-lightweight Qwen model
  "SmolLM-360M-Instruct-q4f16_1-MLC", // ~0.3GB - Microsoft's tiny model
  "Llama-3.2-1B-Instruct-q4f32_1-MLC", // ~1.2GB - Lightweight Llama model
  "gemma-2-2b-it-q4f16_1-MLC", // ~1.8GB - Google Gemma model  
  "Phi-3.5-mini-instruct-q4f16_1-MLC", // ~2.4GB - Microsoft Phi model
] as const;

// Default model - use ultra-small for maximum compatibility
export const DEFAULT_MODEL: ModelName = "SmolLM-360M-Instruct-q4f16_1-MLC";

export type ModelName = typeof AVAILABLE_MODELS[number];

export interface WebLLMConfig {
  model: ModelName;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  adaptive_tokens?: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Check storage quota and available space
 */
async function checkStorageQuota(): Promise<{ available: number; used: number; quota: number }> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      
      const quota = estimate.quota || 0;
      const used = estimate.usage || 0;
      const available = quota - used;

      console.log(`📊 Storage: ${(used / 1024 / 1024 / 1024).toFixed(2)}GB used / ${(quota / 1024 / 1024 / 1024).toFixed(2)}GB total`);

      return { available, used, quota };
    }
  } catch (error) {
    console.warn("Could not check storage quota:", error);
  }

  return { available: 0, used: 0, quota: 0 };
}

/**
 * Get model size estimates in bytes (more accurate estimates)
 */
function getModelSizeEstimate(model: ModelName): number {
  const sizes: Record<ModelName, number> = {
    "SmolLM-360M-Instruct-q4f16_1-MLC": 0.2 * 1024 * 1024 * 1024, // ~200MB (more accurate)
    "Qwen2.5-0.5B-Instruct-q4f16_1-MLC": 0.35 * 1024 * 1024 * 1024, // ~350MB
    "Llama-3.2-1B-Instruct-q4f32_1-MLC": 1.2 * 1024 * 1024 * 1024, // 1.2GB
    "gemma-2-2b-it-q4f16_1-MLC": 1.8 * 1024 * 1024 * 1024, // 1.8GB
    "Phi-3.5-mini-instruct-q4f16_1-MLC": 2.4 * 1024 * 1024 * 1024, // 2.4GB
  };
  return sizes[model] || 2 * 1024 * 1024 * 1024; // Default 2GB
}

/**
 * Initialize WebLLM engine with the specified model
 */
export async function initializeWebLLM(
  config: WebLLMConfig,
  onProgress?: (progress: webllm.InitProgressReport) => void
): Promise<webllm.MLCEngine> {
  if (engine && !isInitializing) {
    return engine;
  }

  if (isInitializing) {
    // Wait for current initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (engine) return engine;
  }

  isInitializing = true;

  try {
    const modelToUse = config.model || DEFAULT_MODEL;
    console.log(`🚀 Initializing WebLLM with model: ${modelToUse}`);

    // Check device memory if available (Device Memory API is experimental)
    if (navigator.deviceMemory) {
      console.log(`Estimated RAM: ${navigator.deviceMemory} GB`);
    }

    // Check storage quota before attempting to load model
    const storage = await checkStorageQuota();
    const modelSize = getModelSizeEstimate(modelToUse);

    if (storage.quota > 0 && storage.available < modelSize) {
      const availableGB = (storage.available / 1024 / 1024 / 1024).toFixed(2);
      const requiredGB = (modelSize / 1024 / 1024 / 1024).toFixed(2);

      throw new Error(
        `Insufficient storage space. Available: ${availableGB}GB, Required: ${requiredGB}GB. ` +
        `Try clearing browser cache or using a smaller model.`
      );
    }

    engine = new webllm.MLCEngine();

    if (onProgress) {
      engine.setInitProgressCallback(onProgress);
    }

    await engine.reload(modelToUse);

    console.log("✅ WebLLM engine initialized successfully!");
    return engine;
  } catch (error) {
    console.error("❌ Failed to initialize WebLLM:", error);
    engine = null;

    // If it's a quota error, try with a smaller model
    if (error instanceof Error && error.message.includes('Quota exceeded')) {
      console.log("🔄 Attempting fallback to smaller model...");

      // Try the smallest model if we weren't already using it
      if (config.model !== DEFAULT_MODEL) {
        try {
          const fallbackConfig = { ...config, model: DEFAULT_MODEL };
          return await initializeWebLLM(fallbackConfig, onProgress);
        } catch (fallbackError) {
          console.error("❌ Fallback model also failed:", fallbackError);
        }
      }
    }

    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Generate a response using WebLLM
 */
export async function generateResponse(
  messages: ChatMessage[],
  config: Partial<WebLLMConfig> = {},
  onToken?: (token: string) => void
): Promise<string> {
  if (!engine) {
    throw new Error("WebLLM engine not initialized. Call initializeWebLLM first.");
  }

  try {
    // Analyze input complexity and adjust token allocation
    let maxTokens = config.max_tokens || 512;
    
    if (config.adaptive_tokens !== false) { // Default to enabled
      const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      const complexityInfo = analyzeInputComplexity(userMessage);
      maxTokens = complexityInfo.suggestedTokens;
      
      console.log(`🧠 Input complexity: ${complexityInfo.complexity} (${complexityInfo.reasoning})`);
      console.log(`📊 Allocated tokens: ${maxTokens}`);
    }

    if (onToken) {
      // Handle streaming response
      const completion = await engine.chat.completions.create({
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: maxTokens,
        top_p: config.top_p ?? 0.9,
        stream: true,
      });

      let fullResponse = "";

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onToken(content);
        }
      }

      return fullResponse;
    } else {
      // Handle non-streaming response
      const completion = await engine.chat.completions.create({
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: maxTokens,
        top_p: config.top_p ?? 0.9,
        stream: false,
      });

      return completion.choices[0]?.message?.content || "";
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

/**
 * Check if WebLLM is supported in the current browser
 */
export function isWebLLMSupported(): boolean {
  try {
    // Check for WebGPU support
    if (!('gpu' in navigator)) {
      console.warn("WebGPU not supported");
      return false;
    }

    // Check for WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      console.warn("WebAssembly not supported");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking WebLLM support:", error);
    return false;
  }
}

/**
 * Clear WebLLM cache to free up storage space
 */
export async function clearWebLLMCache(): Promise<void> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const webllmCaches = cacheNames.filter(name =>
        name.includes('webllm') || name.includes('mlc')
      );

      for (const cacheName of webllmCaches) {
        await caches.delete(cacheName);
        console.log(`🗑️ Cleared cache: ${cacheName}`);
      }
    }

    // Also clear IndexedDB if possible
    if ('indexedDB' in window) {
      // Note: This is a simplified approach - in practice you'd need to 
      // identify and clear specific WebLLM databases
      console.log("💾 Consider clearing IndexedDB manually if storage issues persist");
    }

    console.log("✅ WebLLM cache cleared");
  } catch (error) {
    console.error("Error clearing WebLLM cache:", error);
  }
}

/**
 * Get the current engine instance
 */
export function getEngine(): webllm.MLCEngine | null {
  return engine;
}

/**
 * Cleanup WebLLM resources
 */
export async function cleanupWebLLM(): Promise<void> {
  if (engine) {
    try {
      await engine.unload();
      engine = null;
      console.log("✅ WebLLM engine cleaned up");
    } catch (error) {
      console.error("Error cleaning up WebLLM:", error);
    }
  }
}

/**
 * Get available models
 */
export function getAvailableModels(): readonly ModelName[] {
  return AVAILABLE_MODELS;
}