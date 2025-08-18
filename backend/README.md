# FastAPI Sentiment Analysis Backend

This FastAPI backend provides BERT-based sentiment analysis for the ML portfolio demo.

## Features

- **BERT Model**: Uses DistilBERT for fast, accurate sentiment analysis
- **Real-time API**: `/api/sentiment` endpoint for instant analysis
- **Model Info**: `/api/model-info` endpoint for model details
- **Health Checks**: `/api/health` for monitoring
- **CORS Enabled**: Ready for frontend integration

## Quick Start

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the Server**:
   ```bash
   python main.py
   ```
   
   Or with uvicorn:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Test the API**:
   ```bash
   curl -X POST "http://localhost:8000/api/sentiment" \
        -H "Content-Type: application/json" \
        -d '{"text": "I love this product!"}'
   ```

## API Endpoints

### POST `/api/sentiment`
Analyze sentiment of provided text.

**Request**:
```json
{
  "text": "I love this product!"
}
```

**Response**:
```json
{
  "label": "POSITIVE",
  "confidence": 0.9998,
  "scores": {
    "positive": 0.9998,
    "negative": 0.0002
  },
  "processing_time": 45.2,
  "model_info": {
    "name": "distilbert-base-uncased-finetuned-sst-2-english",
    "architecture": "DistilBERT",
    "size": "67MB",
    "device": "cpu"
  }
}
```

### GET `/api/health`
Health check endpoint.

### GET `/api/model-info`
Get detailed model information.

## Model Details

- **Model**: DistilBERT Base Uncased (SST-2 fine-tuned)
- **Size**: ~67MB
- **Accuracy**: ~92.8% on SST-2 dataset
- **Speed**: ~50ms inference time on CPU
- **Languages**: English only

## Production Deployment

For production deployment:

1. **Environment Variables**:
   ```bash
   export MODEL_NAME="distilbert-base-uncased-finetuned-sst-2-english"
   export MAX_TEXT_LENGTH=500
   export CORS_ORIGINS="https://yourdomain.com"
   ```

2. **Docker** (optional):
   ```dockerfile
   FROM python:3.9-slim
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY main.py .
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

3. **Reverse Proxy**: Use nginx or similar for production serving.

## Performance

- **CPU**: ~50ms per request
- **GPU**: ~15ms per request (if CUDA available)
- **Memory**: ~200MB base + ~120MB per model
- **Throughput**: ~20 requests/second on CPU