import os
import random
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ML Portfolio API", version="1.0.0")

# Add CORS middleware
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080,https://cargonriv.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

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
    return {"message": "ML Portfolio API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "message": "API is running successfully"
    }

def get_contextual_response(prompt: str) -> str:
    """Generate contextual responses based on the prompt"""
    prompt_lower = prompt.lower()
    
    # ML/AI related responses
    if any(word in prompt_lower for word in ['machine learning', 'ml', 'ai', 'artificial intelligence', 'model', 'algorithm']):
        responses = [
            "I'm Carlos Gonzalez Rivera, a Machine Learning Engineer with expertise in computer vision, NLP, and recommendation systems. I work with TensorFlow, PyTorch, and Hugging Face Transformers to build production-ready ML solutions.",
            "My ML experience includes developing end-to-end solutions from research to deployment. I've worked on projects ranging from medical prediction models to real-time image processing applications.",
            "I specialize in practical ML applications including image classification, sentiment analysis, and recommendation engines. This portfolio itself demonstrates client-side ML inference using Transformers.js."
        ]
    
    # Experience/background related
    elif any(word in prompt_lower for word in ['experience', 'background', 'work', 'career', 'job', 'about']):
        responses = [
            "I'm a Machine Learning Engineer passionate about bridging the gap between ML research and production applications. My background spans computer vision, NLP, and scalable ML infrastructure.",
            "My professional journey includes developing ML models for healthcare (SIDS prediction), computer vision (image segmentation), and web applications (this interactive portfolio).",
            "I have experience in both the technical and practical aspects of ML - from model development and optimization to deployment and user experience design."
        ]
    
    # Technical skills
    elif any(word in prompt_lower for word in ['python', 'tensorflow', 'pytorch', 'react', 'javascript', 'programming', 'skills', 'technology']):
        responses = [
            "My technical stack includes Python for ML development, JavaScript/TypeScript for web applications, and frameworks like TensorFlow, PyTorch, and React. I focus on creating efficient, scalable solutions.",
            "I work with modern ML tools including Hugging Face Transformers, ONNX Runtime for optimization, and cloud platforms for deployment. I also build web interfaces using React and TypeScript.",
            "My programming expertise spans ML frameworks (TensorFlow, PyTorch), web technologies (React, Node.js), and deployment tools (Docker, cloud platforms). I believe in using the right tool for each job."
        ]
    
    # Projects
    elif any(word in prompt_lower for word in ['project', 'portfolio', 'built', 'developed', 'showcase']):
        responses = [
            "Some key projects include: a SIDS prediction model using ensemble methods, real-time image segmentation with Grounded SAM, and this interactive ML portfolio with client-side inference capabilities.",
            "My portfolio showcases practical ML applications: sentiment analysis tools, recommendation systems, computer vision models, and web-based ML demonstrations that run entirely in the browser.",
            "I've built end-to-end ML solutions including medical prediction models, image processing applications, and this portfolio website that demonstrates real-time ML inference without server dependencies."
        ]
    
    # Education/learning
    elif any(word in prompt_lower for word in ['learn', 'education', 'study', 'university', 'degree', 'research']):
        responses = [
            "I have a strong foundation in computer science and machine learning, with continuous learning through hands-on projects. I believe in learning by building practical applications.",
            "My approach combines formal education with project-based learning. I stay current with ML research while focusing on practical implementations that solve real problems.",
            "I'm committed to continuous learning in the rapidly evolving ML field. This portfolio itself is a learning project that explores client-side ML inference and modern web technologies."
        ]
    
    # Contact/collaboration
    elif any(word in prompt_lower for word in ['contact', 'hire', 'collaborate', 'work together', 'email', 'connect']):
        responses = [
            "I'm always interested in discussing ML projects and opportunities. You can find my contact information in the portfolio or connect with me through professional networks.",
            "I enjoy collaborating on challenging ML problems and am open to new opportunities. Feel free to reach out if you have a project that could benefit from ML engineering expertise.",
            "I'm passionate about working on impactful ML applications. Don't hesitate to get in touch if you'd like to discuss potential collaborations or opportunities."
        ]
    
    # Specific technologies
    elif any(word in prompt_lower for word in ['transformers', 'hugging face', 'onnx', 'computer vision', 'nlp']):
        responses = [
            "I work extensively with Hugging Face Transformers for NLP tasks and have experience optimizing models with ONNX Runtime. This portfolio demonstrates client-side inference using Transformers.js.",
            "My computer vision work includes image classification, segmentation, and object detection. I've implemented solutions using both traditional CV techniques and modern deep learning approaches.",
            "For NLP, I work with transformer models for tasks like sentiment analysis, text classification, and embeddings. I focus on both model performance and deployment efficiency."
        ]
    
    # Default responses
    else:
        responses = [
            "Hello! I'm Carlos, a Machine Learning Engineer passionate about creating practical AI solutions. This portfolio showcases my work in ML engineering, from model development to deployment. What would you like to know?",
            "Thanks for visiting my ML portfolio! I specialize in computer vision, NLP, and building production-ready ML applications. Feel free to explore my projects or ask about any specific areas that interest you.",
            "Welcome! I'm excited to share my ML engineering journey with you. My work spans healthcare AI, computer vision, and web-based ML applications. What aspect would you like to learn more about?"
        ]
    
    return random.choice(responses)

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Handle chat requests with contextual responses"""
    import time
    start_time = time.time()
    
    try:
        # Generate contextual response
        response_text = get_contextual_response(request.prompt)
        
        processing_time = time.time() - start_time
        
        return ChatResponse(
            response=response_text,
            method="contextual_fallback",
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