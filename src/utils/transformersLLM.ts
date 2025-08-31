/**
 * Transformers.js-based LLM for lightweight text generation
 * Alternative to WebLLM for storage-constrained environments
 */

import { pipeline, TextGenerationPipeline, TextStreamer } from '@huggingface/transformers';

// Available lightweight models compatible with Transformers.js (verified working)
const AVAILABLE_MODELS = [
  "HuggingFaceTB/SmolLM3-3B-ONNX",
  "HuggingFaceTB/SmolLM2-135M-Instruct", // ~60MB - Ultra lightweight, excellent for limited storage
  "HuggingFaceTB/SmolLM2-360M-Instruct", // ~150MB - Better quality, good balance
  "HuggingFaceTB/SmolLM2-1.7B-Instruct", // ~700MB - Largest SmolLM2, best quality
  "Xenova/distilgpt2", // ~80MB - Classic GPT-2 distilled, reliable
  "Xenova/gpt2", // ~500MB - Full GPT-2 model, good general performance
  "Xenova/llama2.c-stories15M", // ~15MB - Tiny model for extreme constraints
  "microsoft/DialoGPT-medium", // ~350MB - Conversational AI, great for chat
  "microsoft/DialoGPT-large", // ~750MB - Larger conversational model
  "Xenova/LaMini-Flan-T5-248M", // ~250MB - Instruction-tuned T5 model
  "Xenova/LaMini-Flan-T5-783M", // ~780MB - Larger instruction-tuned model
  "Xenova/flan-t5-small", // ~80MB - Google's instruction-tuned T5
  "Xenova/flan-t5-base", // ~250MB - Larger T5 model with better performance
  "Xenova/flan-t5-large", // ~780MB - High-quality instruction following
  "Xenova/CodeT5-small", // ~60MB - Code generation and understanding
  "Xenova/CodeT5-base", // ~220MB - Better code generation capabilities
] as const;

export type TransformersModelName = typeof AVAILABLE_MODELS[number];

export interface TransformersLLMConfig {
  model?: TransformersModelName;
  max_new_tokens?: number;
  temperature?: number;
  top_p?: number;
  do_sample?: boolean;
}

export interface TransformersMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Global pipeline instance
let generator: TextGenerationPipeline | null = null;
let currentModel: TransformersModelName | null = null;
let isInitializing = false;

/**
 * Initialize Transformers.js text generation pipeline
 */
