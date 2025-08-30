import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  Bot, 
  Zap, 
  Brain, 
  Code, 
  Hash, 
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";
import TokenizedChatWidget from "@/components/TokenizedChatWidget";
import AdvancedTokenizedChat from "@/components/AdvancedTokenizedChat";

const TokenizedChatDemo = () => {
  const [showChat, setShowChat] = useState(false);
  const [showAdvancedChat, setShowAdvancedChat] = useState(false);
  const [chatMode, setChatMode] = useState<'basic' | 'advanced'>('basic');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <Hash className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Tokenized AI Chat
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience real-time text tokenization with GPT-4's tokenizer. See exactly how your messages 
              get encoded into tokens and decoded back into text - the foundation of modern AI language models.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                GPT-4 Tokenizer
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Token Analysis
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Real-time Processing
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Code className="w-3 h-3" />
                Encode/Decode Demo
              </Badge>
            </div>

            <Button 
              onClick={() => setShowChat(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Tokenized Chat
            </Button>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">How Tokenization Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                    1. Text Input
                  </CardTitle>
                  <CardDescription>
                    Your message gets processed character by character
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-400 dark:bg-blue-950/20 p-3 rounded-lg font-mono text-sm">
                    "Hello world!"
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Raw text input ready for tokenization
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-600" />
                    2. Token Encoding
                  </CardTitle>
                  <CardDescription>
                    GPT-4 tokenizer converts text to numerical tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-purple-400 dark:bg-purple-950/20 p-3 rounded-lg font-mono text-sm">
                    [9906, 1917, 0]
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Numerical representation for AI processing
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-green-600" />
                    3. Token Decoding
                  </CardTitle>
                  <CardDescription>
                    Individual tokens can be decoded back to text
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-500 dark:bg-green-950/20 p-3 rounded-lg font-mono text-sm">
                    ["Hello", " world", "!"]
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Token-by-token breakdown visualization
                  </p>
                </CardContent>
              </Card>
            </div>

            <Alert className="max-w-3xl mx-auto">
              <Info className="h-4 w-4" />
              <AlertDescription>
                This demo uses the same GPT-4 tokenizer that powers ChatGPT and other advanced language models. 
                You'll see exactly how your text gets processed in real-time, including token counts and individual token breakdowns.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Advanced Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Real-time Tokenization
                  </CardTitle>
                  <CardDescription>
                    See tokens update as you type your message
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Live token counting</li>
                    <li>• Instant encoding preview</li>
                    <li>• Character-by-character analysis</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-blue-600" />
                    Token Breakdown
                  </CardTitle>
                  <CardDescription>
                    Detailed view of how text gets segmented
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Individual token display</li>
                    <li>• Token ID numbers</li>
                    <li>• Decoded token strings</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    Interactive Learning
                  </CardTitle>
                  <CardDescription>
                    Learn about tokenization through conversation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Ask about tokenization</li>
                    <li>• Portfolio knowledge base</li>
                    <li>• Technical explanations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    Performance Optimized
                  </CardTitle>
                  <CardDescription>
                    Efficient client-side processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• WebAssembly acceleration</li>
                    <li>• No server round-trips</li>
                    <li>• Instant responses</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-pink-200 dark:border-pink-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-pink-600" />
                    Developer Insights
                  </CardTitle>
                  <CardDescription>
                    Perfect for understanding AI internals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Token visualization</li>
                    <li>• Encoding algorithms</li>
                    <li>• AI model foundations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-cyan-200 dark:border-cyan-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-600" />
                    Contextual Responses
                  </CardTitle>
                  <CardDescription>
                    AI responses aware of tokenization process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Token-aware conversations</li>
                    <li>• Educational responses</li>
                    <li>• Technical depth control</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Try the Tokenized Chat</h2>
              <p className="text-muted-foreground">
                Experience the power of real-time tokenization and see how AI processes language
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Tokenization */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <div className="inline-flex p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-3">
                    <Hash className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Basic Tokenization</h3>
                  <p className="text-sm text-muted-foreground">
                    See how text gets encoded into tokens with curated educational responses
                  </p>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-500">✅ GPT-4 Tokenizer</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-500">✅ Real-time Token Counting</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-500">📝 Curated Responses</Badge>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    setChatMode('basic');
                    setShowChat(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Try Basic Mode
                </Button>
              </div>

              {/* Advanced AI Generation */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <div className="inline-flex p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-3">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AI Generation + Tokens</h3>
                  <p className="text-sm text-muted-foreground">
                    Full NLP pipeline with actual AI text generation and tokenization
                  </p>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-500">✅ GPT-4 Tokenizer</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-500">🤖 DistilGPT-2 Generation</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-500">⚡ Full NLP Pipeline</Badge>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    setChatMode('advanced');
                    setShowAdvancedChat(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Try AI Generation
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="space-y-3 text-sm text-muted-foreground mb-6">
                <p>Try asking either mode:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline">"How does tokenization work?"</Badge>
                  <Badge variant="outline">"Generate a creative response"</Badge>
                  <Badge variant="outline">"Explain the difference between modes"</Badge>
                  <Badge variant="outline">"What are Carlos's ML projects?"</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Technical Implementation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Tokenizer Details</CardTitle>
                  <CardDescription>
                    GPT-4 tokenizer specifications and capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Model:</span>
                    <span className="text-sm font-mono">Xenova/gpt-4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vocabulary Size:</span>
                    <span className="text-sm font-mono">~100k tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Encoding:</span>
                    <span className="text-sm font-mono">BPE (Byte-Pair)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Languages:</span>
                    <span className="text-sm">Multilingual</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Real-time processing capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tokenization Speed:</span>
                    <span className="text-sm">~1ms per message</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Memory Usage:</span>
                    <span className="text-sm">~50MB loaded</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Processing:</span>
                    <span className="text-sm">Client-side only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Framework:</span>
                    <span className="text-sm font-mono">Transformers.js</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>

      {/* Chat Widgets */}
      {chatMode === 'basic' && (
        <TokenizedChatWidget isOpen={showChat} onToggle={() => setShowChat(!showChat)} />
      )}
      {chatMode === 'advanced' && (
        <AdvancedTokenizedChat isOpen={showAdvancedChat} onToggle={() => setShowAdvancedChat(!showAdvancedChat)} />
      )}
    </div>
  );
};

export default TokenizedChatDemo;