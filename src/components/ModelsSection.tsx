import ModelCard from "./ModelCard";
import { Brain, Cpu, Zap } from "lucide-react";

const ModelsSection = () => {
  const models = [
    {
      title: "DETR Object Detection",
      description: "End-to-end object detection using Detection Transformer (DETR) with ResNet-101 backbone",
      explanation: "Implements Facebook's DETR (Detection Transformer) model with ResNet-101 backbone for real-time object detection in the browser. This transformer-based approach eliminates the need for hand-crafted components like NMS, running entirely client-side with WebAssembly for fast inference and bounding box visualization.",
      githubUrl: "https://github.com/facebookresearch/detr",
      tags: ["DETR", "Object Detection", "Transformers", "ResNet-101", "WebAssembly"],
      accuracy: "High Precision",
      dataset: "COCO Dataset",
      demoUrl: "#/demos/image-classification"
    },
    {
      title: "RoBERTa Sentiment Analysis",
      description: "Twitter-optimized RoBERTa model for robust sentiment classification",
      explanation: "Uses a RoBERTa-based transformer fine-tuned specifically on Twitter data for sentiment analysis. This model excels at understanding social media language, slang, and informal text patterns, running entirely in the browser with Hugging Face Transformers.js for real-time sentiment analysis.",
      githubUrl: "https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest",
      tags: ["RoBERTa", "NLP", "Transformers", "Sentiment", "Twitter", "Client-side"],
      accuracy: "92.8%",
      dataset: "Twitter Sentiment Data",
      demoUrl: "#/demos/sentiment-analysis"
    },
    {
      title: "Collaborative Filtering Engine",
      description: "SVD-based recommendation system with neural collaborative filtering options",
      explanation: "Implements multiple recommendation algorithms including SVD matrix factorization, neural collaborative filtering, and hybrid approaches. The system learns user-item interaction patterns to generate personalized recommendations with confidence scores and explanations.",
      githubUrl: "https://github.com/cargonriv/recommendation-engine",
      tags: ["SVD", "Neural CF", "Matrix Factorization", "Recommendation"],
      accuracy: "87.5%",
      dataset: "MovieLens Dataset",
      demoUrl: "#/demos/movie-recommendation"
    },
    {
      title: "GPT-4o Tokenizer Assistant",
      description: "Interactive chat assistant powered by GPT-4o tokenization for text processing",
      explanation: "Features the GPT-4o tokenizer for advanced text processing and token analysis. This chat assistant demonstrates real-time tokenization, provides portfolio information, and showcases how modern tokenizers handle text preprocessing for large language models, all running client-side in the browser.",
      githubUrl: "https://huggingface.co/openai-community/gpt-4o",
      tags: ["GPT-4o", "Tokenizer", "NLP", "Chat AI", "Text Processing", "Client-side"],
      accuracy: "Context-Aware",
      dataset: "Portfolio Knowledge Base",
      demoUrl: "#/demos/chatbot"
    },
    {
      title: "NBA Player Performance Predictor",
      description: "AdaBoost Regressor that computes performance scores for NBA players using real-time statistics",
      explanation: "This machine learning model uses an AdaBoost Regressor to analyze and score NBA players based on their latest performance statistics pulled from the internet. The ensemble method combines multiple weak learners to create a robust predictor that evaluates player effectiveness across various game metrics.",
      githubUrl: "https://github.com/cargonriv/BoostGM",
      tags: ["AdaBoost", "Regression", "Sports Analytics", "Python"],
      accuracy: "88.7%",
      dataset: "NBA Player Stats"
    },
    {
      title: "LCA Sparse Coding Network",
      description: "PyTorch implementation of Locally Competitive Algorithm for neural sparse coding on linked datasets",
      explanation: "Implements the Locally Competitive Algorithm (LCA), a neuroscientific model that performs sparse coding by modeling lateral competition observed in the visual cortex. This network builds convolutional sparse coding layers that compete to represent shared input portions, mimicking brain functionality for efficient feature representation.",
      githubUrl: "https://github.com/cargonriv/linked-lca",
      tags: ["LCA", "Sparse Coding", "Neuroscience", "PyTorch"],
      dataset: "ImageNet + Allen Institute Data"
    },
    {
      title: "PacWarrior Genetic Algorithm Agent",
      description: "Genetic algorithm-based reinforcement learning agent designed for Pac-Man style environments",
      explanation: "A sophisticated AI agent that uses genetic algorithms to evolve optimal strategies for navigating Pac-Man environments. The system employs evolutionary computation principles with selection, crossover, and mutation operators to develop increasingly effective game-playing behaviors through generations of iterative improvement.",
      githubUrl: "https://github.com/cargonriv/PacWarrior",
      tags: ["Genetic Algorithm", "Game AI", "Evolution", "C/Python"],
      dataset: "Pac-Man Game States"
    }
  ];

  return (
    <section id="models" className="py-20 relative">
      {/* Background elements */}
      <div className="absolute top-40 left-10 w-20 h-20 bg-accent/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow-primary/50">
              <Brain className="w-12 h-12 text-background" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            ML Model Collection
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Explore my machine learning projects with interactive demonstrations. 
            Click "Try Demo" to experience each model in a dedicated environment.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-gradient-card rounded-xl border border-border/50">
            <div className="flex justify-center mb-4">
              <Cpu className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-2">{models.length}</h3>
            <p className="text-muted-foreground">ML Models</p>
          </div>
          <div className="text-center p-6 bg-gradient-card rounded-xl border border-border/50">
            <div className="flex justify-center mb-4">
              <Zap className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-accent mb-2">4</h3>
            <p className="text-muted-foreground">Live Demos</p>
          </div>
          <div className="text-center p-6 bg-gradient-card rounded-xl border border-border/50">
            <div className="flex justify-center mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-2">90%+</h3>
            <p className="text-muted-foreground">Avg Accuracy</p>
          </div>
        </div>
        
        {/* Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {models.map((model, index) => (
            <ModelCard key={index} {...model} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModelsSection;