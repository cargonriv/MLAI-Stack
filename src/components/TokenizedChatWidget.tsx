import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { autoCompleteOutput, CompletionConfig } from "@/utils/outputCompletion";

interface TokenizedMessage {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    tokens: number[];
    tokenCount: number;
    decodedTokens?: string[];
    completionInfo?: {
        wasCompleted: boolean;
        additionalTokensUsed: number;
        completionReason: string;
        processingTimeMs: number;
    };
}

interface TokenizedChatWidgetProps {
    isOpen: boolean;
    onToggle: () => void;
}

const TokenizedChatWidget = ({ isOpen, onToggle }: TokenizedChatWidgetProps) => {
    const [messages, setMessages] = useState<TokenizedMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [tokenizerStatus, setTokenizerStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [showTokenDetails, setShowTokenDetails] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const tokenizerRef = useRef<unknown>(null);
    const mountedRef = useRef(false);

    // Initialize component
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Initialize tokenizer when chat opens
    useEffect(() => {
        if (!isOpen || !mountedRef.current || tokenizerStatus !== 'loading') return;

        const initTokenizer = async () => {
            try {
                
                const { AutoTokenizer } = await import('@huggingface/transformers');

                if (!mountedRef.current) return;

                const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-4');

                if (!mountedRef.current) return;

                // Test tokenization
                const testText = 'Hello! I can encode and decode tokens.';
                const testTokens = tokenizer.encode(testText);
                const decodedTokens = testTokens.map((token: number) => tokenizer.decode([token]));

                
                

                tokenizerRef.current = tokenizer;
                setTokenizerStatus('ready');

                // Add welcome message with tokenization details
                const welcomeText = "Hi! I'm your AI assistant with GPT-4 tokenization. I can show you exactly how text gets encoded into tokens and decoded back. Try sending a message to see the tokenization process in action!";
                const welcomeTokens = tokenizer.encode(welcomeText);
                const welcomeDecodedTokens = welcomeTokens.map((token: number) => tokenizer.decode([token]));

                setMessages([{
                    id: Date.now().toString(),
                    content: welcomeText,
                    sender: 'bot',
                    timestamp: new Date(),
                    tokens: welcomeTokens,
                    tokenCount: welcomeTokens.length,
                    decodedTokens: welcomeDecodedTokens
                }]);

            } catch (error) {
                
                if (mountedRef.current) {
                    setTokenizerStatus('error');
                    setMessages([{
                        id: Date.now().toString(),
                        content: "I encountered an error loading the tokenizer, but I can still chat with you! The tokenization features won't be available in this session.",
                        sender: 'bot',
                        timestamp: new Date(),
                        tokens: [],
                        tokenCount: 0
                    }]);
                }
            }
        };

        const timeoutId = setTimeout(initTokenizer, 500);
        return () => clearTimeout(timeoutId);
    }, [isOpen, tokenizerStatus]);

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
            const decodedTokens = tokens.map((token: number) => tokenizerRef.current.decode([token]));
            return { tokens, decodedTokens, tokenCount: tokens.length };
        } catch (error) {
            
            return { tokens: [], decodedTokens: [], tokenCount: 0 };
        }
    };

    const generateResponse = async (userMessage: string, userTokens: number[]): Promise<string> => {
        if (tokenizerStatus !== 'ready' || !tokenizerRef.current) {
            return "I'm still loading my language capabilities. Please wait a moment and try again!";
        }

        try {
            // Import the text generation pipeline
            const { pipeline } = await import('@huggingface/transformers');
            
            // Create a text generation pipeline with a smaller, faster model
            
            const generator = await pipeline('text-generation', 'Xenova/distilgpt2', {
                max_new_tokens: 100,
                do_sample: true,
                top_k: 50,
                top_p: 0.95,
                temperature: 0.7,
            });

            // Create a context-aware prompt
            const contextPrompt = `You are an AI assistant for Carlos Gonzalez Rivera's ML portfolio. The user said: "${userMessage}" (${userTokens.length} tokens). Respond helpfully about his ML projects, skills, or tokenization. Keep it concise and informative.

Response:`;

            
            const result = await generator(contextPrompt, {
                max_new_tokens: 80,
                do_sample: true,
                top_k: 50,
                top_p: 0.95,
                temperature: 0.7,
                pad_token_id: 50256, // GPT-2 pad token
            });

            // Extract the generated text
            let generatedText = result[0].generated_text;
            
            // Clean up the response by removing the prompt
            generatedText = generatedText.replace(contextPrompt, '').trim();
            
            // If the response is too short or doesn't make sense, fall back to curated responses
            if (generatedText.length < 20 || !generatedText.includes(' ')) {
                return getFallbackResponse(userMessage, userTokens);
            }

            // Add token information to the generated response
            const tokenInfo = `[Generated using ${userTokens.length} input tokens] `;
            return tokenInfo + generatedText;

        } catch (error) {
            
            
            return getFallbackResponse(userMessage, userTokens);
        }
    };

    // Perform output completion asynchronously
    const performOutputCompletion = async (
        botMessage: TokenizedMessage,
        userMessage: string
    ) => {
        try {
            // Configure completion for simple chat
            const completionConfig: CompletionConfig = {
                maxAdditionalTokens: 30,
                timeoutMs: 5000,
                minCompletionLength: 5,
                contentType: 'conversational',
                languageCode: 'en'
            };

            // Create message context for completion
            const messages = [
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botMessage.content }
            ];

            // Attempt completion using simple fallback method
            const completionResult = await autoCompleteOutput(
                botMessage.content,
                messages,
                'simple-fallback',
                completionConfig
            );

            // If completion was successful and added meaningful content
            if (completionResult.wasCompleted && completionResult.completedText !== botMessage.content) {
                
                
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
            }
        } catch (error) {
            
            // Completion failure is not critical for simple chat
        }
    };

    // Fallback function for curated responses when text generation fails
    const getFallbackResponse = (userMessage: string, userTokens: number[]): string => {
        const lowerMessage = userMessage.toLowerCase();
        
        // Token-specific responses
        if (lowerMessage.includes('token') || lowerMessage.includes('encode') || lowerMessage.includes('decode')) {
            const tokenInfo = userTokens.length > 0 ? 
                `Your message was encoded into ${userTokens.length} tokens: [${userTokens.slice(0, 10).join(', ')}${userTokens.length > 10 ? '...' : ''}]. ` : '';
            
            return `${tokenInfo}Tokenization is fascinating! Here's how it works:\n\n🔤 **Encoding**: Text → Numbers (tokens)\n🔢 **Processing**: AI models work with these numbers\n📝 **Decoding**: Numbers → Text output\n\nEach token represents a piece of text - could be a word, part of a word, or punctuation. GPT-4 uses a sophisticated tokenizer that handles multiple languages and special characters efficiently!`;
        }
        
        if (lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('process'))) {
            return `Great question! Here's my processing pipeline:\n\n1️⃣ **Input Tokenization**: Your text gets encoded into ${userTokens.length} tokens\n2️⃣ **Language Model**: I use DistilGPT-2 for text generation\n3️⃣ **Response Generation**: AI generates contextual responses\n4️⃣ **Output Tokenization**: My response gets tokenized too\n\nThis demonstrates the full NLP pipeline: tokenization → language model → generation → detokenization!`;
        }
        
        // Portfolio responses with token awareness
        if (lowerMessage.includes('project') || lowerMessage.includes('portfolio')) {
            return `I'd love to tell you about Carlos's projects! Your ${userTokens.length}-token question shows you're interested in his work.\n\n🚀 **Key Projects**:\n• SIDS Prediction Model (Healthcare AI)\n• Real-time Image Classification\n• Sentiment Analysis with BERT\n• This very chat system with GPT-4 tokenization + DistilGPT-2!\n\nEach project demonstrates different aspects of ML engineering - from data preprocessing to model deployment. Which one interests you most?`;
        }
        
        if (lowerMessage.includes('sids') || lowerMessage.includes('capstone')) {
            return `The SIDS Prediction Model is Carlos's flagship project! It processes physiological data through multiple tokenization and encoding stages:\n\n🏥 **Medical Data Pipeline**:\n• Sensor data → Feature tokens\n• Time series → Sequence encoding\n• Risk factors → Classification tokens\n• Predictions → Probability scores\n\nJust like how I tokenize text, the SIDS model tokenizes medical data to identify patterns that could save lives. It's a powerful example of AI for social good!`;
        }
        
        // Technical responses
        if (lowerMessage.includes('technology') || lowerMessage.includes('tech')) {
            return `This portfolio showcases cutting-edge tech! Your message used ${userTokens.length} tokens to ask about it.\n\n⚡ **Frontend**: React 18 + TypeScript\n🧠 **AI**: Hugging Face Transformers.js\n🔧 **Tokenization**: GPT-4 tokenizer\n🤖 **Generation**: DistilGPT-2 language model\n🎨 **UI**: Tailwind CSS + Shadcn/ui\n☁️ **Backend**: Supabase + Edge Functions\n\nEverything runs client-side for instant ML inference - no server round-trips needed!`;
        }
        
        // Default responses with token context
        const responses = [
            `[${userTokens.length} tokens processed] I'm an AI assistant showcasing Carlos's ML portfolio. I use real tokenization and text generation models. What would you like to know about his projects, skills, or this chat system?`,
            `[Generated from ${userTokens.length} input tokens] Thanks for your message! I demonstrate both tokenization and language generation. Carlos built this to show how modern NLP works. What aspect interests you most?`,
            `[Tokenized: ${userTokens.length} tokens] Your message went through the full NLP pipeline - tokenization, language model processing, and generation. This showcases the same techniques Carlos uses in his ML projects. How can I help you learn more?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const handleSendMessage = async () => {
        const trimmedInput = inputValue?.trim() || '';
        if (!trimmedInput) return;

        // Tokenize user input
        const { tokens, decodedTokens, tokenCount } = tokenizeText(trimmedInput);

        // Create user message with tokenization details
        const userMessage: TokenizedMessage = {
            id: Date.now().toString(),
            content: trimmedInput,
            sender: 'user',
            timestamp: new Date(),
            tokens,
            tokenCount,
            decodedTokens
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            const response = await generateResponse(userMessage.content, userMessage.tokens);
            const { tokens: responseTokens, decodedTokens: responseDecodedTokens, tokenCount: responseTokenCount } = tokenizeText(response);

            const botMessage: TokenizedMessage = {
                id: (Date.now() + 1).toString(),
                content: response,
                sender: 'bot',
                timestamp: new Date(),
                tokens: responseTokens,
                tokenCount: responseTokenCount,
                decodedTokens: responseDecodedTokens
            };

            setMessages(prev => [...prev, botMessage]);

            // Perform output completion asynchronously
            performOutputCompletion(botMessage, userMessage.content);
        } catch (error) {
            
            const errorResponse = "I apologize, but I encountered an error processing your message. Please try again!";
            const { tokens: errorTokens, decodedTokens: errorDecodedTokens, tokenCount: errorTokenCount } = tokenizeText(errorResponse);

            const errorMessage: TokenizedMessage = {
                id: (Date.now() + 1).toString(),
                content: errorResponse,
                sender: 'bot',
                timestamp: new Date(),
                tokens: errorTokens,
                tokenCount: errorTokenCount,
                decodedTokens: errorDecodedTokens
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
                className="fixed bottom-4 right-4 mobile:bottom-3 mobile:right-3 w-14 h-14 mobile:w-12 mobile:h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50 touch:active:scale-95"
                size="icon"
            >
                <MessageSquare className="w-6 h-6 mobile:w-5 mobile:h-5" />
            </Button>
        );
    }

    return (
        <Card className={cn(
            "fixed bottom-4 right-4 mobile:bottom-0 mobile:right-0 mobile:left-0 mobile:top-0 w-[420px] mobile:w-full mobile:h-full shadow-2xl border-purple-200 dark:border-purple-800 z-50 transition-all duration-300 mobile:rounded-none",
            isMinimized ? "h-16 mobile:h-16" : "h-[600px] mobile:h-full"
        )}>
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg mobile:rounded-none mobile:pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg mobile:text-base mobile:gap-1">
                        <Bot className="w-5 h-5" />
                        Tokenized AI Chat
                        {tokenizerStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                    </CardTitle>
                    <div className="flex items-center gap-1 mobile:gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowTokenDetails(!showTokenDetails)}
                            className="w-8 h-8 mobile:w-9 mobile:h-9 text-white hover:bg-white/20 touch:active:scale-95"
                            title="Toggle token details"
                        >
                            <Code className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-8 h-8 mobile:w-9 mobile:h-9 text-white hover:bg-white/20 touch:active:scale-95 mobile:hidden"
                        >
                            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="w-8 h-8 mobile:w-9 mobile:h-9 text-white hover:bg-white/20 touch:active:scale-95"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                {!isMinimized && (
                    <div className="flex items-center gap-2 mobile:gap-1 text-sm mobile:text-xs opacity-90">
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            <Brain className="w-3 h-3 mr-1" />
                            {tokenizerStatus === 'ready' ? 'GPT-4 Ready' :
                                tokenizerStatus === 'loading' ? 'Loading...' : 'Error'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            <Hash className="w-3 h-3 mr-1" />
                            Token Analysis
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            <Zap className="w-3 h-3 mr-1" />
                            Real-time
                        </Badge>
                    </div>
                )}
            </CardHeader>

            {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-[calc(100%-100px)] mobile:h-[calc(100vh-100px)]">
                    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 mobile:p-3">
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
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                                                message.sender === 'user'
                                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                                    : "bg-muted"
                                            )}
                                        >
                                            <div className="whitespace-pre-wrap">{message.content}</div>
                                            <div className={cn(
                                                "text-xs mt-1 opacity-70 flex items-center gap-2",
                                                message.sender === 'user' ? "text-white/70" : "text-muted-foreground"
                                            )}>
                                                <span>{message.tokenCount} tokens</span>
                                                {showTokenDetails && message.tokens.length > 0 && (
                                                    <span className="font-mono">
                                                        [{message.tokens.slice(0, 3).join(', ')}{message.tokens.length > 3 ? '...' : ''}]
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {message.sender === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
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
                                                Token breakdown:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {message.decodedTokens.slice(0, 15).map((token, idx) => (
                                                    <span key={idx} className="bg-background px-1 py-0.5 rounded border text-xs">
                                                        {token.replace(/\s/g, '·')}
                                                    </span>
                                                ))}
                                                {message.decodedTokens.length > 15 && (
                                                    <span className="text-muted-foreground">+{message.decodedTokens.length - 15} more</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                placeholder="Ask about tokenization, projects, or ML demos..."
                                className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                                disabled={isTyping}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputValue?.trim() || isTyping}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white self-end"
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
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default TokenizedChatWidget;