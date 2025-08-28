import Header from "@/components/Header";
import TestSentimentDemo from "@/components/demos/TestSentimentDemo";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const SentimentAnalysisPage = () => {
  console.log('🔥 SentimentAnalysisPage component loaded!');
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/#/showcase'}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Showcase
            </Button>
          </div>

          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow-primary/50">
                <MessageSquare className="w-8 h-8 text-background" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Sentiment Analysis Demo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              BERT-based model for understanding text
            </p>
          </div>

          {/* Demo Component */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <TestSentimentDemo />
            </div>
          </div>

          {/* Technical Details */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Technical Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Model Architecture</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• BERT (Bidirectional Encoder Representations)</li>
                    <li>• Transformer-based architecture</li>
                    <li>• Contextual understanding</li>
                    <li>• Fine-tuned on sentiment datasets</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Performance</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {/* <li>• 88.9% accuracy on test data</li> */}
                    <li>• Trained on ~124MB of Tweets (X/Twitter)</li>
                    <li>• Handles negations effectively</li>
                    <li>• Real-time inference</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysisPage;