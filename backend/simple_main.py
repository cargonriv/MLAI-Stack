"""
Simple FastAPI backend for BERT sentiment analysis
Minimal implementation for testing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ML Portfolio Sentiment API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
sentiment_pipeline = None

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    label: str
    confidence: float
    scores: dict
    processing_time: float
    model_info: dict

def load_model():
    """Load the BERT sentiment analysis model"""
    global sentiment_pipeline
    
    try:
        logger.info("🚀 Loading BERT sentiment analysis model...")
        
        from transformers import pipeline
        
        # Load the pipeline
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            return_all_scores=True
        )
        
        logger.info("✅ Model loaded successfully!")
        
        # Test the model
        test_result = sentiment_pipeline("I love this!")
        logger.info(f"🧪 Model test result: {test_result}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}")
        return False

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "ML Portfolio Sentiment API",
        "status": "healthy",
        "model_loaded": sentiment_pipeline is not None
    }

@app.get("/api/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": sentiment_pipeline is not None,
        "timestamp": time.time()
    }

@app.post("/api/sentiment", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of the provided text"""
    
    # Load model if not already loaded
    if sentiment_pipeline is None:
        logger.info("Model not loaded, loading now...")
        if not load_model():
            raise HTTPException(status_code=503, detail="Failed to load model")
    
    try:
        start_time = time.time()
        
        # Clean and validate input
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Truncate if too long
        if len(text) > 500:
            text = text[:500]
        
        # Run inference
        logger.info(f"🤖 Analyzing sentiment for: {text[:50]}...")
        results = sentiment_pipeline(text)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Process results
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
            model_info={
                "name": "distilbert-base-uncased-finetuned-sst-2-english",
                "architecture": "DistilBERT",
                "size": "67MB",
                "device": "cpu"
            }
        )
        
        logger.info(f"✅ Analysis complete: {label} ({confidence:.3f}) in {processing_time:.2f}ms")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)