import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bot, Zap, Brain, Code, Sparkles } from "lucide-react";
import AdvancedTokenizedChat from "@/components/AdvancedTokenizedChat";

const ChatBotDemo = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Chat Assistant
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience intelligent conversation powered by GPT-4 tokenization and advanced NLP. 
              Ask questions about this portfolio, machine learning, or anything else!
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                GPT-4 Tokenizer
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Real-time Processing
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Code className="w-3 h-3" />
                Client-side AI
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Context Aware
              </Badge>
            </div>

            <Button 
              onClick={() => setShowChat(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Chatting
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Chat Assistant Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Smart Tokenization
                  </CardTitle>
                  <CardDescription>
                    Uses GPT-4 tokenizer for accurate text processing and understanding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Advanced token encoding</li>
                    <li>• Context preservation</li>
                    <li>• Efficient processing</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Portfolio Knowledge
                  </CardTitle>
                  <CardDescription>
                    Ask about projects, experience, skills, and technical details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Project explanations</li>
                    <li>• Technical expertise</li>
                    <li>• Career background</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    Real-time Responses
                  </CardTitle>
                  <CardDescription>
                    Instant responses with typing indicators and smooth animations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Fast processing</li>
                    <li>• Typing animations</li>
                    <li>• Smooth interactions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Try the Chat Assistant</h2>
              <p className="text-muted-foreground">
                Click the chat button below or in the bottom-right corner to start a conversation
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-4">
                  <Bot className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Ready to Chat!</h3>
                <p className="text-muted-foreground">
                  The chat assistant is available on every page of this portfolio
                </p>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground mb-6">
                <p>Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline">"Tell me about your projects"</Badge>
                  <Badge variant="outline">"What's your ML experience?"</Badge>
                  <Badge variant="outline">"Explain the SIDS prediction model"</Badge>
                </div>
              </div>

              <Button 
                onClick={() => setShowChat(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Chat Assistant
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Chat Widget */}
      <AdvancedTokenizedChat isOpen={showChat} onToggle={() => setShowChat(!showChat)} />
    </div>
  );
};

export default ChatBotDemo;