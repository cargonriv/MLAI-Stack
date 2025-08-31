import {
  initializeWebLLM,
  generateResponse,
  ChatMessage,
  WebLLMConfig,
  ModelName,
  clearWebLLMCache,
  DEFAULT_MODEL
} from "./webllm";
import {
  initializeTransformersLLM,
  generateTransformersResponse,
  TransformersMessage,
  TransformersLLMConfig,
  TransformersModelName,
  isTransformersLLMSupported
} from "./transformersLLM";
import {
  findRelevantChunks,
  buildContext,
  DocumentChunk
} from "./embeddings";

export interface RAGConfig extends Partial<WebLLMConfig>, Partial<TransformersLLMConfig> {
  useRAG?: boolean;
  maxContextChunks?: number;
  similarityThreshold?: number;
  preferredEngine?: 'webllm' | 'transformers' | 'auto';
  transformersModel?: TransformersModelName;
}

export interface RAGResponse {
  response: string;
  method: 'webllm-rag' | 'webllm-direct' | 'transformers-rag' | 'transformers-direct' | 'intelligent-fallback' | 'simple-fallback' | 'error';
  processingTime: number;
  contextUsed: string[];
  relevantChunks?: { chunk: DocumentChunk; similarity: number }[];
  engine: 'webllm' | 'transformers' | 'fallback';
}

/**
 * System prompt for the AI assistant
 */
const SYSTEM_PROMPT = `You are Carlos Gonzalez Rivera's AI assistant, an expert in machine learning engineering. You help visitors learn about Carlos's background, projects, and expertise.

Key information about Carlos:
- Machine Learning Engineer specializing in computer vision, NLP, and recommendation systems
- Experience with TensorFlow, PyTorch, Hugging Face Transformers, React, and TypeScript
- Built production ML applications including SIDS prediction models, image segmentation, and this interactive portfolio
- Focuses on practical, deployable ML solutions that bridge research and production
- Passionate about client-side ML inference and making AI accessible through web technologies

Guidelines:
- Be helpful, knowledgeable, and enthusiastic about ML engineering
- Use the provided context from Carlos's codebase when relevant
- If asked about specific projects or code, reference the context provided
- Keep responses concise but informative
- Encourage exploration of the interactive demos and projects
- If you don't have specific information, be honest but still helpful

Always maintain a professional yet approachable tone that reflects Carlos's expertise and passion for ML engineering.`;

/**
 * Generate a response using RAG (Retrieval-Augmented Generation)
 */