export async function initializeTransformersLLM(
  config: TransformersLLMConfig = {},
  onProgress?: (status: string) => void
): Promise<TextGenerationPipeline> {
  const model = config.model || "HuggingFaceTB/SmolLM3-3B-ONNX";

  // Return existing pipeline if same model
  if (generator && currentModel === model) {
    return generator;
  }

  // Wait if already initializing
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (generator && currentModel === model) return generator;
  }

  isInitializing = true;

  try {
    console.log(`🤖 Initializing Transformers.js with model: ${model}`);
    onProgress?.(`Loading ${model.split('/')[1]}...`);

    // Create optimized text generation pipeline with quantization and WebGPU
    generator = await pipeline('text-generation', model, {
      dtype: "q4f16", // 4-bit quantization for memory efficiency
      device: "webgpu", // GPU acceleration
      progress_callback: (progress: any) => {
        if (progress.status === 'downloading') {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          onProgress?.(`Downloading model: ${percent}%`);
        } else if (progress.status === 'loading') {
          onProgress?.('Loading model into memory...');
        }
      }
    }) as TextGenerationPipeline;

    currentModel = model;
    console.log("✅ Transformers.js LLM initialized successfully!");
    onProgress?.('Model ready!');

    return generator;

  } catch (error) {
    console.error("❌ Failed to initialize Transformers.js LLM:", error);
    generator = null;
    currentModel = null;
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Generate response using Transformers.js
 */
export async function generateTransformersResponse(
  messages: TransformersMessage[],
  config: TransformersLLMConfig = {},
  onToken?: (token: string) => void
): Promise<string> {
  if (!generator) {
    throw new Error("Transformers.js LLM not initialized. Call initializeTransformersLLM first.");
  }

  try {
    // Use modern chat format instead of raw text generation
    const chatMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system message for thinking capability if not present
    if (!chatMessages.find(m => m.role === 'system')) {
      chatMessages.unshift({
        role: 'system',
        content: 'You are a helpful AI assistant for Carlos Gonzalez Rivera\'s portfolio. Provide informative and engaging responses about his ML engineering expertise, projects, and experience.'
      });
    }

    const result = await generator(chatMessages, {
      max_new_tokens: config.max_new_tokens || 250,
      temperature: config.temperature || 0.7,
      top_p: config.top_p || 0.9,
      do_sample: config.do_sample ?? true,
      streamer: onToken ? new TextStreamer(generator.tokenizer, { 
        skip_prompt: true, 
        skip_special_tokens: true,
        callback_function: onToken
      }) : undefined,
    });

    // Extract generated text from chat format
    const generatedText = Array.isArray(result) && result.length > 0
      ? result[0]?.generated_text?.at(-1)?.content || result[0]?.generated_text
      : result?.generated_text?.at(-1)?.content || result?.generated_text;

    return typeof generatedText === 'string' ? generatedText.trim() : 
           "I'd be happy to help you learn more about Carlos's machine learning engineering expertise. Could you ask a more specific question?";

  } catch (error) {
    console.error("Error generating response with Transformers.js:", error);
    throw error;
  }
}

/**
 * Format messages for different model types
 */
function formatMessagesForModel(messages: TransformersMessage[], model: TransformersModelName): string {
  if (model.includes('SmolLM2')) {
    // SmolLM2 uses ChatML format
    let prompt = "";
    for (const message of messages) {
      if (message.role === "system") {
        prompt += `<|im_start|>system\n${message.content}<|im_end|>\n`;
      } else if (message.role === "user") {
        prompt += `<|im_start|>user\n${message.content}<|im_end|>\n`;
      } else if (message.role === "assistant") {
        prompt += `<|im_start|>assistant\n${message.content}<|im_end|>\n`;
      }
    }
    prompt += "<|im_start|>assistant\n";
    return prompt;
  } else if (model.includes('Qwen') || model.includes('Llama') || model.includes('Phi')) {
    // Modern instruction models use ChatML or similar format
    let prompt = "";
    for (const message of messages) {
      if (message.role === "system") {
        prompt += `<|system|>\n${message.content}<|end|>\n`;
      } else if (message.role === "user") {
        prompt += `<|user|>\n${message.content}<|end|>\n`;
      } else if (message.role === "assistant") {
        prompt += `<|assistant|>\n${message.content}<|end|>\n`;
      }
    }
    prompt += "<|assistant|>\n";
    return prompt;
  } else if (model.includes('gemma')) {
    // Gemma uses specific format
    let prompt = "";
    for (const message of messages) {
      if (message.role === "system") {
        prompt += `<start_of_turn>system\n${message.content}<end_of_turn>\n`;
      } else if (message.role === "user") {
        prompt += `<start_of_turn>user\n${message.content}<end_of_turn>\n`;
      } else if (message.role === "assistant") {
        prompt += `<start_of_turn>model\n${message.content}<end_of_turn>\n`;
      }
    }
    prompt += "<start_of_turn>model\n";
    return prompt;
  } else if (model.includes('DialoGPT')) {
    // DialoGPT uses simple conversation format
    const userMessages = messages.filter(m => m.role !== "system");
    let prompt = "";

    for (const message of userMessages) {
      if (message.role === "user") {
        prompt += `${message.content}`;
      } else if (message.role === "assistant") {
        prompt += `${message.content}`;
      }
      prompt += "<|endoftext|>";
    }
    return prompt;
  } else if (model.includes('t5') || model.includes('T5')) {
    // T5 models use text-to-text format
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    return lastUserMessage ? lastUserMessage.content : "Hello";
  } else {
    // Simple format for GPT-2 and other basic models
    const systemMsg = messages.find(m => m.role === "system");
    const userMessages = messages.filter(m => m.role !== "system");

    let prompt = systemMsg ? `${systemMsg.content}\n\n` : "";

    for (const message of userMessages) {
      if (message.role === "user") {
        prompt += `Human: ${message.content}\n`;
      } else if (message.role === "assistant") {
        prompt += `Assistant: ${message.content}\n`;
      }
    }
    prompt += "Assistant:";
    return prompt;
  }
}

/**
 * Clean up generated text
 */
function cleanGeneratedText(text: string, originalPrompt: string): string {
  // Remove the original prompt if it's included
  let cleaned = text.replace(originalPrompt, "").trim();

  // Remove common artifacts from different model formats
  cleaned = cleaned.replace(/<\|im_end\|>/g, "");
  cleaned = cleaned.replace(/<\|im_start\|>/g, "");
  cleaned = cleaned.replace(/<\|system\|>/g, "");
  cleaned = cleaned.replace(/<\|user\|>/g, "");
  cleaned = cleaned.replace(/<\|assistant\|>/g, "");
  cleaned = cleaned.replace(/<\|end\|>/g, "");
  cleaned = cleaned.replace(/<start_of_turn>/g, "");
  cleaned = cleaned.replace(/<end_of_turn>/g, "");
  cleaned = cleaned.replace(/<\|endoftext\|>/g, "");
  cleaned = cleaned.replace(/Human:/g, "");
  cleaned = cleaned.replace(/Assistant:/g, "");
  cleaned = cleaned.replace(/system/g, "");
  cleaned = cleaned.replace(/user/g, "");
  cleaned = cleaned.replace(/model/g, "");

  // Remove repetitive patterns
  cleaned = cleaned.replace(/(.{10,}?)\1{2,}/g, "$1");

  // Remove extra whitespace and newlines
  cleaned = cleaned.replace(/\n\s*\n/g, "\n").trim();

  // Remove leading/trailing special characters
  cleaned = cleaned.replace(/^[^\w\s]+|[^\w\s.!?]+$/g, "").trim();

  // If response is too short or repetitive, provide a fallback
  if (cleaned.length < 10 || cleaned.split(' ').length < 3) {
    return "I'd be happy to help you learn more about Carlos's machine learning engineering expertise. Could you ask a more specific question about his projects, skills, or experience?";
  }

  return cleaned;
}

/**
 * Get available Transformers.js models
 */
export function getAvailableTransformersModels(): readonly TransformersModelName[] {
  return AVAILABLE_MODELS;
}

/**
 * Get model information
 */
export function getTransformersModelInfo(model: TransformersModelName): {
  name: string;
  size: string;
  description: string;
  compatibility: 'excellent' | 'good' | 'fair';
  quality: 1 | 2 | 3 | 4 | 5;
} {
  const modelInfo = {
    "HuggingFaceTB/SmolLM3-3B-ONNX": {
      name: "SmolLM3 3B",
      size: "1GB",
      description: "ONNX compatible dual reasoning, supports 6 languages and long context with strong function calling",
      compatibility: 'excellent' as const,
      quality: 4 as const
    },
    "HuggingFaceTB/SmolLM2-135M-Instruct": {
      name: "SmolLM2 135M",
      size: "~60MB",
      description: "Ultra-lightweight instruction-tuned model, excellent for limited storage",
      compatibility: 'excellent' as const,
      quality: 3 as const
    },
    "HuggingFaceTB/SmolLM2-360M-Instruct": {
      name: "SmolLM2 360M",
      size: "~150MB",
      description: "Balanced SmolLM2 model with improved quality and reasoning",
      compatibility: 'excellent' as const,
      quality: 4 as const
    },
    "HuggingFaceTB/SmolLM2-1.7B-Instruct": {
      name: "SmolLM2 1.7B",
      size: "~700MB",
      description: "Largest SmolLM2 model with excellent instruction following",
      compatibility: 'good' as const,
      quality: 5 as const
    },
    "Xenova/distilgpt2": {
      name: "DistilGPT-2",
      size: "~80MB",
      description: "Distilled GPT-2 model, reliable for general text generation",
      compatibility: 'excellent' as const,
      quality: 3 as const
    },
    "Xenova/gpt2": {
      name: "GPT-2",
      size: "~500MB",
      description: "Full GPT-2 model with good general-purpose text generation",
      compatibility: 'good' as const,
      quality: 4 as const
    },
    "Xenova/llama2.c-stories15M": {
      name: "Llama2.c 15M",
      size: "~15MB",
      description: "Tiny model for basic text generation, very limited capabilities",
      compatibility: 'excellent' as const,
      quality: 2 as const
    },
    "microsoft/DialoGPT-medium": {
      name: "DialoGPT Medium",
      size: "~350MB",
      description: "Conversational AI optimized for natural dialogue and chat",
      compatibility: 'excellent' as const,
      quality: 4 as const
    },
    "microsoft/DialoGPT-large": {
      name: "DialoGPT Large",
      size: "~750MB",
      description: "Larger conversational model with enhanced dialogue capabilities",
      compatibility: 'good' as const,
      quality: 4 as const
    },
    "Xenova/LaMini-Flan-T5-248M": {
      name: "LaMini Flan-T5 248M",
      size: "~250MB",
      description: "Instruction-tuned T5 model with strong reasoning capabilities",
      compatibility: 'excellent' as const,
      quality: 4 as const
    },
    "Xenova/LaMini-Flan-T5-783M": {
      name: "LaMini Flan-T5 783M",
      size: "~780MB",
      description: "Larger instruction-tuned model with enhanced performance",
      compatibility: 'good' as const,
      quality: 5 as const
    },
    "Xenova/flan-t5-small": {
      name: "Flan-T5 Small",
      size: "~80MB",
      description: "Google's compact instruction-tuned T5 model",
      compatibility: 'excellent' as const,
      quality: 3 as const
    },
    "Xenova/flan-t5-base": {
      name: "Flan-T5 Base",
      size: "~250MB",
      description: "Balanced T5 model with good instruction following",
      compatibility: 'excellent' as const,
      quality: 4 as const
    },
    "Xenova/flan-t5-large": {
      name: "Flan-T5 Large",
      size: "~780MB",
      description: "High-quality instruction-tuned T5 with excellent performance",
      compatibility: 'good' as const,
      quality: 5 as const
    },
    "Xenova/CodeT5-small": {
      name: "CodeT5 Small",
      size: "~60MB",
      description: "Compact model specialized for code generation and understanding",
      compatibility: 'excellent' as const,
      quality: 3 as const
    },
    "Xenova/CodeT5-base": {
      name: "CodeT5 Base",
      size: "~220MB",
      description: "Enhanced code generation model with better programming capabilities",
      compatibility: 'excellent' as const,
      quality: 4 as const
    }
  };

  return modelInfo[model] || {
    name: model.split('/')[1] || model,
    size: "Unknown",
    description: "Model information not available",
    compatibility: 'fair' as const,
    quality: 3 as const
  };
}

/**
 * Check if Transformers.js is supported
 */
export function isTransformersLLMSupported(): boolean {
  try {
    // Check for WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      console.warn("WebAssembly not supported");
      return false;
    }

    // Check for modern browser features
    if (!window.fetch || !window.Promise) {
      console.warn("Modern browser features not supported");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking Transformers.js support:", error);
    return false;
  }
}

/**
 * Cleanup Transformers.js resources
 */
export async function cleanupTransformersLLM(): Promise<void> {
  if (generator) {
    try {
      // Transformers.js doesn't have explicit cleanup, but we can clear references
      generator = null;
      currentModel = null;
      console.log("✅ Transformers.js LLM cleaned up");
    } catch (error) {
      console.error("Error cleaning up Transformers.js LLM:", error);
    }
  }
}