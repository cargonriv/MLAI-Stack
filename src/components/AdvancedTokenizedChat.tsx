import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Minimize2,
    Maximize2,
    Loader2,
    Brain,
    Zap,
    Code,
    Hash,
    ArrowRight,
    Cpu,
    Info,
    Settings,
    Download,
    CheckCircle,
    AlertCircle,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoTokenizer } from "@huggingface/transformers";
import { generateRAGResponse, getAvailableRAGModels, getModelInfo, RAGConfig, checkModelCompatibility } from "@/utils/rag";
import { analyzeInputComplexity, getComplexityDescription } from "@/utils/complexityAnalysis";
import { isWebLLMSupported, clearWebLLMCache } from "@/utils/webllm";
import { isTransformersLLMSupported, getAvailableTransformersModels, getTransformersModelInfo } from "@/utils/transformersLLM";
import { getEmbeddingModelStatus, getWorkspaceEmbeddingsStatus } from "@/utils/embeddings";
import { autoCompleteOutput, CompletionConfig } from "@/utils/outputCompletion";
import { chatPreloader } from "@/utils/chatPreloader";
import type { InitProgressReport } from "@mlc-ai/web-llm";

interface AdvancedTokenizedMessage {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    tokens: number[];
    tokenCount: number;
    decodedTokens?: string[];
    generationMethod: 'webllm-rag' | 'webllm-direct' | 'transformers-rag' | 'transformers-direct' | 'intelligent-fallback' | 'simple-fallback' | 'error';
    processingTime?: number;
    contextUsed?: string[];
    complexityAnalysis?: {
        complexity: 'simple' | 'moderate' | 'complex' | 'detailed';
        allocatedTokens: number;
        reasoning: string;
    };
    completionInfo?: {
        wasCompleted: boolean;
        additionalTokensUsed: number;
        completionReason: string;
        processingTimeMs: number;
    };
}

interface AdvancedTokenizedChatProps {
    isOpen: boolean;
    onToggle: () => void;
}

