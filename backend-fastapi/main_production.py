import os
import json
import numpy as np
from typing import List, Optional
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import random

app = FastAPI(title="ML Portfolio RAG API", version="1.0.0")

# Add CORS middleware
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080,https://cargonriv.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Global variables for models and data
embedding_model = None
workspace_embeddings = []

def load_models():
    """Load embedding model and workspace embeddings"""
    global embedding_model, workspace_embeddings
    
    print("🚀 Loading models and embeddings...")
    
    # Load embedding model
    try:
        print("📊 Loading embedding model...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load embedding model: {e}")
        embedding_model = None
    
    # For production, we'll use a fallback response system
    # since the full LLM and embeddings are too large for Railway
    print("✅ Production mode: Using fallback response system")

# Load models on startup
load_models()

class ChatRequest(BaseModel):
    prompt: str
    use_rag: bool = True
    max_context_chunks: int = 5
    similarity_threshold: float = 0.3

class ChatResponse(BaseModel):
    response: str
    method: str
    processing_time: float
    context_used: List[str] = []

@app.get("/")
async def root():
    return {"message": "ML Portfolio RAG API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "embedding_model_loaded": embedding_model is not None,
        "version": "1.0.0"
    }

def get_fallback_response(prompt: str) -> str:
    """Generate contextual fallback responses based on the prompt"""
    prompt_lower = prompt.lower()
    
    # ML/AI related responses
    if any(word in prompt_lower for word in ['machine learning', 'ml', 'ai', 'artificial intelligence', 'model', 'algorithm']):
        responses = [
            "I specialize in machine learning engineering with experience in computer vision, NLP, and recommendation systems. I've worked with frameworks like TensorFlow, PyTorch, and Hugging Face Transformers.",
            "My ML expertise includes developing production-ready models for image classification, sentiment analysis, and recommendation engines. I focus on both model performance and deployment efficiency.",
            "I have hands-on experience with various ML techniques including deep learning, ensemble methods, and feature engineering. My projects range from SIDS prediction models to real-time image segmentation."
        ]
    
    # Experience/background related
    elif any(word in prompt_lower for word in ['experience', 'background', 'work', 'career', 'job']):
        responses = [
            "I'm a Machine Learning Engineer with experience in developing end-to-end ML solutions. My background includes both research and production deployment of ML models.",
            "My professional experience spans computer vision, natural language processing, and recommendation systems. I've worked on projects ranging from medical prediction models to real-time image processing.",
            "I have a strong background in ML engineering with focus on production deployment, model optimization, and scalable ML infrastructure."
        ]
    
    # Technical skills
    elif any(word in prompt_lower for word in ['python', 'tensorflow', 'pytorch', 'react', 'javascript', 'programming']):
        responses = [
            "I'm proficient in Python, JavaScript/TypeScript, and various ML frameworks including TensorFlow, PyTorch, and Hugging Face. I also work with React for building ML-powered web applications.",
            "My technical stack includes Python for ML development, React/TypeScript for frontend, and cloud platforms for deployment. I'm experienced with both model development and web integration.",
            "I work with modern ML tools and frameworks, focusing on creating efficient, scalable solutions that bridge the gap between research and production."
        ]
    
    # Projects
    elif any(word in prompt_lower for word in ['project', 'portfolio', 'work', 'built', 'developed']):
        responses = [
            "Some of my key projects include a SIDS prediction model using ensemble methods, real-time image segmentation with Grounded SAM, and this interactive ML portfolio website with client-side inference.",
            "I've built various ML applications including sentiment analysis tools, recommendation systems, and computer vision models. This portfolio itself demonstrates client-side ML inference using Transformers.js.",
            "My projects showcase end-to-end ML development from data preprocessing to deployment. I focus on creating practical, user-friendly applications that demonstrate real ML capabilities."
        ]
    
    # Education/learning
    elif any(word in prompt_lower for word in ['learn', 'education', 'study', 'university', 'degree']):
        responses = [
            "I have a strong educational foundation in computer science and machine learning, with continuous learning through hands-on projects and staying current with the latest ML research and techniques.",
            "My learning approach combines formal education with practical project experience. I believe in learning by building, which is why I create projects like this interactive ML portfolio.",
            "I'm committed to continuous learning in the rapidly evolving ML field, regularly exploring new techniques and frameworks to stay at the forefront of ML engineering."
        ]
    
    # Contact/collaboration
    elif any(word in prompt_lower for word in ['contact', 'hire', 'collaborate', 'work together', 'email']):
        responses = [
            "I'm always interested in discussing ML projects and opportunities. You can reach out through my portfolio contact information or connect with me on professional networks.",
            "I'm open to collaboration on interesting ML projects. Feel free to get in touch if you have a project that could benefit from ML engineering expertise.",
            "I enjoy working on challenging ML problems and am always open to new opportunities. Don't hesitate to reach out if you'd like to discuss potential collaborations."
        ]
    
    # Default responses
    else:
        responses = [
            "Thanks for your question! I'm Carlos, a Machine Learning Engineer passionate about building practical AI solutions. This portfolio showcases my work in ML engineering, from model development to deployment.",
            "I appreciate your interest! I specialize in machine learning engineering with a focus on computer vision, NLP, and creating production-ready ML applications. Feel free to explore my projects and ask about any specific areas.",
            "Hello! I'm excited to share my ML engineering journey with you. My work spans various domains including medical AI, computer vision, and web-based ML applications. What specific aspect interests you most?"
        ]
    
    return random.choice(responses)

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Handle chat requests with fallback responses"""
    import time
    start_time = time.time()
    
    try:
        # Generate fallback response
        response_text = get_fallback_response(request.prompt)
        
        processing_time = time.time() - start_time
        
        return ChatResponse(
            response=response_text,
            method="fallback",
            processing_time=processing_time,
            context_used=[]
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)