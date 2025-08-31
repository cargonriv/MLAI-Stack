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
import { AutoTokenizer } from "@huggingface/transformers";

// Define a type for the document chunks
interface DocumentChunk {
    id: string;
    filePath: string;
    chunkIndex: number;
    content: string;
    embedding: number[];
}

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
    const [workspaceDocuments, setWorkspaceDocuments] = useState<DocumentChunk[]>([]);
    const [showTokenDetails, setShowTokenDetails] = useState(false);
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
    // Initialize tokenizer
    // -----------------------------------------
    useEffect(() => {
        if (!isOpen || !mountedRef.current) return;

        const initializeModels = async () => {
            try {
                console.log('🤖 Loading tokenizer...');

                // Load tokenizer
                const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-4');
                if (!mountedRef.current) return;

                const testText = 'Hello! I can encode, decode, and generate text.';
                const testTokens = tokenizer.encode(testText);
                console.log('✅ Tokenizer loaded successfully!');
                console.log(`Test: "${testText}" → [${testTokens.join(', ')}] → ${testTokens.length} tokens`);

                tokenizerRef.current = tokenizer;
                setTokenizerStatus('ready');

            } catch (error) {
                console.error('❌ Failed to load tokenizer:', error);
                if (mountedRef.current) {
                    setTokenizerStatus('error');
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

        const timeoutId = setTimeout(initializeModels, 500);
        return () => clearTimeout(timeoutId);

    }, [isOpen]);

    // ---------------------------
    // Add/update welcome message
    // ---------------------------
    useEffect(() => {
        if (!isOpen || !tokenizerRef.current) return;

        // Check if welcome message exists
        const existingIndex = messages.findIndex(msg => msg.id === 'welcome-message');

        const welcomeText = `Hi! I'm your advanced AI assistant with GPT-4 tokenization capabilities. Ask me about his projects!`;

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
            generationMethod: "ai-generated",
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

    }, [isOpen, tokenizerStatus, messages]);



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

    const generateResponse = async (userMessage: string, onNewToken: (token: string) => void): Promise<{ method: 'ai-generated' | 'fallback' | 'error'; processingTime: number; }> => {
        const startTime = Date.now();

        try {
            console.log('🧠 Generating AI response...');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: userMessage,
                    use_rag: true,
                    max_context_chunks: 5,
                    similarity_threshold: 0.3
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend error:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get reader from response body');
            }

            const decoder = new TextDecoder();
            let buffer = ''; // This buffer holds incomplete data

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // Append new data to the buffer
                buffer += decoder.decode(value, { stream: true });
                
                let lastIndex = 0;
                let match;
                // Regex to find 'data: ' followed by content, until the next 'data: ' or end of string
                const regex = /data: (.*?)(?=data: |$)/g;

                while ((match = regex.exec(buffer)) !== null) {
                    const jsonString = match[1].trim();
                    if (jsonString) {
                        try {
                            const token = JSON.parse(jsonString);
                            onNewToken(token);
                        } catch (e) {
                            console.error("Error parsing JSON from SSE stream:", e, "Original string:", jsonString);
                        }
                    }
                    lastIndex = regex.lastIndex;
                }
                // Keep the unprocessed part of the buffer for the next iteration
                buffer = buffer.substring(lastIndex);
            }

            // After the loop, process any remaining data in the buffer.
            if (buffer.trim()) {
                try {
                    const token = JSON.parse(buffer.trim());
                    onNewToken(token);
                } catch (e) {
                    console.error("Error parsing final JSON from SSE stream:", e, "Original string:", buffer.trim());
                }
            }

            return {
                method: 'ai-generated',
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('AI generation failed:', error);
            return {
                method: 'error',
                processingTime: Date.now() - startTime
            };
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
            generationMethod: 'ai-generated' // User input doesn't need generation
        };

        setMessages(prev => [...prev, userMessage]);
        console.log("Set the message!")
        // setInputValue("");
        setIsTyping(true);

        const botMessageId = (Date.now() + 1).toString();
        const initialBotMessage: AdvancedTokenizedMessage = {
            id: botMessageId,
            content: '', // Start with empty content
            sender: 'bot',
            timestamp: new Date(),
            tokens: [],
            tokenCount: 0,
            generationMethod: 'ai-generated',
        };
        setMessages(prev => [...prev, initialBotMessage]);
        console.log("Set the inital bot message...")

        const onNewToken = (token: string) => {
            console.log("DEBUG: onNewToken received token:", token);
            setMessages(prevMessages => prevMessages.map(msg => {
                if (msg.id === botMessageId) {
                    const newContent = msg.content + token;
                    console.log("DEBUG: newContent in onNewToken:", newContent);
                    const { tokens, decodedTokens, tokenCount } = tokenizeText(newContent);
                    return {
                        ...msg,
                        content: newContent,
                        tokens,
                        decodedTokens,
                        tokenCount,
                    };
                }
                console.log("DEBUG: msg not matching botMessageId:", msg);
                return msg;
            }));
        };

        try {
            const { method, processingTime } = await generateResponse(userMessage.content, onNewToken);

            // After generation is complete, update the final message details
            setMessages(prevMessages => prevMessages.map(msg => {
                if (msg.id === botMessageId) {
                    return {
                        ...msg,
                        generationMethod: method,
                        processingTime,
                    };
                }
                return msg;
            }));
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
                            AI Ready
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
                    {
                        (tokenizerStatus !== 'ready') && (
                        <Alert className="m-4 mb-2">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                {tokenizerStatus === 'loading'
                                    ? "Loading AI models and workspace data... This may take a moment for the first time."
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
                                    AI Ready
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
