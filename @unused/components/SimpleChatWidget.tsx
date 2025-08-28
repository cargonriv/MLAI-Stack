import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  tokens?: number;
}

interface SimpleChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SimpleChatWidget = ({ isOpen, onToggle }: SimpleChatWidgetProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tokenizer, setTokenizer] = useState<any>(null);
  const [isLoadingTokenizer, setIsLoadingTokenizer] = useState(false);
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize tokenizer when chat opens
  useEffect(() => {
    if (!isOpen || tokenizer || isLoadingTokenizer) return;

    const initTokenizer = async () => {
      setIsLoadingTokenizer(true);
      try {
        console.log('Loading GPT-4o tokenizer...');
        const { AutoTokenizer } = await import('@huggingface/transformers');
        const tok = await AutoTokenizer.from_pretrained('Xenova/gpt-4o');
        
        // Test the tokenizer
        const testTokens = tok.encode('hello world');
        console.log('Tokenizer test result:', testTokens);
        
        setTokenizer(tok);
        setTokenizerReady(true);
        
        // Add welcome message
        setMessages([{
          id: Date.now().toString(),
          content: "Hi! I'm your AI assistant powered by GPT-4o tokenization. I can help you learn about this portfolio, discuss machine learning projects, or answer questions about Carlos's experience. What would you like to know?",
          sender: 'bot',
          timestamp: new Date()
        }]);
        
      } catch (error) {
        console.error('Failed to load tokenizer:', error);
        setMessages([{
          id: Date.now().toString(),
          content: "Hello! I'm your AI assistant (running in fallback mode). I can still help you learn about this portfolio and answer questions. What would you like to know?",
          sender: 'bot',
          timestamp: new Date()
        }]);
      } finally {
        setIsLoadingTokenizer(false);
      }
    };

    initTokenizer();
  }, [isOpen, tokenizer, isLoadingTokenizer]);

  // Auto-scroll to bottom when new messages arrive
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

  // Safe token counting - only called when explicitly needed
  const getTokenCount = (text: string): number => {
    if (!tokenizerReady || !tokenizer || !text) return 0;
    try {
      return tokenizer.encode(text).length;
    } catch {
      return 0;
    }
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerMessage = userMessage.toLowerCase();
    
    // Portfolio-specific responses
    if (lowerMessage.includes('project') || lowerMessage.includes('work')) {
      return "I'd be happy to tell you about Carlos's projects! He has worked on several exciting ML projects including:\n\n• **SIDS Prediction Model**: A deep learning system for early detection using physiological data\n• **Image Classification**: Computer vision models with real-time inference\n• **Sentiment Analysis**: NLP models for text emotion detection\n• **Recommendation Systems**: Collaborative filtering for personalized suggestions\n\nWhich project interests you most?";
    }
    
    if (lowerMessage.includes('sids') || lowerMessage.includes('capstone')) {
      return "The SIDS Prediction Model is Carlos's capstone project - a machine learning system designed to predict Sudden Infant Death Syndrome risk factors. It uses:\n\n• **Deep Neural Networks** for pattern recognition\n• **Physiological data** including heart rate, breathing patterns\n• **Real-time monitoring** capabilities\n• **High accuracy** with clinical validation\n\nThis project demonstrates advanced ML techniques applied to critical healthcare challenges.";
    }
    
    if (lowerMessage.includes('experience') || lowerMessage.includes('background') || lowerMessage.includes('skill')) {
      return "Carlos is an experienced ML Engineer with expertise in:\n\n• **Machine Learning**: Deep learning, computer vision, NLP\n• **Programming**: Python, JavaScript, TypeScript, React\n• **Frameworks**: TensorFlow, PyTorch, Hugging Face, ONNX\n• **Cloud**: AWS, Docker, Kubernetes\n• **Data**: SQL, data preprocessing, feature engineering\n\nHe has hands-on experience building production ML systems and web applications.";
    }
    
    if (lowerMessage.includes('technology') || lowerMessage.includes('tech') || lowerMessage.includes('stack')) {
      return "This portfolio showcases cutting-edge technologies:\n\n• **Frontend**: React 18, TypeScript, Tailwind CSS\n• **ML Integration**: Hugging Face Transformers.js, ONNX Runtime\n• **AI Models**: BERT, DistilBERT, GPT-4o tokenizer\n• **Performance**: WebGL acceleration, progressive loading\n• **Backend**: Supabase, Edge Functions\n\nEverything runs client-side for instant ML inference!";
    }
    
    if (lowerMessage.includes('tokenizer') || lowerMessage.includes('gpt-4o') || lowerMessage.includes('token')) {
      const tokenCount = getTokenCount(userMessage);
      return `Great question about tokenization! ${tokenizerReady ? "I'm using the GPT-4o tokenizer to process our conversation." : "I'm running in fallback mode, but I can still explain tokenization!"} ${tokenizerReady && tokenCount > 0 ? `For example, your message "${userMessage}" was tokenized into ${tokenCount} tokens.` : ""}\n\nTokenization is crucial for:\n• **Text preprocessing** for ML models\n• **Context management** in conversations\n• **Efficient processing** of natural language\n\nThe GPT-4o tokenizer is state-of-the-art for understanding text structure!`;
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! 👋 Welcome to Carlos's ML portfolio. I'm here to help you explore his projects and expertise. You can ask me about:\n\n• His machine learning projects\n• Technical skills and experience\n• The technologies used in this portfolio\n• Specific details about any demo or model\n\nWhat would you like to learn about?";
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('showcase')) {
      return "The portfolio features several interactive ML demos:\n\n• **Image Classification**: Upload images for real-time AI analysis\n• **Sentiment Analysis**: Analyze text emotions with BERT models\n• **Movie Recommendations**: Get personalized movie suggestions\n• **Chat Assistant**: That's me! Powered by GPT-4o tokenization\n\nEach demo runs entirely in your browser using WebAssembly and optimized models!";
    }
    
    // General responses
    const responses = [
      "That's an interesting question! While I'm focused on helping you learn about Carlos's portfolio and ML expertise, I can see you're curious about various topics. Is there something specific about his projects or experience you'd like to explore?",
      "I'm designed to help you understand Carlos's work and background. His portfolio showcases advanced ML engineering skills across computer vision, NLP, and web development. What aspect interests you most?",
      "Thanks for your question! I specialize in discussing Carlos's machine learning projects, technical skills, and the innovative technologies used in this portfolio. How can I help you learn more about his work?",
      `Interesting! ${tokenizerReady ? `I processed your message using ${getTokenCount(userMessage)} tokens with the GPT-4o tokenizer.` : "I'm running in fallback mode but can still help!"} While I focus on Carlos's portfolio, I'm happy to discuss how the ML models and technologies here work. What would you like to explore?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue?.trim() || '';
    if (!trimmedInput) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedInput,
      sender: 'user',
      timestamp: new Date(),
      tokens: tokenizerReady ? getTokenCount(trimmedInput) : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await generateResponse(userMessage.content);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
        tokens: tokenizerReady ? getTokenCount(response) : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error processing your message. Please try again!",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        size="icon"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl border-purple-200 dark:border-purple-800 z-50 transition-all duration-300",
      isMinimized && "h-16"
    )}>
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5" />
            AI Assistant
            {isLoadingTokenizer && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <div className="flex items-center gap-1">
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
              {tokenizerReady ? 'GPT-4o Tokenizer' : 'Loading...'}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              <Zap className="w-3 h-3 mr-1" />
              Real-time
            </Badge>
          </div>
        )}
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
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
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      message.sender === 'user'
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "bg-muted"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.tokens && message.tokens > 0 && (
                      <div className={cn(
                        "text-xs mt-1 opacity-70",
                        message.sender === 'user' ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {message.tokens} tokens
                      </div>
                    )}
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
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

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about projects, skills, or ML demos..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue?.trim() || isTyping}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {tokenizerReady && inputValue?.trim() && (
              <div className="text-xs text-muted-foreground mt-1">
                {getTokenCount(inputValue)} tokens
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SimpleChatWidget;