const AdvancedTokenizedChat = ({ isOpen, onToggle }: AdvancedTokenizedChatProps) => {
    const [messages, setMessages] = useState<AdvancedTokenizedMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [welcomeAdded, setWelcomeAdded] = useState(false);
    const [tokenizerStatus, setTokenizerStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [showTokenDetails, setShowTokenDetails] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preloaderStatus, setPreloaderStatus] = useState(chatPreloader.getStatus());

    // LLM engine state
    const [webllmSupported, setWebllmSupported] = useState(false);
    const [transformersSupported, setTransformersSupported] = useState(false);
    const [modelStatus, setModelStatus] = useState<'not-loaded' | 'loading' | 'ready' | 'error'>('not-loaded');
    const [selectedEngine, setSelectedEngine] = useState<'auto' | 'webllm' | 'transformers'>('transformers');
    const [selectedModel, setSelectedModel] = useState<string>("SmolLM-360M-Instruct-q4f16_1-MLC");
    const [selectedTransformersModel, setSelectedTransformersModel] = useState<string>("HuggingFaceTB/SmolLM3-3B-ONNX");
    const [useRAG, setUseRAG] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState<string>("");
    const [initializationStatus, setInitializationStatus] = useState<string>("");
    const [storageInfo, setStorageInfo] = useState<{
        available: string;
        used: string;
        warning?: string;
    } | null>(null);
    const [lastComplexityAnalysis, setLastComplexityAnalysis] = useState<{
        complexity: string;
        tokens: number;
        reasoning: string;
    } | null>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const tokenizerRef = useRef<AutoTokenizer | null>(null);
    const mountedRef = useRef(false);

    // --------------------------- 
    // Component mounted/unmounted
    // --------------------------- 
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // -----------------------------------------
    // Check WebLLM support and initialize
    // -----------------------------------------
    useEffect(() => {
        if (!isOpen || !mountedRef.current) return;

        const initializeSystem = async () => {
            try {
                // Check LLM engine support
                const webllmAvailable = isWebLLMSupported();
                const transformersAvailable = isTransformersLLMSupported();
                setWebllmSupported(webllmAvailable);
                setTransformersSupported(transformersAvailable);
                console.log("WebLLM supported:", webllmAvailable);
                console.log("Transformers.js supported:", transformersAvailable);

                if (!webllmAvailable && !transformersAvailable) {
                    setMessages([
                        {
                            id: Date.now().toString(),
                            content: "Your browser doesn't support WebLLM (requires WebGPU). I'll use fallback responses, but the full AI features won't be available. Try using Chrome/Edge with WebGPU enabled.",
                            sender: 'bot',
                            timestamp: new Date(),
                            tokens: [],
                            tokenCount: 0,
                            generationMethod: 'error'
                        }
                    ]);
                    return;
                }

                // Check if tokenizer is already pre-loaded
                const preloadedTokenizer = chatPreloader.getTokenizer();
                if (preloadedTokenizer && chatPreloader.getStatus().tokenizer === 'ready') {
                    console.log('✅ Using pre-loaded tokenizer!');
                    tokenizerRef.current = preloadedTokenizer;
                    setTokenizerStatus('ready');
                    setInitializationStatus("Using pre-loaded models - Ready for AI chat!");
                } else {
                    console.log('🤖 Loading tokenizer...');
                    setInitializationStatus("Loading tokenizer...");

                    // Load tokenizer
                    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-4');
                    if (!mountedRef.current) return;

                    const testText = 'Hello! I can encode, decode, and generate text.';
                    const testTokens = tokenizer.encode(testText);
                    console.log('✅ Tokenizer loaded successfully!');

                    tokenizerRef.current = tokenizer;
                    setTokenizerStatus('ready');
                    setInitializationStatus("Ready for AI chat!");
                }

                // Update model status based on pre-loader
                const preloaderStatus = chatPreloader.getStatus();
                if (preloaderStatus.textGenerator === 'ready') {
                    setModelStatus('ready');
                    console.log(`✅ Using pre-loaded ${preloaderStatus.engine} text generator!`);
                } else if (preloaderStatus.textGenerator === 'loading') {
                    setModelStatus('loading');
                    setInitializationStatus(`Pre-loading ${preloaderStatus.engine}... ${preloaderStatus.progress}`);
                }

            } catch (error) {
                console.error('❌ Failed to initialize system:', error);
                if (mountedRef.current) {
                    setTokenizerStatus('error');
                    setInitializationStatus("Initialization failed");
                    setMessages([
                        {
                            id: Date.now().toString(),
                            content: "I encountered an error loading the AI models. I'll use fallback responses, but the full tokenization and generation features won't be available.",
                            sender: 'bot',
                            timestamp: new Date(),
                            tokens: [],
                            tokenCount: 0,
                            generationMethod: 'error'
                        }
                    ]);
                }
            }
        };

        const timeoutId = setTimeout(initializeSystem, 500);
        return () => clearTimeout(timeoutId);

    }, [isOpen]);

    // Listen to pre-loader status updates
    useEffect(() => {
        const unsubscribe = chatPreloader.onStatusChange((status) => {
            setPreloaderStatus(status);

            if (isOpen) {
                if (status.textGenerator === 'ready' && modelStatus !== 'ready') {
                    setModelStatus('ready');
                    setInitializationStatus(`${status.engine} ready - Chat optimized!`);
                    console.log(`✅ Pre-loaded ${status.engine} is now ready!`);
                } else if (status.textGenerator === 'loading') {
                    setModelStatus('loading');
                    setInitializationStatus(status.progress);
                } else if (status.textGenerator === 'error') {
                    setModelStatus('error');
                    setInitializationStatus('Text generator failed to load');
                }
            }
        });

        return unsubscribe;
    }, [isOpen, modelStatus]);

    // ---------------------------
    // Add/update welcome message
    // ---------------------------
    useEffect(() => {
        if (!isOpen || !tokenizerRef.current || welcomeAdded) return;

        const isPreloaded = preloaderStatus.textGenerator === 'ready';

        const welcomeText = webllmSupported || transformersSupported
            ? `Hi! I'm Carlos's AI assistant powered by ${webllmSupported ? 'WebLLM' : 'Transformers.js'} running entirely in your browser${isPreloaded ? ' (pre-loaded for faster responses)' : ''}. I can help you learn about his ML engineering expertise and projects. Ask me anything!`
            : `Hi! I'm Carlos's AI assistant. Your browser has limited AI support, but I can still help you learn about his ML engineering expertise using intelligent responses.`;

        const tokenizer = tokenizerRef.current;
        const welcomeTokens = tokenizer.encode(welcomeText);
        const welcomeDecodedTokens = welcomeTokens.map((t: number) => tokenizer.decode([t]));

        const welcomeMessage: AdvancedTokenizedMessage = {
            id: 'welcome-message',
            content: welcomeText,
            sender: 'bot',
            timestamp: new Date(),
            tokens: welcomeTokens,
            tokenCount: welcomeTokens.length,
            decodedTokens: welcomeDecodedTokens,
            generationMethod: webllmSupported ? "webllm-direct" : transformersSupported ? "transformers-direct" : "simple-fallback",
            processingTime: 0,
        };

        setMessages([welcomeMessage]);
        setWelcomeAdded(true);

    }, [isOpen, tokenizerStatus, webllmSupported, transformersSupported]);



    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    // Tokenize text with detailed breakdown
    const tokenizeText = (text: string): { tokens: number[], decodedTokens: string[], tokenCount: number } => {
        if (tokenizerStatus !== 'ready' || !tokenizerRef.current || !text) {
            return { tokens: [], decodedTokens: [], tokenCount: 0 };
        }

        try {
            const tokens = tokenizerRef.current.encode(text);
            const decodedTokens = tokens.map((token: number) => tokenizerRef.current!.decode([token]));
            return { tokens, decodedTokens, tokenCount: tokens.length };
        } catch (error) {
            console.error('Tokenization error:', error);
            return { tokens: [], decodedTokens: [], tokenCount: 0 };
        }
    };



    const generateResponse = async (
        userMessage: string,
        onNewToken: (token: string) => void,
        onProgress: (status: string) => void
    ): Promise<{ method: 'webllm-rag' | 'webllm-direct' | 'transformers-rag' | 'transformers-direct' | 'intelligent-fallback' | 'simple-fallback' | 'error'; processingTime: number; contextUsed: string[]; complexityAnalysis?: any }> => {

        if (!webllmSupported && !transformersSupported) {
            // Use fallback response for unsupported browsers
            const startTime = Date.now();
            const fallbackResponse = generateFallbackResponse(userMessage);

            // Simulate typing effect for fallback
            for (let i = 0; i < fallbackResponse.length; i++) {
                onNewToken(fallbackResponse[i]);
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            return {
                method: 'simple-fallback',
                processingTime: Date.now() - startTime,
                contextUsed: []
            };
        }

        try {
            // Analyze input complexity for UI feedback
            const complexityAnalysis = analyzeInputComplexity(userMessage);
            setLastComplexityAnalysis({
                complexity: complexityAnalysis.complexity,
                tokens: complexityAnalysis.suggestedTokens,
                reasoning: complexityAnalysis.reasoning
            });

            const config: RAGConfig = {
                model: selectedModel as any,
                transformersModel: selectedTransformersModel as any,
                preferredEngine: selectedEngine,
                useRAG,
                maxContextChunks: 5,
                similarityThreshold: 0.3,
                temperature: 0.7,
                max_tokens: 1024,
                max_new_tokens: 250, // Base token count (will be adjusted by complexity analysis)
                adaptive_tokens: true // Enable adaptive token allocation
            };

            const ragResponse = await generateRAGResponse(
                userMessage,
                config,
                onNewToken,
                onProgress
            );

            return {
                method: ragResponse.method,
                processingTime: ragResponse.processingTime,
                contextUsed: ragResponse.contextUsed,
                complexityAnalysis: {
                    complexity: complexityAnalysis.complexity,
                    allocatedTokens: complexityAnalysis.suggestedTokens,
                    reasoning: complexityAnalysis.reasoning
                }
            };

        } catch (error) {
            console.error('WebLLM generation failed:', error);

            // Fallback to simple response
            const startTime = Date.now();
            const fallbackResponse = generateFallbackResponse(userMessage);

            for (let i = 0; i < fallbackResponse.length; i++) {
                onNewToken(fallbackResponse[i]);
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            return {
                method: 'error',
                processingTime: Date.now() - startTime,
                contextUsed: []
            };
        }
    };

    const generateFallbackResponse = (prompt: string): string => {
        const promptLower = prompt.toLowerCase();

        if (promptLower.includes('machine learning') || promptLower.includes('ml') ||
            promptLower.includes('ai') || promptLower.includes('model')) {
            return "I specialize in machine learning engineering with experience in computer vision, NLP, and recommendation systems. I've worked with frameworks like TensorFlow, PyTorch, and Hugging Face Transformers.";
        }

        if (promptLower.includes('project') || promptLower.includes('portfolio')) {
            return "Some of my key projects include a SIDS prediction model using ensemble methods, real-time image segmentation with Grounded SAM, and this interactive ML portfolio website with client-side inference.";
        }

        return "Thanks for your question! I'm Carlos's AI assistant. Feel free to ask about his machine learning engineering expertise, projects, or explore the interactive demos to see his work in action!";
    };

    // Perform output completion asynchronously
    const performOutputCompletion = async (
        botMessage: AdvancedTokenizedMessage,
        generationMethod: string,
        userMessage: string
    ) => {
        try {
            // Configure completion based on content type and complexity
            const completionConfig: CompletionConfig = {
                maxAdditionalTokens: 100,
                timeoutMs: 10000,
                minCompletionLength: 10,
                contentType: 'conversational',
                languageCode: 'en',
                ensureCompleteThought: true,
                adaptiveTokens: true,
                complexityLevel: botMessage.complexityAnalysis?.complexity
            };

            // Create message context for completion
            const messages = [
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botMessage.content }
            ];

            // Attempt completion
            const completionResult = await autoCompleteOutput(
                botMessage.content,
                messages,
                generationMethod,
                completionConfig
            );

            // If completion was successful and added meaningful content
            if (completionResult.wasCompleted && completionResult.completedText !== botMessage.content) {
                console.log(`✅ Output completed: ${completionResult.completionReason}`);

                // Update the message with completed text
                setMessages(prevMessages => prevMessages.map(msg => {
                    if (msg.id === botMessage.id) {
                        const { tokens, decodedTokens, tokenCount } = tokenizeText(completionResult.completedText);
                        return {
                            ...msg,
                            content: completionResult.completedText,
                            tokens,
                            decodedTokens,
                            tokenCount,
                            completionInfo: {
                                wasCompleted: true,
                                additionalTokensUsed: completionResult.additionalTokensUsed,
                                completionReason: completionResult.completionReason,
                                processingTimeMs: completionResult.processingTimeMs
                            }
                        };
                    }
                    return msg;
                }));
            } else {
                console.log(`ℹ️ No completion needed: ${completionResult.completionReason}`);
            }
        } catch (error) {
            console.warn('Output completion failed:', error);
            // Completion failure is not critical, so we don't show error to user
        }
    };

    // Storage management functions
    const checkStorageStatus = async () => {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const quota = estimate.quota || 0;
                const used = estimate.usage || 0;
                const available = quota - used;

                const quotaGB = (quota / 1024 / 1024 / 1024).toFixed(2);
                const usedGB = (used / 1024 / 1024 / 1024).toFixed(2);
                const availableGB = (available / 1024 / 1024 / 1024).toFixed(2);

                let warning = undefined;
                if (available < 1.2 * 1024 * 1024 * 1024) {
                    warning = "Low storage space. Consider clearing cache.";
                }

                setStorageInfo({
                    available: `${availableGB}GB available`,
                    used: `${usedGB}GB / ${quotaGB}GB used`,
                    warning
                });
            } else {
                setStorageInfo({
                    available: "Storage API not supported",
                    used: "Cannot check usage"
                });
            }
        } catch (error) {
            console.error("Error checking storage:", error);
            setStorageInfo({
                available: "Error checking storage",
                used: "Please try again"
            });
        }
    };

    const clearModelCache = async () => {
        try {
            setLoadingProgress("Clearing model cache...");
            await clearWebLLMCache();
            setLoadingProgress("");

            // Refresh storage info
            await checkStorageStatus();

            // Show success message
            setStorageInfo(prev => prev ? {
                ...prev,
                warning: "Cache cleared successfully!"
            } : null);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setStorageInfo(prev => prev ? {
                    ...prev,
                    warning: undefined
                } : null);
            }, 3000);
        } catch (error) {
            console.error("Error clearing cache:", error);
            setLoadingProgress("");
            setStorageInfo(prev => prev ? {
                ...prev,
                warning: "Failed to clear cache"
            } : null);
        }
    };

    const handleSendMessage = async () => {
        const trimmedInput = inputValue?.trim() || '';
        console.log("Sending message!!!", trimmedInput)
        if (!trimmedInput) return;

        // Tokenize user input
        const { tokens, decodedTokens, tokenCount } = tokenizeText(trimmedInput);
        console.log("tokenized text", tokens)
        // Create user message with tokenization details
        const userMessage: AdvancedTokenizedMessage = {
            id: Date.now().toString(),
            content: trimmedInput,
            sender: 'user',
            timestamp: new Date(),
            tokens,
            tokenCount,
            decodedTokens,
            generationMethod: 'webllm-direct' // User input doesn't need generation, just mark as processed
        };

        setMessages(prev => [...prev, userMessage]);
        console.log("Set the message!")
        setInputValue(""); // Clear input immediately after sending
        setIsTyping(true);

        const botMessageId = (Date.now() + 1).toString();
        const initialBotMessage: AdvancedTokenizedMessage = {
            id: botMessageId,
            content: '', // Start with empty content
            sender: 'bot',
            timestamp: new Date(),
            tokens: [],
            tokenCount: 0,
            generationMethod: 'webllm-direct', // Start with a valid method to avoid error display
        };
        // Don't add empty bot message immediately - let typing indicator handle the loading state
        console.log("Starting bot response generation...")

        const onNewToken = (token: string) => {
            setMessages(prevMessages => {
                // Find existing bot message or create new one
                const existingBotIndex = prevMessages.findIndex(msg => msg.id === botMessageId);

                if (existingBotIndex >= 0) {
                    // Update existing message
                    return prevMessages.map(msg => {
                        if (msg.id === botMessageId) {
                            const newContent = msg.content + token;
                            const { tokens, decodedTokens, tokenCount } = tokenizeText(newContent);
                            return {
                                ...msg,
                                content: newContent,
                                tokens,
                                decodedTokens,
                                tokenCount,
                            };
                        }
                        return msg;
                    });
                } else {
                    // Create new bot message with first token
                    const { tokens, decodedTokens, tokenCount } = tokenizeText(token);
                    const newBotMessage: AdvancedTokenizedMessage = {
                        id: botMessageId,
                        content: token,
                        sender: 'bot',
                        timestamp: new Date(),
                        tokens,
                        decodedTokens,
                        tokenCount,
                        generationMethod: 'webllm-direct',
                    };
                    return [...prevMessages, newBotMessage];
                }
            });
        };

        const onProgress = (status: string) => {
            setLoadingProgress(status);
        };

        try {
            const { method, processingTime, contextUsed, complexityAnalysis } = await generateResponse(
                userMessage.content,
                onNewToken,
                onProgress
            );

            // After generation is complete, check if output completion is needed
            setMessages(prevMessages => {
                const updatedMessages = prevMessages.map(msg => {
                    if (msg.id === botMessageId) {
                        return {
                            ...msg,
                            generationMethod: method,
                            processingTime,
                            contextUsed,
                            complexityAnalysis: complexityAnalysis ? {
                                complexity: complexityAnalysis.complexity,
                                allocatedTokens: complexityAnalysis.allocatedTokens,
                                reasoning: complexityAnalysis.reasoning
                            } : undefined
                        };
                    }
                    return msg;
                });

                // Find the bot message to check for completion
                const botMessage = updatedMessages.find(msg => msg.id === botMessageId);
                if (botMessage && botMessage.content) {
                    // Perform output completion asynchronously
                    performOutputCompletion(botMessage, method, userMessage.content);
                }

                return updatedMessages;
            });
        } catch (error) {
            console.error('Error generating response:', error);
            const errorResponse = "I apologize, but I encountered an error processing your message. Please try again!";
            const { tokens: errorTokens, decodedTokens: errorDecodedTokens, tokenCount: errorTokenCount } = tokenizeText(errorResponse);

            const errorMessage: AdvancedTokenizedMessage = {
                id: (Date.now() + 1).toString(),
                content: errorResponse,
                sender: 'bot',
                timestamp: new Date(),
                tokens: errorTokens,
                tokenCount: errorTokenCount,
                decodedTokens: errorDecodedTokens,
                generationMethod: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
            setLoadingProgress("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Get current input token count
    const currentInputTokens = tokenizeText(inputValue);

    if (!isOpen) {
        const isPreloading = preloaderStatus.tokenizer === 'loading' || preloaderStatus.textGenerator === 'loading';
        const isPreloaded = preloaderStatus.tokenizer === 'ready' && preloaderStatus.textGenerator === 'ready';

        return (
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={onToggle}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 relative"
                    size="icon"
                    title={isPreloaded ? "AI Chat Ready (Pre-loaded)" : isPreloading ? "AI Chat Loading..." : "AI Chat"}
                >
                    {isPreloading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <Cpu className="w-6 h-6" />
                    )}

                    {/* Status indicator */}
                    {isPreloaded && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <CheckCircle className="w-2 h-2 text-white" />
                        </div>
                    )}
                    {isPreloading && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </Button>

                {/* Loading tooltip */}
                {isPreloading && (
                    <div className="absolute bottom-16 right-0 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Pre-loading AI models...
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className={cn(
            "fixed bottom-6 right-6 w-[450px] shadow-2xl border-blue-200 dark:border-blue-800 z-50 transition-all duration-300",
            isMinimized ? "h-16" : "h-[650px]"
        )}>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Cpu className="w-5 h-5" />
                        Advanced AI Chat
                        {(tokenizerStatus === 'loading') && <Loader2 className="w-4 h-4 animate-spin" />}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowTokenDetails(!showTokenDetails)}
                            className="w-8 h-8 text-white hover:bg-white/20"
                            title="Toggle token details"
                        >
                            <Code className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSettings(!showSettings)}
                            className="w-8 h-8 text-white hover:bg-white/20"
                            title="AI Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-8 h-8 text-white hover:bg-white/20"
                        >
                            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="w-8 h-8 text-white hover:bg-white/20"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                {!isMinimized && (
                    <div className="flex items-center gap-2 text-sm opacity-90 flex-wrap">
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            <Brain className="w-3 h-3 mr-1" />
                            {tokenizerStatus === 'ready' ? 'GPT-4 Tokenizer' :
                                tokenizerStatus === 'loading' ? 'Loading...' : 'Tokenizer Error'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            {webllmSupported ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                            {webllmSupported ? 'WebLLM Ready' : 'WebLLM Unsupported'}
                        </Badge>
                        {(() => {
                            const isPreloaded = preloaderStatus.textGenerator === 'ready';
                            const isPreloading = preloaderStatus.textGenerator === 'loading';

                            if (isPreloaded) {
                                return (
                                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-100 border-green-300/30">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Pre-loaded
                                    </Badge>
                                );
                            } else if (isPreloading) {
                                return (
                                    <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-100 border-yellow-300/30">
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Pre-loading...
                                    </Badge>
                                );
                            }
                            return null;
                        })()}
                        {useRAG && (
                            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                <Zap className="w-3 h-3 mr-1" />
                                RAG Enabled
                            </Badge>
                        )}
                    </div>
                )}
            </CardHeader>

            {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-[calc(100%-120px)]">
                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="p-4 border-b bg-muted/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">AI Model Selection</h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSettings(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {transformersSupported ? (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Choose AI Model</label>
                                        <Select value={selectedTransformersModel} onValueChange={setSelectedTransformersModel}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getAvailableTransformersModels().map(model => {
                                                    const info = getTransformersModelInfo(model);
                                                    return (
                                                        <SelectItem key={model} value={model}>
                                                            <div className="flex flex-col">
                                                                <span>{info.name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {info.size} - {info.description}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">RAG (Retrieval-Augmented Generation)</label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setUseRAG(!useRAG)}
                                            className="w-full justify-between"
                                        >
                                            <span>Use portfolio context</span>
                                            <Badge variant={useRAG ? "default" : "secondary"}>
                                                {useRAG ? "Enabled" : "Disabled"}
                                            </Badge>
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            When enabled, the AI uses Carlos's portfolio content to provide more accurate responses.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Adaptive Token Allocation</label>
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Brain className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm font-medium">Smart Response Length</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    Auto
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                The AI automatically adjusts response length based on your question's complexity:
                                            </p>
                                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                                <li>• <strong>Simple</strong> (150 tokens): Basic questions, greetings, definitions</li>
                                                <li>• <strong>Moderate</strong> (250 tokens): Standard explanations with context</li>
                                                <li>• <strong>Complex</strong> (400 tokens): Technical topics, code explanations</li>
                                                <li>• <strong>Detailed</strong> (600 tokens): Multi-part questions, comparisons, guides</li>
                                            </ul>
                                            <p className="text-xs text-muted-foreground mt-2 italic">
                                                Factors: question length, technical terms, explanation keywords, multiple topics
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Your browser doesn't support the required AI features. The chat will use fallback responses.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Status Alerts */}
                    {(tokenizerStatus !== 'ready' || !webllmSupported || loadingProgress) && (
                        <Alert className="m-4 mb-2">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                {loadingProgress ||
                                    (tokenizerStatus === 'loading' ? "Loading AI models and workspace data..." :
                                        !webllmSupported ? "WebLLM not supported. Using intelligent responses based on Carlos's portfolio content." :
                                            "Some AI features are unavailable.")}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Storage Warning */}
                    {storageInfo?.warning && (
                        <Alert className="m-4 mb-2" variant={storageInfo.warning.includes('Low storage') ? 'destructive' : 'default'}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {storageInfo.warning}
                                {storageInfo.warning.includes('Low storage') && (
                                    <span className="block mt-1 text-sm">
                                        💡 Don't worry! The chatbot will automatically use cloud AI for the best experience.
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div key={message.id} className="space-y-2">
                                    <div
                                        className={cn(
                                            "flex gap-3",
                                            message.sender === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {message.sender === 'bot' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <Cpu className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                                                message.sender === 'user'
                                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                                    : "bg-muted"
                                            )}
                                        >
                                            <div className="whitespace-pre-wrap">{message.content}</div>
                                            <div className={cn(
                                                "text-xs mt-1 opacity-70 flex items-center gap-2",
                                                message.sender === 'user' ? "text-white/70" : "text-muted-foreground"
                                            )}>
                                                <span>{message.tokenCount} tokens</span>
                                                {message.generationMethod && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {message.generationMethod === 'webllm-rag' ? '🧠 WebLLM+RAG' :
                                                            message.generationMethod === 'webllm-direct' ? '🤖 WebLLM' :
                                                                message.generationMethod === 'transformers-rag' ? '⚡ Transformers+RAG' :
                                                                    message.generationMethod === 'transformers-direct' ? '🔬 Transformers.js' :
                                                                        message.generationMethod === 'intelligent-fallback' ? '🎯 Smart Response' :
                                                                            message.generationMethod === 'simple-fallback' ? '📝 Basic Response' :
                                                                                '❌ Error'}
                                                    </Badge>
                                                )}
                                                {message.contextUsed && message.contextUsed.length > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        📚 {message.contextUsed.length} context
                                                    </Badge>
                                                )}
                                                {message.processingTime && (
                                                    <span>{message.processingTime}ms</span>
                                                )}
                                                {message.complexityAnalysis && (
                                                    <Badge variant="outline" className="text-xs">
                                                        🧠 {message.complexityAnalysis.complexity} ({message.complexityAnalysis.allocatedTokens}t)
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {message.sender === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Token breakdown details */}
                                    {showTokenDetails && message.decodedTokens && message.decodedTokens.length > 0 && (
                                        <div className={cn(
                                            "text-xs p-2 rounded border bg-muted/50 font-mono",
                                            message.sender === 'user' ? "ml-12" : "mr-12"
                                        )}>
                                            <div className="flex items-center gap-1 mb-1 text-muted-foreground">
                                                <ArrowRight className="w-3 h-3" />
                                                Token breakdown ({message.generationMethod}):
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {message.decodedTokens.slice(0, 20).map((token, idx) => (
                                                    <span key={idx} className="bg-background px-1 py-0.5 rounded border text-xs">
                                                        {token.replace(/\s/g, '·')}
                                                    </span>
                                                ))}
                                                {message.decodedTokens.length > 20 && (
                                                    <span className="text-muted-foreground">+{message.decodedTokens.length - 20} more</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Cpu className="w-4 h-4 text-white animate-pulse" />
                                    </div>
                                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {loadingProgress || "Generating AI response..."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t space-y-2">
                        <div className="flex gap-2">
                            <Textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything - I'll use AI generation + tokenization..."
                                className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                                disabled={isTyping}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputValue?.trim() || isTyping}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white self-end"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Live tokenization and complexity preview */}
                        {tokenizerStatus === 'ready' && inputValue?.trim() && (
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-3 h-3" />
                                    <span>{currentInputTokens.tokenCount} input tokens</span>
                                    {showTokenDetails && currentInputTokens.tokens.length > 0 && (
                                        <span className="font-mono">
                                            [{currentInputTokens.tokens.slice(0, 5).join(', ')}{currentInputTokens.tokens.length > 5 ? '...' : ''}]
                                        </span>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                        {webllmSupported || transformersSupported ? 'AI Ready' : 'Fallback Mode'}
                                    </Badge>
                                </div>
                                {(() => {
                                    const liveComplexity = analyzeInputComplexity(inputValue);
                                    return (
                                        <div className="flex items-center gap-2">
                                            <Brain className="w-3 h-3" />
                                            <span>Complexity: {liveComplexity.complexity}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                ~{liveComplexity.suggestedTokens} response tokens
                                            </Badge>
                                            {liveComplexity.reasoning && (
                                                <span className="opacity-70">({liveComplexity.reasoning})</span>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default AdvancedTokenizedChat;