export async function generateRAGResponse(
  userMessage: string,
  config: RAGConfig = {},
  onToken?: (token: string) => void,
  onProgress?: (status: string) => void
): Promise<RAGResponse> {
  const startTime = Date.now();

  try {
    onProgress?.("Initializing AI models...");

    // Default configuration - prefer Transformers.js for better compatibility
    const {
      useRAG = true,
      maxContextChunks = 5,
      similarityThreshold = 0.3,
      preferredEngine = 'auto',
      model = DEFAULT_MODEL,
      transformersModel = "HuggingFaceTB/SmolLM3-3B-ONNX",
      ...llmConfig
    } = config;

    let contextUsed: string[] = [];
    let relevantChunks: { chunk: DocumentChunk; similarity: number }[] = [];
    let contextString = "";

    // Retrieve relevant context if RAG is enabled
    if (useRAG) {
      try {
        onProgress?.("Finding relevant context...");
        relevantChunks = await findRelevantChunks(
          userMessage,
          maxContextChunks,
          similarityThreshold
        );

        if (relevantChunks.length > 0) {
          contextString = buildContext(relevantChunks);
          contextUsed = relevantChunks.map(({ chunk }) =>
            `${chunk.filePath} (chunk ${chunk.chunkIndex})`
          );
          console.log(`📚 Using ${relevantChunks.length} context chunks`);
        }
      } catch (error) {
        console.warn("Failed to retrieve context, continuing without RAG:", error);
      }
    }

    // Prepare messages for the LLM
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: contextString
          ? `${SYSTEM_PROMPT}\n\n${contextString}`
          : SYSTEM_PROMPT
      },
      {
        role: "user",
        content: userMessage
      }
    ];

    onProgress?.("Generating AI response...");

    // Try different LLM engines based on preference and availability
    let response: string;
    let method: RAGResponse['method'];
    let engine: RAGResponse['engine'];

    // Determine which engine to try first
    const shouldTryTransformers = preferredEngine === 'transformers' ||
      (preferredEngine === 'auto' && isTransformersLLMSupported());
    const shouldTryWebLLM = preferredEngine === 'webllm' ||
      (preferredEngine === 'auto' && !shouldTryTransformers);

    try {
      if (shouldTryTransformers) {
        // Try Transformers.js first (better for limited storage)
        try {
          onProgress?.("Initializing lightweight AI model...");

          await initializeTransformersLLM({
            model: transformersModel,
            ...llmConfig
          }, onProgress);

          // Convert messages format
          const transformersMessages: TransformersMessage[] = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          response = await generateTransformersResponse(transformersMessages, llmConfig, onToken);
          method = useRAG && relevantChunks.length > 0 ? 'transformers-rag' : 'transformers-direct';
          engine = 'transformers';

        } catch (transformersError) {
          console.log("🔄 Transformers.js failed, trying WebLLM...");
          onProgress?.("Trying advanced AI model...");

          // Fallback to WebLLM
          await initializeWebLLM({ model, ...llmConfig });
          response = await generateResponse(messages, llmConfig, onToken);
          method = useRAG && relevantChunks.length > 0 ? 'webllm-rag' : 'webllm-direct';
          engine = 'webllm';
        }
      } else {
        // Try WebLLM first
        try {
          onProgress?.("Initializing advanced AI model...");

          await initializeWebLLM({ model, ...llmConfig });
          response = await generateResponse(messages, llmConfig, onToken);
          method = useRAG && relevantChunks.length > 0 ? 'webllm-rag' : 'webllm-direct';
          engine = 'webllm';

        } catch (webllmError) {
          console.log("🔄 WebLLM failed, trying Transformers.js...");
          onProgress?.("Trying lightweight AI model...");

          // Fallback to Transformers.js
          await initializeTransformersLLM({
            model: transformersModel,
            ...llmConfig
          }, onProgress);

          const transformersMessages: TransformersMessage[] = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          response = await generateTransformersResponse(transformersMessages, llmConfig, onToken);
          method = useRAG && relevantChunks.length > 0 ? 'transformers-rag' : 'transformers-direct';
          engine = 'transformers';
        }
      }

    } catch (allLLMError) {
      console.log("🤖 All LLM engines failed, using intelligent fallback...");
      onProgress?.("Using intelligent responses...");

      // Use intelligent fallback with RAG context if available
      if (useRAG && relevantChunks.length > 0) {
        response = generateIntelligentFallback(userMessage, relevantChunks);
        method = 'intelligent-fallback';
      } else {
        response = generateSimpleFallback(userMessage);
        method = 'simple-fallback';
      }
      engine = 'fallback';

      // Simulate streaming for consistent UX
      if (onToken) {
        for (let i = 0; i < response.length; i++) {
          onToken(response[i]);
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      response,
      method,
      processingTime,
      contextUsed,
      relevantChunks,
      engine
    };

  } catch (error) {
    console.error("RAG generation failed:", error);

    // Generate appropriate fallback response based on error type
    let fallbackResponse = generateSimpleFallback(userMessage);
    let method: RAGResponse['method'] = 'simple-fallback';

    if (error instanceof Error && (
      error.message.includes('Quota exceeded') ||
      error.message.includes('storage')
    )) {
      fallbackResponse = `I'd love to use advanced AI, but your browser has limited storage space (${error.message.includes('Available:') ? error.message.split('Available:')[1].split(',')[0] : 'very little'} available). 

${fallbackResponse}

💡 **Good news**: I can still help you learn about Carlos's work! The responses are based on his actual portfolio content, just without the advanced AI processing.

🚀 **Want the full AI experience?** Try clearing your browser cache or using a device with more storage space.`;
    } else if (error instanceof Error && error.message.includes('WebGPU')) {
      fallbackResponse = `Your browser doesn't support WebGPU, which is needed for advanced AI features. 

${fallbackResponse}

💡 **Tip**: For the full AI experience, try using Chrome 113+, Edge 113+, or Firefox with WebGPU enabled.`;
    }

    return {
      response: fallbackResponse,
      method,
      processingTime: Date.now() - startTime,
      contextUsed: [],
      engine: 'fallback'
    };
  }
}

