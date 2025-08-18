# ML Engineer Portfolio & AI Demo Stack

Welcome to my comprehensive portfolio website featuring an interactive machine learning model collection and professional showcase.

## 🎯 About This Project

This is a full-stack React application that serves as both my personal portfolio and a demonstration platform for various machine learning and AI capabilities. The site showcases my work as a Machine Learning Engineer while providing interactive demos of cutting-edge AI models.

## 🤖 ML/AI Demo Stack

### Interactive Model Demonstrations

**Image Classification & Segmentation**
- **Grounded SAM (Segment Anything Model)**: Upload images and use natural language prompts to identify and segment objects
- Real-time object detection with confidence scoring
- Advanced computer vision capabilities using state-of-the-art foundation models

**Natural Language Processing**
- **BERT Sentiment Analysis**: Real-time text sentiment classification using BERT with confidence metrics
- **FastAPI Backend**: Dedicated Python backend with DistilBERT model for server-side inference
- Input validation and text preprocessing
- Supports various text formats and lengths

**Recommendation Systems**
- **Movie Recommendation Engine**: Genre-based collaborative filtering demo
- Multi-genre selection with personalized recommendations
- Rating-based ranking and recommendation algorithms

### Technical Stack

**Frontend Technologies**
- React 18 with TypeScript for type-safe development
- Tailwind CSS with custom design system
- Vite for lightning-fast development and builds
- React Router for seamless navigation
- Shadcn/ui component library for consistent UI

**ML/AI Integration**
- Hugging Face Transformers.js for client-side model inference
- ONNX Runtime for optimized model performance
- WebGL acceleration for computer vision tasks
- Custom model loading and management utilities

**Backend & Infrastructure**
- **FastAPI Backend**: Python-based API server with BERT sentiment analysis
- Supabase integration for data management
- Edge functions for serverless ML processing
- Real-time data synchronization
- Secure API endpoints with CORS support

## 📋 Portfolio Sections

### Professional Content
- **About Me**: Background, expertise, and professional journey
- **Resume**: Comprehensive CV with education, experience, and skills
- **Past Projects**: Detailed project showcase with technologies and outcomes
- **Capstone Project**: SIDS prediction system using machine learning
- **Technical Blog**: In-depth articles on ML, AI, and data science topics

### Interactive Demos
- **Live Model Collection**: 6+ interactive ML models with real-time inference
- **Performance Metrics**: Model accuracy, dataset information, and benchmarks
- **GitHub Integration**: Direct links to model implementations and research

## 🚀 Key Features

### Advanced ML Capabilities
- **Client-side Inference**: Models run directly in the browser for privacy and speed
- **Multi-modal Support**: Text, image, and structured data processing
- **Real-time Processing**: Instant results with loading states and progress indicators
- **Error Handling**: Robust fallback mechanisms and user feedback

### Professional Portfolio
- **SEO Optimized**: Semantic HTML, meta tags, and structured data
- **Responsive Design**: Mobile-first approach with dark/light mode support
- **Performance Focused**: Lazy loading, code splitting, and optimized assets
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation

### Technical Excellence
- **Type Safety**: Full TypeScript implementation with strict typing
- **Modern React**: Hooks, context, and functional components
- **Clean Architecture**: Modular components with separation of concerns
- **Best Practices**: ESLint, proper error boundaries, and code organization

## 🛠️ Development Setup

```bash
# Clone the repository
git clone github.com/cargonriv/MLAI-Stack

# Navigate to project directory
cd MLAI-Stack

# Install dependencies
npm install

# Start development server (frontend only)
npm run dev

# Start full-stack development (frontend + FastAPI backend)
npm run dev:full

# Or start services separately:
# Terminal 1: Start FastAPI backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev

# Build for production
npm run build
```

## 🐍 FastAPI Backend

The sentiment analysis demo now includes a dedicated FastAPI backend for server-side BERT inference:

### Backend Features
- **DistilBERT Model**: Fast, accurate sentiment analysis using Hugging Face Transformers
- **Real-time API**: `/api/sentiment` endpoint for instant text analysis
- **Model Information**: `/api/model-info` endpoint with detailed model specs
- **Health Monitoring**: `/api/health` for service status checks
- **CORS Enabled**: Ready for frontend integration

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

### API Usage
```bash
# Test sentiment analysis
curl -X POST "http://localhost:8000/api/sentiment" \
     -H "Content-Type: application/json" \
     -d '{"text": "I love this product!"}'

# Check API documentation
open http://localhost:8000/docs
```

## 📊 Model Performance

The ML demo stack features models with varying capabilities:
- **Image Classification**: 94%+ accuracy on standard benchmarks
- **Sentiment Analysis**: Real-time processing with confidence scoring
- **Recommendation Systems**: Collaborative filtering with personalized results
- **Computer Vision**: Advanced object detection and segmentation

## 🔗 Live Demo

Visit the live application to explore the interactive ML demos and portfolio content.

## 📞 Contact

**Carlos Gonzalez Rivera**
- Email: cargonriv@pm.me
- LinkedIn: [Connect with me](https://linkedin.com/in/carlosriver)
- Portfolio: Live demos and project showcase

---

*This project demonstrates the intersection of machine learning research, software engineering, and user experience design. Each component is built with production-quality standards and serves as both a functional tool and a learning resource.*
