"""
FastAPI backend for BERT sentiment analysis
Provides /api/sentiment endpoint for real-time sentiment analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import logging
import time
from typing import Dict, Any, Optional
import torch
import gc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ML Portfolio Sentiment API",
    description="BERT-based sentiment analysis API for ML portfolio demo",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variables
sentiment_pipeline = None
model_info = {}

class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Text to analyze")

class SentimentResponse(BaseModel):
    label: str = Field(..., description="Sentiment label (POSITIVE/NEGATIVE)")
    confidence: float = Field(..., description="Confidence score (0-1)")
    scores: Dict[str, float] = Field(..., description="Individual class scores")
    processing_time: float = Field(..., description="Processing time in milliseconds")
    model_info: Dict[str, Any] = Field(..., description="Model information")

@app.on_event("startup")
def load_model():
    """Load the BERT sentiment analysis model at startup"""
    global sentiment_pipeline, model_info
    
    try:
        logger.info("🚀 Loading BERT sentiment analysis model...")
        start_time = time.time()
        
        # Use DistilBERT for faster inference while maintaining good accuracy
        model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        
        # Load the pipeline
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=model_name,
            tokenizer=model_name,
            return_all_scores=True,
            device=0 if torch.cuda.is_available() else -1  # Use GPU if available
        )
        
        load_time = time.time() - start_time
        
        # Store model information
        model_info = {
            "name": model_name,
            "architecture": "DistilBERT",
            "size": "67MB",
            "load_time": round(load_time * 1000, 2),
            "device": "cuda" if torch.cuda.is_available() else "cpu"
        }
        
        logger.info(f"✅ Model loaded successfully in {load_time:.2f}s on {model_info['device']}")
        
        # Test the model
        test_result = sentiment_pipeline("I love this!")
        logger.info(f"🧪 Model test result: {test_result}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}")
        raise e

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "ML Portfolio Sentiment API",
        "status": "healthy",
        "model_loaded": sentiment_pipeline is not None
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": sentiment_pipeline is not None,
        "model_info": model_info if sentiment_pipeline else None,
        "timestamp": time.time()
    }

@app.post("/api/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of the provided text
    
    Returns:
        SentimentResponse with label, confidence, scores, and timing info
    """
    if sentiment_pipeline is None:
        raise HTTPException(
            status_code=503, 
            detail="Model not loaded. Please wait for model initialization."
        )
    
    try:
        start_time = time.time()
        
        # Clean and validate input
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Truncate if too long (DistilBERT max length is 512 tokens)
        if len(text) > 500:
            text = text[:500]
            logger.warning(f"Text truncated to 500 characters")
        
        # Run inference
        logger.info(f"🤖 Analyzing sentiment for: {text[:50]}...")
        results = sentiment_pipeline(text)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Process results - results is a list of dictionaries with label and score
        if not results or len(results) == 0:
            raise HTTPException(status_code=500, detail="No results from model")
        
        # Find the highest confidence prediction
        best_result = max(results, key=lambda x: x['score'])
        label = best_result['label'].upper()
        confidence = best_result['score']
        
        # Create scores dictionary
        scores = {}
        for result in results:
            scores[result['label'].lower()] = result['score']
        
        # Ensure we have both positive and negative scores
        if 'positive' not in scores:
            scores['positive'] = 1.0 - scores.get('negative', 0.0)
        if 'negative' not in scores:
            scores['negative'] = 1.0 - scores.get('positive', 0.0)
        
        response = SentimentResponse(
            label=label,
            confidence=confidence,
            scores=scores,
            processing_time=round(processing_time, 2),
            model_info=model_info
        )
        
        logger.info(f"✅ Analysis complete: {label} ({confidence:.3f}) in {processing_time:.2f}ms")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Sentiment analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Sentiment analysis failed: {str(e)}"
        )

@app.get("/api/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if sentiment_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_info": model_info,
        "capabilities": [
            "Binary sentiment classification",
            "Confidence scoring",
            "Fast inference",
            "Robust preprocessing"
        ],
        "limitations": [
            "English text only",
            "Max 500 characters",
            "Binary classification (positive/negative)",
            "May struggle with sarcasm"
        ]
    }

@app.on_event("shutdown")
async def cleanup():
    """Cleanup resources on shutdown"""
    global sentiment_pipeline
    if sentiment_pipeline is not None:
        del sentiment_pipeline
        sentiment_pipeline = None
        # Force garbage collection
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("🧹 Model resources cleaned up")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)