import ModelCard from "./ModelCard";
import ImageClassificationDemo from "./demos/ImageClassificationDemo";
import SentimentAnalysisDemo from "./demos/SentimentAnalysisDemo";
import RecommendationDemo from "./demos/RecommendationDemo";
import { Brain, Cpu, Zap } from "lucide-react";

const ModelsSection = () => {
  const models = [
    {
      title: "CNN Image Classifier",
      description: "Deep learning model for accurate image recognition across 1000+ categories",
      explanation: "This convolutional neural network uses multiple layers of filters to detect features like edges, shapes, and patterns. The model was trained on ImageNet dataset using transfer learning from ResNet-50, achieving high accuracy through data augmentation and fine-tuning techniques.",
      githubUrl: "https://github.com/yourusername/cnn-classifier",
      tags: ["CNN", "Computer Vision", "PyTorch", "ResNet"],
      accuracy: "94.2%",
      dataset: "ImageNet",
      demoComponent: <ImageClassificationDemo />
    },
    {
      title: "Transformer Sentiment Analysis",
      description: "BERT-based model for understanding emotions and opinions in text",
      explanation: "Built on the BERT (Bidirectional Encoder Representations from Transformers) architecture, this model analyzes text context in both directions to understand sentiment. Fine-tuned on movie reviews and social media data, it captures nuanced emotions and handles negations effectively.",
      githubUrl: "https://github.com/yourusername/sentiment-transformer",
      tags: ["BERT", "NLP", "Transformers", "Sentiment"],
      accuracy: "91.8%",
      dataset: "IMDB + Twitter",
      demoComponent: <SentimentAnalysisDemo />
    },
    {
      title: "Collaborative Filtering Engine",
      description: "Recommendation system using matrix factorization and deep learning",
      explanation: "Combines collaborative filtering with neural networks to predict user preferences. The model learns user and item embeddings through matrix factorization, then passes them through deep layers to capture complex non-linear patterns in user behavior.",
      githubUrl: "https://github.com/yourusername/recommendation-engine",
      tags: ["Collaborative Filtering", "Embeddings", "TensorFlow", "Recommendation"],
      accuracy: "87.5%",
      dataset: "MovieLens 25M",
      demoComponent: <RecommendationDemo />
    },
    {
      title: "Time Series Forecasting",
      description: "LSTM network for predicting future values in sequential data",
      explanation: "Long Short-Term Memory (LSTM) network designed to capture temporal dependencies in time series data. Uses multiple LSTM layers with dropout regularization and attention mechanisms to forecast future values while handling seasonality and trends.",
      githubUrl: "https://github.com/yourusername/time-series-lstm",
      tags: ["LSTM", "Time Series", "Forecasting", "Keras"],
      accuracy: "85.3%",
      dataset: "Stock Prices + Weather"
    },
    {
      title: "GAN Image Generator",
      description: "Generative Adversarial Network for creating realistic synthetic images",
      explanation: "A Deep Convolutional GAN (DCGAN) that generates high-quality synthetic images through adversarial training. The generator creates images from random noise while the discriminator learns to distinguish real from fake images, resulting in increasingly realistic outputs.",
      githubUrl: "https://github.com/yourusername/dcgan-generator",
      tags: ["GAN", "Generative AI", "DCGAN", "PyTorch"],
      dataset: "CelebA Faces"
    },
    {
      title: "Reinforcement Learning Agent",
      description: "Deep Q-Network agent that masters complex game environments",
      explanation: "Implements Deep Q-Learning with experience replay and target networks to learn optimal strategies in game environments. The agent uses convolutional layers to process visual input and learns through trial and error, gradually improving its performance.",
      githubUrl: "https://github.com/yourusername/dqn-agent",
      tags: ["DQN", "Reinforcement Learning", "OpenAI Gym", "Deep RL"],
      dataset: "Atari Games"
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
            Explore my machine learning projects, each featuring detailed explanations, 
            interactive demonstrations, and complete source code.
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