"""
FastAPI backend for BERT sentiment analysis
Provides /api/sentiment endpoint for real-time sentiment analysis
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import logging
import time
import asyncio
import psutil
import threading
from typing import Dict, Any, Optional
from collections import defaultdict, deque
from datetime import datetime, timedelta
import torch
import gc
import os

# Configure enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('sentiment_api.log') if os.path.exists('.') else logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Performance monitoring
class PerformanceMonitor:
    def __init__(self):
        self.request_times = deque(maxlen=1000)  # Keep last 1000 requests
        self.request_counts = defaultdict(int)
        self.error_counts = defaultdict(int)
        self.memory_usage = deque(maxlen=100)  # Keep last 100 memory readings
        self.start_time = time.time()
        self.lock = threading.Lock()
    
    def record_request(self, processing_time: float, status: str = "success"):
        with self.lock:
            self.request_times.append(processing_time)
            self.request_counts[status] += 1
            
    def record_error(self, error_type: str):
        with self.lock:
            self.error_counts[error_type] += 1
    
    def record_memory_usage(self):
        try:
            memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
            with self.lock:
                self.memory_usage.append(memory_mb)
        except Exception:
            pass  # Ignore memory monitoring errors
    
    def get_stats(self):
        with self.lock:
            if not self.request_times:
                return {
                    "total_requests": 0,
                    "avg_processing_time": 0,
                    "min_processing_time": 0,
                    "max_processing_time": 0,
                    "requests_per_minute": 0,
                    "error_rate": 0,
                    "uptime_seconds": time.time() - self.start_time,
                    "memory_usage_mb": 0
                }
            
            avg_time = sum(self.request_times) / len(self.request_times)
            total_requests = sum(self.request_counts.values())
            total_errors = sum(self.error_counts.values())
            uptime = time.time() - self.start_time
            requests_per_minute = (total_requests / uptime) * 60 if uptime > 0 else 0
            error_rate = (total_errors / total_requests) * 100 if total_requests > 0 else 0
            current_memory = self.memory_usage[-1] if self.memory_usage else 0
            
            return {
                "total_requests": total_requests,
                "avg_processing_time": round(avg_time, 2),
                "min_processing_time": round(min(self.request_times), 2),
                "max_processing_time": round(max(self.request_times), 2),
                "requests_per_minute": round(requests_per_minute, 2),
                "error_rate": round(error_rate, 2),
                "uptime_seconds": round(uptime, 2),
                "memory_usage_mb": round(current_memory, 2),
                "request_counts": dict(self.request_counts),
                "error_counts": dict(self.error_counts)
            }

# Device detection and optimization
class DeviceManager:
    def __init__(self):
        self.device_info = self._detect_device()
        self.optimization_settings = self._get_optimization_settings()
    
    def _detect_device(self):
        device_info = {
            "cuda_available": torch.cuda.is_available(),
            "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "cpu_count": os.cpu_count(),
            "total_memory_gb": round(psutil.virtual_memory().total / (1024**3), 2)
        }
        
        if device_info["cuda_available"]:
            device_info["cuda_device_name"] = torch.cuda.get_device_name(0)
            device_info["cuda_memory_gb"] = round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
            device_info["recommended_device"] = "cuda"
        else:
            device_info["recommended_device"] = "cpu"
        
        return device_info
    
    def _get_optimization_settings(self):
        if self.device_info["cuda_available"]:
            return {
                "device": 0,  # Use first GPU
                "batch_size": 8,
                "max_length": 512,
                "use_fast_tokenizer": True,
                "torch_dtype": torch.float16 if torch.cuda.is_available() else torch.float32
            }
        else:
            return {
                "device": -1,  # Use CPU
                "batch_size": 1,
                "max_length": 256,  # Reduce for CPU
                "use_fast_tokenizer": True,
                "torch_dtype": torch.float32
            }

# Model cache and memory management
class ModelCache:
    def __init__(self):
        self.cache = {}
        self.access_times = {}
        self.max_cache_size = 3  # Maximum number of models to cache
        self.lock = threading.Lock()
    
    def get_model(self, model_name: str):
        with self.lock:
            if model_name in self.cache:
                self.access_times[model_name] = time.time()
                return self.cache[model_name]
            return None
    
    def set_model(self, model_name: str, model):
        with self.lock:
            # Remove oldest model if cache is full
            if len(self.cache) >= self.max_cache_size:
                oldest_model = min(self.access_times.keys(), key=lambda k: self.access_times[k])
                del self.cache[oldest_model]
                del self.access_times[oldest_model]
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            
            self.cache[model_name] = model
            self.access_times[model_name] = time.time()
    
    def clear_cache(self):
        with self.lock:
            self.cache.clear()
            self.access_times.clear()
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

# Global instances
performance_monitor = PerformanceMonitor()
device_manager = DeviceManager()
model_cache = ModelCache()

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

# Request timeout settings
REQUEST_TIMEOUT = 30.0  # 30 seconds timeout for requests

class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Text to analyze")

class SentimentResponse(BaseModel):
    label: str = Field(..., description="Sentiment label (POSITIVE/NEGATIVE)")
    confidence: float = Field(..., description="Confidence score (0-1)")
    scores: Dict[str, float] = Field(..., description="Individual class scores")
    processing_time: float = Field(..., description="Processing time in milliseconds")
    model_info: Dict[str, Any] = Field(..., description="Model information")

@app.on_event("startup")
async def load_model():
    """Load the BERT sentiment analysis model at startup with optimizations"""
    global sentiment_pipeline, model_info
    
    try:
        logger.info("🚀 Loading BERT sentiment analysis model with optimizations...")
        logger.info(f"🔧 Device info: {device_manager.device_info}")
        
        start_time = time.time()
        
        # Use DistilBERT for faster inference while maintaining good accuracy
        model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        
        # Check cache first
        cached_pipeline = model_cache.get_model(model_name)
        if cached_pipeline:
            sentiment_pipeline = cached_pipeline
            logger.info("📦 Using cached model")
        else:
            # Load the pipeline with device optimizations
            optimization_settings = device_manager.optimization_settings
            
            sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=model_name,
                tokenizer=model_name,
                return_all_scores=True,
                device=optimization_settings["device"],
                torch_dtype=optimization_settings["torch_dtype"],
                use_fast=optimization_settings["use_fast_tokenizer"]
            )
            
            # Cache the model
            model_cache.set_model(model_name, sentiment_pipeline)
        
        load_time = time.time() - start_time
        
        # Store enhanced model information (ensure JSON serializable)
        serializable_optimization_settings = {
            k: (str(v) if hasattr(v, '__module__') and 'torch' in str(type(v)) else v)
            for k, v in device_manager.optimization_settings.items()
        }
        
        model_info = {
            "name": model_name,
            "architecture": "DistilBERT",
            "size": "67MB",
            "load_time": round(load_time * 1000, 2),
            "device": device_manager.device_info["recommended_device"],
            "device_info": device_manager.device_info,
            "optimization_settings": serializable_optimization_settings,
            "cache_enabled": True
        }
        
        logger.info(f"✅ Model loaded successfully in {load_time:.2f}s on {model_info['device']}")
        
        # Test the model with timeout
        try:
            test_start = time.time()
            test_result = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, lambda: sentiment_pipeline("I love this!")
                ),
                timeout=10.0
            )
            test_time = (time.time() - test_start) * 1000
            logger.info(f"🧪 Model test result: {test_result} (took {test_time:.2f}ms)")
            
            # Record initial memory usage
            performance_monitor.record_memory_usage()
            
        except asyncio.TimeoutError:
            logger.warning("⚠️ Model test timed out, but model should still work")
        
        # Start background memory monitoring
        asyncio.create_task(background_monitoring())
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}")
        performance_monitor.record_error("model_loading_error")
        raise e

async def background_monitoring():
    """Background task to monitor system performance"""
    while True:
        try:
            performance_monitor.record_memory_usage()
            await asyncio.sleep(60)  # Monitor every minute
        except Exception as e:
            logger.error(f"Background monitoring error: {e}")
            await asyncio.sleep(60)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "ML Portfolio Sentiment API",
        "status": "healthy",
        "model_loaded": sentiment_pipeline is not None
    }

@app.get("/health")
async def health_check():
    """Kubernetes/Docker health check endpoint"""
    if sentiment_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy"}

@app.get("/api/health")
async def detailed_health_check():
    """Detailed health check with comprehensive status"""
    health_status = {
        "status": "healthy" if sentiment_pipeline is not None else "unhealthy",
        "model_loaded": sentiment_pipeline is not None,
        "model_info": model_info if sentiment_pipeline else None,
        "timestamp": time.time(),
        "uptime_seconds": time.time() - performance_monitor.start_time,
        "version": "1.0.0"
    }
    
    # Add system health metrics
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        health_status["system_health"] = {
            "cpu_percent": process.cpu_percent(),
            "memory_mb": round(memory_info.rss / 1024 / 1024, 2),
            "memory_percent": process.memory_percent(),
            "threads": process.num_threads(),
            "disk_usage_percent": psutil.disk_usage('/').percent
        }
    except Exception as e:
        health_status["system_health"] = {"error": str(e)}
    
    # Add performance health indicators
    stats = performance_monitor.get_stats()
    health_status["performance_health"] = {
        "total_requests": stats["total_requests"],
        "error_rate": stats["error_rate"],
        "avg_response_time": stats["avg_processing_time"],
        "requests_per_minute": stats["requests_per_minute"]
    }
    
    return health_status

@app.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    if sentiment_pipeline is None:
        raise HTTPException(status_code=503, detail="Service not ready - model not loaded")
    
    # Test model with a simple prediction
    try:
        test_result = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None, lambda: sentiment_pipeline("test")
            ),
            timeout=5.0
        )
        return {"status": "ready", "model_responsive": True}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service not ready - model test failed: {str(e)}")

@app.get("/metrics")
async def prometheus_metrics():
    """Prometheus-compatible metrics endpoint"""
    stats = performance_monitor.get_stats()
    
    # Generate Prometheus format metrics
    metrics = []
    metrics.append(f"# HELP sentiment_api_requests_total Total number of requests")
    metrics.append(f"# TYPE sentiment_api_requests_total counter")
    metrics.append(f"sentiment_api_requests_total {stats['total_requests']}")
    
    metrics.append(f"# HELP sentiment_api_request_duration_seconds Request duration in seconds")
    metrics.append(f"# TYPE sentiment_api_request_duration_seconds histogram")
    metrics.append(f"sentiment_api_request_duration_seconds_sum {stats['avg_processing_time'] * stats['total_requests'] / 1000}")
    metrics.append(f"sentiment_api_request_duration_seconds_count {stats['total_requests']}")
    
    metrics.append(f"# HELP sentiment_api_errors_total Total number of errors")
    metrics.append(f"# TYPE sentiment_api_errors_total counter")
    metrics.append(f"sentiment_api_errors_total {sum(stats['error_counts'].values())}")
    
    metrics.append(f"# HELP sentiment_api_uptime_seconds Service uptime in seconds")
    metrics.append(f"# TYPE sentiment_api_uptime_seconds counter")
    metrics.append(f"sentiment_api_uptime_seconds {stats['uptime_seconds']}")
    
    try:
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        metrics.append(f"# HELP sentiment_api_memory_usage_bytes Memory usage in bytes")
        metrics.append(f"# TYPE sentiment_api_memory_usage_bytes gauge")
        metrics.append(f"sentiment_api_memory_usage_bytes {process.memory_info().rss}")
        
        metrics.append(f"# HELP sentiment_api_cpu_usage_percent CPU usage percentage")
        metrics.append(f"# TYPE sentiment_api_cpu_usage_percent gauge")
        metrics.append(f"sentiment_api_cpu_usage_percent {process.cpu_percent()}")
    except Exception:
        pass
    
    return "\n".join(metrics)

@app.post("/api/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest, http_request: Request):
    """
    Analyze sentiment of the provided text with performance optimizations
    
    Returns:
        SentimentResponse with label, confidence, scores, and timing info
    """
    if sentiment_pipeline is None:
        performance_monitor.record_error("model_not_loaded")
        raise HTTPException(
            status_code=503, 
            detail="Model not loaded. Please wait for model initialization."
        )
    
    request_start_time = time.time()
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    try:
        # Clean and validate input
        text = request.text.strip()
        if not text:
            performance_monitor.record_error("empty_text")
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Enhanced text preprocessing with optimization settings
        max_length = device_manager.optimization_settings["max_length"]
        if len(text) > max_length:
            text = text[:max_length]
            logger.warning(f"Text truncated to {max_length} characters for optimization")
        
        # Log request details
        logger.info(f"🤖 Processing request from {client_ip}: {text[:50]}{'...' if len(text) > 50 else ''}")
        
        # Run inference with timeout
        inference_start = time.time()
        try:
            results = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, lambda: sentiment_pipeline(text)
                ),
                timeout=REQUEST_TIMEOUT
            )
        except asyncio.TimeoutError:
            performance_monitor.record_error("request_timeout")
            logger.error(f"⏰ Request timed out after {REQUEST_TIMEOUT}s for client {client_ip}")
            raise HTTPException(
                status_code=408, 
                detail=f"Request timed out after {REQUEST_TIMEOUT} seconds"
            )
        
        inference_time = (time.time() - inference_start) * 1000
        total_processing_time = (time.time() - request_start_time) * 1000
        
        # Process results - results might be nested list structure
        if not results or len(results) == 0:
            performance_monitor.record_error("no_results")
            raise HTTPException(status_code=500, detail="No results from model")
        
        # Handle nested list structure from pipeline
        if isinstance(results[0], list):
            results = results[0]
        
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
        
        # Enhanced model info with performance metrics (ensure JSON serializable)
        enhanced_model_info = {
            **{k: (str(v) if hasattr(v, '__module__') and 'torch' in str(type(v)) else v) 
               for k, v in model_info.items()},
            "inference_time_ms": round(inference_time, 2),
            "total_processing_time_ms": round(total_processing_time, 2),
            "text_length": len(request.text),
            "truncated": len(request.text) > max_length
        }
        
        response = SentimentResponse(
            label=label,
            confidence=confidence,
            scores=scores,
            processing_time=round(total_processing_time, 2),
            model_info=enhanced_model_info
        )
        
        # Record performance metrics
        performance_monitor.record_request(total_processing_time, "success")
        
        logger.info(f"✅ Analysis complete for {client_ip}: {label} ({confidence:.3f}) "
                   f"in {total_processing_time:.2f}ms (inference: {inference_time:.2f}ms)")
        
        return response
        
    except HTTPException:
        performance_monitor.record_request(
            (time.time() - request_start_time) * 1000, 
            "http_error"
        )
        raise
    except Exception as e:
        processing_time = (time.time() - request_start_time) * 1000
        performance_monitor.record_request(processing_time, "error")
        performance_monitor.record_error("processing_error")
        
        logger.error(f"❌ Sentiment analysis failed for {client_ip}: {str(e)} "
                    f"(took {processing_time:.2f}ms)")
        raise HTTPException(
            status_code=500, 
            detail=f"Sentiment analysis failed: {str(e)}"
        )

@app.get("/api/model-info")
async def get_model_info():
    """Get comprehensive information about the loaded model and performance"""
    if sentiment_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_info": model_info,
        "performance_stats": performance_monitor.get_stats(),
        "device_info": device_manager.device_info,
        "optimization_settings": device_manager.optimization_settings,
        "capabilities": [
            "Binary sentiment classification",
            "Confidence scoring",
            "Fast inference with GPU/CPU optimization",
            "Robust preprocessing",
            "Request timeout handling",
            "Performance monitoring",
            "Memory management"
        ],
        "limitations": [
            "English text only",
            f"Max {device_manager.optimization_settings['max_length']} characters",
            "Binary classification (positive/negative)",
            "May struggle with sarcasm",
            f"Request timeout: {REQUEST_TIMEOUT}s"
        ]
    }

@app.get("/api/performance")
async def get_performance_stats():
    """Get detailed performance statistics"""
    stats = performance_monitor.get_stats()
    
    # Add current system metrics
    try:
        process = psutil.Process()
        stats["system_metrics"] = {
            "cpu_percent": process.cpu_percent(),
            "memory_percent": process.memory_percent(),
            "memory_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "threads": process.num_threads(),
            "open_files": len(process.open_files()) if hasattr(process, 'open_files') else 0
        }
    except Exception as e:
        logger.warning(f"Could not get system metrics: {e}")
        stats["system_metrics"] = {"error": "Could not retrieve system metrics"}
    
    return stats

@app.post("/api/performance/reset")
async def reset_performance_stats():
    """Reset performance statistics (for testing/debugging)"""
    global performance_monitor
    performance_monitor = PerformanceMonitor()
    return {"message": "Performance statistics reset successfully"}

@app.on_event("shutdown")
async def cleanup():
    """Enhanced cleanup with performance monitoring"""
    global sentiment_pipeline
    
    logger.info("🧹 Starting enhanced cleanup process...")
    
    # Log final performance stats
    final_stats = performance_monitor.get_stats()
    logger.info(f"📊 Final performance stats: {final_stats}")
    
    # Clear model cache
    model_cache.clear_cache()
    
    # Clean up main model
    if sentiment_pipeline is not None:
        del sentiment_pipeline
        sentiment_pipeline = None
    
    # Force garbage collection and GPU memory cleanup
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        logger.info("🔧 GPU memory cache cleared")
    
    logger.info("✅ Enhanced cleanup completed successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)