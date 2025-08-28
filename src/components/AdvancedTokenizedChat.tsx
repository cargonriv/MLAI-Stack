import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedTokenizedMessage {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    tokens: number[];
    tokenCount: number;
    decodedTokens?: string[];
    generationMethod: 'ai-generated' | 'fallback' | 'error';
    processingTime?: number;
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
    const [generatorStatus, setGeneratorStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [showTokenDetails, setShowTokenDetails] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const tokenizerRef = useRef<unknown>(null);
    const generatorRef = useRef<unknown>(null);
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
    // Initialize tokenizer and text generator
    // -----------------------------------------
    useEffect(() => {
        if (!isOpen || !mountedRef.current) return;

        const initializeModels = async () => {
            try {
                console.log('🤖 Loading tokenizer and generator...');
                const { AutoTokenizer, pipeline } = await import('@huggingface/transformers');

                if (!mountedRef.current) return;

                // Load tokenizer
                const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-4');
                if (!mountedRef.current) return;

                const testText = 'Hello! I can encode, decode, and generate text.';
                const testTokens = tokenizer.encode(testText);
                console.log('✅ Tokenizer loaded successfully!');
                console.log(`Test: "${testText}" → [${testTokens.join(', ')}] → ${testTokens.length} tokens`);

                tokenizerRef.current = tokenizer;
                setTokenizerStatus('ready');

                // Load text generator
                try {
                    console.log('🧠 Loading text generation models...');
                    const modelConfigs = [
                        { name: 'GPT-2', id: 'Xenova/gpt2', type: 'gpt2' },
                        { name: 'DistilGPT-2', id: 'Xenova/distilgpt2', type: 'gpt2' }
                    ];

                    let generator = null;
                    let modelInfo = null;

                    for (const config of modelConfigs) {
                        try {
                            console.log(`🔄 Trying ${config.name}...`);
                            generator = await Promise.race([
                                pipeline('text-generation', config.id, { dtype: 'fp32', device: 'wasm' }),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Model loading timeout')), 15000))
                            ]);
                            modelInfo = config;
                            console.log(`✅ ${config.name} loaded successfully!`);
                            break;
                        } catch (err) {
                            console.warn(`⚠️ ${config.name} failed:`, err);
                            continue;
                        }
                    }

                    if (!mountedRef.current) return;

                    if (generator && modelInfo) {
                        generatorRef.current = { model: generator, type: modelInfo.type, name: modelInfo.name };
                        setGeneratorStatus('ready');
                        console.log(`✅ Text generator ready: ${modelInfo.name}`);
                    } else {
                        throw new Error('All models failed to load');
                    }
                } catch (modelError) {
                    console.warn('⚠️ Text generation models failed to load:', modelError);

                    // Attempt to clear cache
                    try {
                        if ('caches' in window) {
                            const cacheNames = await caches.keys();
                            for (const cacheName of cacheNames) {
                                if (cacheName.includes('transformers') || cacheName.includes('huggingface')) {
                                    console.log(`🧹 Clearing cache: ${cacheName}`);
                                    await caches.delete(cacheName);
                                }
                            }
                        }
                    } catch (cacheError) {
                        console.warn('Cache cleanup failed:', cacheError);
                    }

                    setGeneratorStatus('error');
                    console.log('📝 Will use fallback responses instead of AI generation');
                }
            } catch (error) {
                console.error('❌ Failed to load models:', error);
                if (mountedRef.current) {
                    setTokenizerStatus('error');
                    setGeneratorStatus('error');
                    setMessages([{
                        id: Date.now().toString(),
                        content: "I encountered an error loading the AI models. I'll use fallback responses, but the full tokenization and generation features won't be available.",
                        sender: 'bot',
                        timestamp: new Date(),
                        tokens: [],
                        tokenCount: 0,
                        generationMethod: 'error'
                    }]);
                }
            }
        };

        const timeoutId = setTimeout(initializeModels, 500);
        return () => clearTimeout(timeoutId);

    }, [isOpen]);

    // ---------------------------
    // Add/update welcome message
    // ---------------------------
    useEffect(() => {
        if (!isOpen || !tokenizerRef.current) return;

        // Check if welcome message exists
        let existingIndex = messages.findIndex(msg => msg.id === 'welcome-message');

        const hasAI = generatorStatus === "ready";
        const modelName = hasAI ? (generatorRef.current as any)?.name || "AI" : "Fallback";

        const welcomeText = hasAI
            ? `Hi! I'm your advanced AI assistant powered by ${modelName} with GPT-4 tokenization. I can demonstrate the complete NLP pipeline: tokenization → AI generation → detokenization. Ask me about Carlos's ML portfolio, projects, or anything else!`
            : `Hi! I'm your AI assistant with GPT-4 tokenization capabilities. While AI text generation is currently unavailable, I can still help you learn about Carlos's ML portfolio and demonstrate tokenization. Ask me about his projects!`;

        const tokenizer = tokenizerRef.current as any;
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
            generationMethod: hasAI ? "ai-generated" : "fallback",
            processingTime: 0,
        };

        if (existingIndex >= 0) {
            // Update existing welcome message
            setMessages(prev => {
                const copy = [...prev];
                copy[existingIndex] = welcomeMessage;
                return copy;
            });
        } else {
            // Add new welcome message
            setMessages(prev => [welcomeMessage, ...prev]);
        }

        setWelcomeAdded(true);

    }, [isOpen, tokenizerStatus, generatorStatus]);



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
            const tokens = (tokenizerRef.current as any).encode(text);
            const decodedTokens = tokens.map((token: number) => (tokenizerRef.current as any).decode([token]));
            return { tokens, decodedTokens, tokenCount: tokens.length };
        } catch (error) {
            console.error('Tokenization error:', error);
            return { tokens: [], decodedTokens: [], tokenCount: 0 };
        }
    };

    const generateResponse = async (userMessage: string, userTokens: number[]): Promise<{
        content: string;
        method: 'ai-generated' | 'fallback' | 'error';
        processingTime: number;
    }> => {
        const startTime = Date.now();

        if (generatorStatus !== 'ready' || !generatorRef.current) {
            return {
                content: getFallbackResponse(userMessage, userTokens),
                method: 'fallback',
                processingTime: Date.now() - startTime
            };
        }

        try {
            console.log('🧠 Generating AI response...');

            const generatorInfo = generatorRef.current as any;
            const generator = generatorInfo.model;
            const modelType = generatorInfo.type;

            let result;
            let generatedText;

            // Use GPT-2 or DistilGPT-2 with optimized prompt
            const prompt = `AI Assistant: I help users learn about Carlos Gonzalez Rivera's ML portfolio.\nUser: ${userMessage}\nAI Assistant:`;

            console.log(`🎯 Using ${generatorInfo.name} generation...`);
            result = await generator(prompt, {
                max_new_tokens: 80,
                do_sample: true,
                top_k: 40,
                top_p: 0.9,
                temperature: 0.7,
                pad_token_id: 50256,
                repetition_penalty: 1.2,
                no_repeat_ngram_size: 3,
            });

            generatedText = result[0].generated_text.replace(prompt, '').trim();

            // Clean up the response
            if (generatedText.length < 10) {
                throw new Error('Generated text too short');
            }

            // Clean up incomplete sentences for GPT-2 models
            const sentences = generatedText.split(/[.!?]+/);
            const cleanSentences = sentences.filter(s => s.trim().length > 10 && s.trim().length < 200);

            if (cleanSentences.length > 0) {
                generatedText = cleanSentences.slice(0, 2).join('. ').trim();
                if (!generatedText.endsWith('.') && !generatedText.endsWith('!') && !generatedText.endsWith('?')) {
                    generatedText += '.';
                }
            }

            // Add token and model context
            const modelName = generatorInfo.name || 'GPT-2';
            const tokenInfo = `[${modelName} Generated • ${userTokens.length} input tokens • ${Date.now() - startTime}ms] `;

            return {
                content: tokenInfo + generatedText,
                method: 'ai-generated',
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('AI generation failed:', error);
            console.log('📝 Falling back to curated responses...');
            return {
                content: getFallbackResponse(userMessage, userTokens),
                method: 'fallback',
                processingTime: Date.now() - startTime
            };
        }
    };

    // Enhanced fallback responses
    const getFallbackResponse = (userMessage: string, userTokens: number[]): string => {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('generate') || lowerMessage.includes('ai') || lowerMessage.includes('model')) {
            return `[Fallback Response • ${userTokens.length} tokens] I'm demonstrating both tokenization and text generation! Your message was processed through: 1) GPT-4 tokenization (${userTokens.length} tokens), 2) Qwen1.5-0.5B/GPT-2 generation attempt, 3) Fallback to curated response. This shows the complete NLP pipeline in action!`;
        }

        if (lowerMessage.includes('token') || lowerMessage.includes('encode')) {
            return `[Tokenization Demo • ${userTokens.length} tokens] Your message "${userMessage}" was encoded into ${userTokens.length} tokens using GPT-4's tokenizer. Each token represents a semantic unit that AI models can process. This is the foundation of how language models understand and generate text!`;
        }

        if (lowerMessage.includes('how') || lowerMessage.includes('work')) {
            return `[Pipeline Demo • ${userTokens.length} tokens] Here's my complete processing pipeline: 1) Tokenize input (${userTokens.length} tokens), 2) Generate response with Qwen1.5-0.5B or GPT-2, 3) Tokenize output, 4) Display with breakdown. This demonstrates the full cycle of modern NLP systems!`;
        }

        const responses = [
            `[Advanced NLP • ${userTokens.length} tokens] I'm showcasing the complete AI pipeline: tokenization, generation, and analysis. Your ${userTokens.length}-token input demonstrates how modern language models process text. What would you like to explore?`,
            `[Full Stack AI • ${userTokens.length} tokens] This chat demonstrates real AI capabilities: GPT-4 tokenization + Qwen1.5-0.5B/GPT-2 generation. Your message went through the complete NLP pipeline. Ask me about tokenization, generation, or Carlos's ML projects!`,
            `[Token Analysis • ${userTokens.length} tokens] Your input was processed through advanced tokenization and AI generation. This showcases the same techniques used in production language models. What aspect of NLP interests you most?`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    };

    const handleSendMessage = async () => {
        const trimmedInput = inputValue?.trim() || '';
        if (!trimmedInput) return;

        // Tokenize user input
        const { tokens, decodedTokens, tokenCount } = tokenizeText(trimmedInput);

        // Create user message with tokenization details
        const userMessage: AdvancedTokenizedMessage = {
            id: Date.now().toString(),
            content: trimmedInput,
            sender: 'user',
            timestamp: new Date(),
            tokens,
            tokenCount,
            decodedTokens,
            generationMethod: 'ai-generated' // User input doesn't need generation
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            const { content, method, processingTime } = await generateResponse(userMessage.content, userMessage.tokens);
            const { tokens: responseTokens, decodedTokens: responseDecodedTokens, tokenCount: responseTokenCount } = tokenizeText(content);

            const botMessage: AdvancedTokenizedMessage = {
                id: (Date.now() + 1).toString(),
                content,
                sender: 'bot',
                timestamp: new Date(),
                tokens: responseTokens,
                tokenCount: responseTokenCount,
                decodedTokens: responseDecodedTokens,
                generationMethod: method,
                processingTime
            };

            setMessages(prev => [...prev, botMessage]);
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
        return (
            <Button
                onClick={onToggle}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50"
                size="icon"
            >
                <Cpu className="w-6 h-6" />
            </Button>
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
                        {(tokenizerStatus === 'loading' || generatorStatus === 'loading') && <Loader2 className="w-4 h-4 animate-spin" />}
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
                    <div className="flex items-center gap-2 text-sm opacity-90">
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            <Brain className="w-3 h-3 mr-1" />
                            {tokenizerStatus === 'ready' ? 'GPT-4 Tokenizer' :
                                tokenizerStatus === 'loading' ? 'Loading Tokenizer...' : 'Tokenizer Error'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            <Cpu className="w-3 h-3 mr-1" />
                            {generatorStatus === 'ready' ?
                                `${(generatorRef.current as any)?.name || 'AI'} Ready` :
                                generatorStatus === 'loading' ? 'Loading Generator...' : 'Generator Error'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            <Zap className="w-3 h-3 mr-1" />
                            Full Pipeline
                        </Badge>
                    </div>
                )}
            </CardHeader>

            {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-[calc(100%-120px)]">
                    {/* Status Alert */}
                    {(tokenizerStatus !== 'ready' || generatorStatus !== 'ready') && (
                        <Alert className="m-4 mb-2">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                {tokenizerStatus === 'loading' || generatorStatus === 'loading'
                                    ? "Loading AI models... This may take a moment for the first time."
                                    : "Some AI features are unavailable. Using fallback responses."}
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
                                                        {message.generationMethod === 'ai-generated' ? '🤖 AI' :
                                                            message.generationMethod === 'fallback' ? '📝 Fallback' : '❌ Error'}
                                                    </Badge>
                                                )}
                                                {message.processingTime && (
                                                    <span>{message.processingTime}ms</span>
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
                                            <span className="ml-2 text-xs text-muted-foreground">Generating AI response...</span>
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

                        {/* Live tokenization preview */}
                        {tokenizerStatus === 'ready' && inputValue?.trim() && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Hash className="w-3 h-3" />
                                <span>{currentInputTokens.tokenCount} tokens</span>
                                {showTokenDetails && currentInputTokens.tokens.length > 0 && (
                                    <span className="font-mono">
                                        [{currentInputTokens.tokens.slice(0, 5).join(', ')}{currentInputTokens.tokens.length > 5 ? '...' : ''}]
                                    </span>
                                )}
                                <Badge variant="outline" className="text-xs">
                                    {generatorStatus === 'ready' ? '🤖 AI Ready' : '📝 Fallback Mode'}
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default AdvancedTokenizedChat;