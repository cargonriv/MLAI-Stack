
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
    Cpu,
    Info,
    Settings,
    CheckCircle,
    AlertCircle,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config/environment";

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    generationMethod: 'api' | 'error';
    processingTime?: number;
}

interface AdvancedTokenizedChatProps {
    isOpen: boolean;
    onToggle: () => void;
}

const ensureCompleteSentence = (text: string): string => {
    if (!text) {
        return text;
    }
    const lastPunctuationIndex = Math.max(
        text.lastIndexOf('.'),
        text.lastIndexOf('!'),
        text.lastIndexOf('?')
    );

    if (lastPunctuationIndex !== -1) {
        return text.substring(0, lastPunctuationIndex + 1).trim();
    }
    
    return text;
};

const AdvancedTokenizedChat = ({ isOpen, onToggle }: AdvancedTokenizedChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && !messages.length) {
            const welcomeMessage: Message = {
                id: 'welcome-message',
                content: "Hi! I'm an AI assistant powered by a server-hosted model. Ask me anything!",
                sender: 'bot',
                timestamp: new Date(),
                generationMethod: 'api',
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length]);

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

    const handleSendMessage = async () => {
        const trimmedInput = inputValue?.trim() || '';
        if (!trimmedInput) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: trimmedInput,
            sender: 'user',
            timestamp: new Date(),
            generationMethod: 'api',
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);
        setError(null);

        const botMessageId = (Date.now() + 1).toString();

        // Add a placeholder for the bot's response
        const botPlaceholder: Message = {
            id: botMessageId,
            content: "",
            sender: 'bot',
            timestamp: new Date(),
            generationMethod: 'api',
        };
        setMessages(prev => [...prev, botPlaceholder]);

        try {
            const response = await fetch('https://cargonriv-chatbot-backend.hf.space/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: trimmedInput }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Failed to get readable stream from response.");
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    setIsTyping(false);
                    
                    // Post-process the final message to ensure it ends with a complete sentence.
                    setMessages(prevMessages => {
                        const newMessages = [...prevMessages];
                        const finalBotMessageIndex = newMessages.findIndex(msg => msg.id === botMessageId);
                        if (finalBotMessageIndex !== -1) {
                            const finalContent = newMessages[finalBotMessageIndex].content;
                            newMessages[finalBotMessageIndex].content = ensureCompleteSentence(finalContent);
                        }
                        return newMessages;
                    });

                    break;
                }
                buffer += decoder.decode(value, { stream: true });

                // The backend sends SSE events separated by double newlines.
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || ""; // The last part might be incomplete.

                for (const part of parts) {
                    if (part.startsWith("data:")) {
                        const jsonString = part.substring(5).trim();
                        if (jsonString) {
                            try {
                                const jsonChunk = JSON.parse(jsonString);
                                if (jsonChunk.response) {
                                    setMessages(prevMessages =>
                                        prevMessages.map(msg =>
                                            msg.id === botMessageId
                                                ? { ...msg, content: msg.content + jsonChunk.response, processingTime: jsonChunk.processing_time }
                                                : msg
                                        )
                                    );
                                }
                            } catch (e) {
                                console.warn("Could not parse JSON chunk:", jsonString, e);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            setError(`Failed to connect to the AI server: ${err.message || 'network error'}. Please ensure it's running.`);
            setIsTyping(false);
            // Remove the placeholder on error
            setMessages(prev => prev.filter(msg => msg.id !== botMessageId));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-4 right-4 mobile:bottom-3 mobile:right-3 z-50">
                <Button
                    onClick={onToggle}
                    className="w-14 h-14 mobile:w-12 mobile:h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 relative touch:active:scale-95"
                    size="icon"
                    title="AI Chat"
                >
                    <Cpu className="w-6 h-6 mobile:w-5 mobile:h-5" />
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(
            "fixed bottom-4 right-4 w-[450px] h-[650px] shadow-2xl border-blue-200 dark:border-blue-800 z-50 transition-all duration-300 flex flex-col",
            "mobile:bottom-0 mobile:right-0 mobile:left-0 mobile:top-0 mobile:w-full mobile:h-full mobile:rounded-none",
            isMinimized ? "h-16 mobile:h-16" : "h-[650px] mobile:h-[100svh]"
        )}>
            <Card className="w-full h-full flex flex-col">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg mobile:rounded-none mobile:pb-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg mobile:text-base mobile:gap-1">
                            <Cpu className="w-5 h-5" />
                            AI Chat
                        </CardTitle>
                        <div className="flex items-center gap-1 mobile:gap-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="w-9 h-9 text-white hover:bg-white/20 touch:active:scale-95 mobile:hidden"
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggle}
                                className="w-9 h-9 text-white hover:bg-white/20 touch:active:scale-95"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {!isMinimized && (
                    <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                        <div className="flex-1 flex flex-col min-h-0">
                            {error && (
                                <Alert variant="destructive" className="m-4 mb-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 p-4 mobile:p-3">
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
                                                        "max-w-[85%] mobile:max-w-[90%] rounded-lg px-3 py-2 mobile:px-2 mobile:py-1.5 text-sm mobile:text-base",
                                                        message.sender === 'user'
                                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                                            : "bg-muted"
                                                    )}
                                                >
                                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                                    {message.sender === 'bot' && message.processingTime && (
                                                        <div className="text-xs mt-1 opacity-70 text-muted-foreground">
                                                            <span>{message.processingTime} seconds</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {message.sender === 'user' && (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
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
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="p-4 mobile:p-3 border-t space-y-2 mobile:space-y-1.5 flex-shrink-0">
                            <div className="flex gap-2 mobile:gap-1.5 items-end">
                                <Textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    className="flex-1 min-h-[44px] max-h-[120px] mobile:text-base resize-none"
                                    disabled={isTyping}
                                    rows={1}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue?.trim() || isTyping}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-11 h-11 mobile:w-12 mobile:h-12 flex-shrink-0 touch:active:scale-95"
                                    size="icon"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export default AdvancedTokenizedChat;
