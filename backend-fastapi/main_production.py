import os
import json
import torch
from typing import List
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
import random
import time

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

@app.on_event("startup")
def load_models():
    """Load embedding model and workspace embeddings"""
    global embedding_model, workspace_embeddings
    
    print("🚀 Loading models and embeddings...")
    
    try:
        print("📊 Loading embedding model...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load embedding model: {e}")
        embedding_model = None

    try:
        print("📂 Loading workspace embeddings...")
        # Corrected path for production environment
        embeddings_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'workspace_embeddings.json')
        with open(embeddings_path, "r") as f:
            workspace_embeddings = json.load(f)
        print(f"✅ Loaded {len(workspace_embeddings)} workspace embeddings.")
    except Exception as e:
        print(f"❌ Failed to load workspace embeddings: {e}")
        workspace_embeddings = []

class ChatRequest(BaseModel):
    prompt: str
    use_rag: bool = True
    max_context_chunks: int = 3
    
class ChatResponse(BaseModel):
    response: str
    method: str
    processing_time: float
    context_used: List[dict] = []

@app.get("/")
async def root():
    return {"message": "ML Portfolio RAG API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "embedding_model_loaded": embedding_model is not None,
        "workspace_embeddings_loaded": len(workspace_embeddings) > 0,
        "version": "1.0.0"
    }

def retrieve_context(query: str, top_k: int = 3) -> List[dict]:
    """
    Retrieves the most relevant context from workspace embeddings based on the query.
    """
    if not embedding_model or not workspace_embeddings:
        print("Embedding model or workspace embeddings not loaded.")
        return []

    query_embedding = embedding_model.encode(query, convert_to_tensor=True).cpu()
    
    corpus_embeddings_list = [doc["embedding"] for doc in workspace_embeddings]
    corpus_embeddings_tensor = torch.tensor(corpus_embeddings_list).cpu()
    corpus_embeddings_tensor = util.normalize_embeddings(corpus_embeddings_tensor)

    cosine_scores = util.cos_sim(query_embedding, corpus_embeddings_tensor)[0]
    top_results = torch.topk(cosine_scores, k=min(top_k, len(workspace_embeddings)))

    context = []
    for score, idx in zip(top_results[0], top_results[1]):
        doc = workspace_embeddings[idx.item()]
        context.append({
            "filePath": doc['filePath'],
            "chunkIndex": doc['chunkIndex'],
            "content": doc['content'],
            "score": score.item()
        })
    
    return context

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Handle chat requests with RAG context retrieval"""
    start_time = time.time()
    
    try:
        context_used = retrieve_context(request.prompt, top_k=request.max_context_chunks)
        
        if context_used:
            # Format the response to be more conversational
            formatted_context = "\n\n".join([
                f"From file: {ctx['filePath']}\nContent: {ctx['content']}" 
                for ctx in context_used
            ])
            response_text = (
                f"Based on your query, I found the following relevant information from my knowledge base:\n\n"
                f"{formatted_context}"
            )
            method = "rag"
        else:
            response_text = "I couldn't find any specific information related to your query in my document knowledge base. Please try rephrasing your question."
            method = "no_context_found"
            
        processing_time = time.time() - start_time
        
        return ChatResponse(
            response=response_text,
            method=method,
            processing_time=processing_time,
            context_used=context_used
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
