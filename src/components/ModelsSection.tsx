import ModelCard from "./ModelCard";
import { Brain, Cpu, Zap } from "lucide-react";

const ModelsSection = () => {
  const models = [
    {
      title: "Grounded SAM Object Detection",
      description: "Advanced object detection and segmentation using Grounded SAM (Segment Anything Model)",
      explanation: "Combines Grounding DINO for object detection with Meta's Segment Anything Model (SAM) for precise segmentation. This powerful combination allows for text-prompted object detection and pixel-perfect segmentation masks, enabling zero-shot detection of any object described in natural language.",
      githubUrl: "https://github.com/IDEA-Research/Grounded-Segment-Anything",
      tags: ["SAM", "Object Detection", "Segmentation", "Zero-shot"],
      accuracy: "High Precision",
      dataset: "SA-1B + Custom",
      demoUrl: "#/demos/image-classification"
    },
    {
      title: "Transformer Sentiment Analysis",
      description: "BERT-based model for understanding emotions and opinions in text",
      explanation: "Built on the BERT (Bidirectional Encoder Representations from Transformers) architecture, this model analyzes text context in both directions to understand sentiment. Fine-tuned on movie reviews and social media data, it captures nuanced emotions and handles negations effectively.",
      githubUrl: "https://github.com/yourusername/sentiment-transformer",
      tags: ["BERT", "NLP", "Transformers", "Sentiment"],
      accuracy: "91.8%",
      dataset: "IMDB + Twitter",
      demoUrl: "#/demos/sentiment-analysis"
    },
    {
      title: "Collaborative Filtering Engine",
      description: "Recommendation system using matrix factorization and deep learning",
      explanation: "Combines collaborative filtering with neural networks to predict user preferences. The model learns user and item embeddings through matrix factorization, then passes them through deep layers to capture complex non-linear patterns in user behavior.",
      githubUrl: "https://github.com/yourusername/recommendation-engine",
      tags: ["Collaborative Filtering", "Embeddings", "TensorFlow", "Recommendation"],
      accuracy: "87.5%",
      dataset: "MovieLens 25M",
      demoUrl: "#/demos/movie-recommendation"
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
            <h3 className="text-2xl font-bold text-accent mb-2">3</h3>
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