/**
 * Generate intelligent fallback response using RAG context
 */
function generateIntelligentFallback(
  prompt: string,
  relevantChunks: { chunk: DocumentChunk; similarity: number }[]
): string {
  const promptLower = prompt.toLowerCase();

  // Extract relevant information from chunks
  const contextInfo = relevantChunks
    .slice(0, 3) // Use top 3 most relevant chunks
    .map(({ chunk }) => chunk.content)
    .join(' ')
    .substring(0, 500); // Limit context length

  // Generate response based on context and query type
  if (promptLower.includes('code') || promptLower.includes('implementation') ||
    promptLower.includes('how') && (promptLower.includes('work') || promptLower.includes('build'))) {
    return `Based on the codebase, ${contextInfo.includes('function') || contextInfo.includes('class') ?
      `here's what I found in the implementation: ${contextInfo}` :
      `this involves technical implementation details. The codebase shows various approaches to ML engineering, including client-side inference, model optimization, and production deployment strategies.`}
      
For more specific implementation details, you can explore the interactive demos or check out the source code in the portfolio.`;
  }

  if (promptLower.includes('project') || promptLower.includes('work') || promptLower.includes('experience')) {
    return `From Carlos's portfolio, ${contextInfo ?
      `I can tell you about: ${contextInfo}` :
      `his key projects include a SIDS prediction model using ensemble methods, real-time image segmentation with Grounded SAM, and this interactive ML portfolio with client-side inference.`}
      
Each project demonstrates end-to-end ML development from research to production deployment.`;
  }

  if (promptLower.includes('skill') || promptLower.includes('technology') || promptLower.includes('framework')) {
    return `Carlos's technical expertise includes ${contextInfo ?
      `technologies mentioned in the codebase: ${contextInfo}` :
      `Python for ML development, JavaScript/TypeScript with React, TensorFlow, PyTorch, and Hugging Face Transformers. He specializes in both model development and production deployment, including innovative client-side ML inference.`}`;
  }

  // Default intelligent response with context
  return `${contextInfo ?
    `Based on the portfolio content: ${contextInfo}` :
    `Carlos is a Machine Learning Engineer specializing in computer vision, NLP, and recommendation systems.`}
    
Feel free to ask more specific questions about his projects, technical approach, or explore the interactive ML demos to see his work in action!`;
}

/**
 * Generate simple fallback response without context
 */
function generateSimpleFallback(prompt: string): string {
  const promptLower = prompt.toLowerCase();

  // ML/AI related responses
  if (promptLower.includes('machine learning') || promptLower.includes('ml') ||
    promptLower.includes('ai') || promptLower.includes('model')) {
    return "Carlos specializes in machine learning engineering with experience in computer vision, NLP, and recommendation systems. He works with frameworks like TensorFlow, PyTorch, and Hugging Face Transformers, focusing on both model development and production deployment.";
  }

  // Experience/background related
  if (promptLower.includes('experience') || promptLower.includes('background') ||
    promptLower.includes('work') || promptLower.includes('career')) {
    return "Carlos is a Machine Learning Engineer with experience developing end-to-end ML solutions. His background includes both research and production deployment of ML models, with projects ranging from medical prediction models to real-time image processing applications.";
  }

  // Technical skills
  if (promptLower.includes('python') || promptLower.includes('tensorflow') ||
    promptLower.includes('pytorch') || promptLower.includes('react') || promptLower.includes('code')) {
    return "Carlos's technical stack includes Python for ML development, JavaScript/TypeScript with React for frontend applications, and various ML frameworks. He focuses on creating efficient, scalable solutions that bridge the gap between research and production, including client-side ML inference like this portfolio demonstrates.";
  }

  // Projects
  if (promptLower.includes('project') || promptLower.includes('portfolio') ||
    promptLower.includes('built') || promptLower.includes('developed')) {
    return "Carlos's key projects include a SIDS prediction model using ensemble methods, real-time image segmentation with Grounded SAM, and this interactive ML portfolio website with client-side inference. Each project demonstrates end-to-end ML development from data preprocessing to deployment.";
  }

  // Contact/collaboration
  if (promptLower.includes('contact') || promptLower.includes('hire') ||
    promptLower.includes('collaborate')) {
    return "Carlos is always interested in discussing ML projects and opportunities. Feel free to explore his portfolio, check out the interactive demos, and reach out through the contact information provided if you'd like to discuss potential collaborations.";
  }

  // Default response
  return "Thanks for your question! I'm Carlos's AI assistant, here to help you learn about his machine learning engineering expertise. Feel free to ask about his projects, technical skills, or experience. You can also explore the interactive ML demos to see his work in action!";
}

/**
 * Get available models for the RAG system (ordered by size - smallest first)
 */
export function getAvailableRAGModels(): ModelName[] {
  return [
    "SmolLM-360M-Instruct-q4f16_1-MLC", // Ultra-small - maximum compatibility
    "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", // Very small - good compatibility
    "Llama-3.2-1B-Instruct-q4f32_1-MLC", // Small - decent compatibility
    "gemma-2-2b-it-q4f16_1-MLC", // Medium - may have issues
    "Phi-3.5-mini-instruct-q4f16_1-MLC" // Large - likely storage issues
  ];
}

/**
 * Check if a model is likely to work with current browser storage
 */
export async function checkModelCompatibility(model: ModelName): Promise<{
  compatible: boolean;
  reason?: string;
  suggestion?: string;
}> {
  try {
    // Check storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const used = estimate.usage || 0;
      const available = quota - used;

      const modelInfo = getModelInfo(model);
      const modelSizeBytes = parseFloat(modelInfo.size.replace('~', '').replace('GB', '')) * 1024 * 1024 * 1024;

      if (available < modelSizeBytes) {
        return {
          compatible: false,
          reason: `Insufficient storage space. Available: ${(available / 1024 / 1024 / 1024).toFixed(2)}GB, Required: ${modelInfo.size}`,
          suggestion: `Try clearing browser cache or use ${getAvailableRAGModels()[0]} (smaller model)`
        };
      }
    }

    // Check WebGPU support
    if (!('gpu' in navigator)) {
      return {
        compatible: false,
        reason: "WebGPU not supported",
        suggestion: "Use a modern browser with WebGPU support (Chrome 113+, Edge 113+, Firefox with flag enabled)"
      };
    }

    return { compatible: true };
  } catch (error) {
    return {
      compatible: false,
      reason: "Could not check compatibility",
      suggestion: "Try using the smallest model for best compatibility"
    };
  }
}

/**
 * Estimate model download size and requirements
 */
export function getModelInfo(model: ModelName): {
  name: string;
  size: string;
  description: string;
  requirements: string[];
  compatibility: 'high' | 'medium' | 'low';
} {
  const modelInfo = {
    "SmolLM-360M-Instruct-q4f16_1-MLC": {
      name: "SmolLM 360M",
      size: "~200MB",
      description: "Microsoft's ultra-lightweight model, best chance to work with limited storage",
      requirements: ["WebGPU", "1GB+ RAM", "Modern browser", "250MB+ storage"],
      compatibility: 'high' as const
    },
    "Qwen2.5-0.5B-Instruct-q4f16_1-MLC": {
      name: "Qwen2.5 0.5B",
      size: "~350MB",
      description: "Alibaba's compact model, may exceed storage limits on some devices",
      requirements: ["WebGPU", "1GB+ RAM", "Modern browser", "400MB+ storage"],
      compatibility: 'medium' as const
    },
    "Llama-3.2-1B-Instruct-q4f32_1-MLC": {
      name: "Llama 3.2 1B",
      size: "~1.2GB",
      description: "Meta's lightweight Llama model, good performance but needs more storage",
      requirements: ["WebGPU", "2GB+ RAM", "Modern browser"],
      compatibility: 'medium' as const
    },
    "gemma-2-2b-it-q4f16_1-MLC": {
      name: "Gemma 2 2B",
      size: "~1.8GB",
      description: "Google's Gemma model, good performance for its size",
      requirements: ["WebGPU", "3GB+ RAM", "Modern browser"],
      compatibility: 'medium' as const
    },
    "Phi-3.5-mini-instruct-q4f16_1-MLC": {
      name: "Phi-3.5 Mini",
      size: "~2.4GB",
      description: "Microsoft's efficient instruction-tuned model, may exceed browser storage limits",
      requirements: ["WebGPU", "4GB+ RAM", "Modern browser", "Large storage quota"],
      compatibility: 'low' as const
    }
  };

  return modelInfo[model];
}