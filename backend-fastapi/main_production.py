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
from transformers import pipeline

app = FastAPI(title="ML Portfolio RAG API", version="1.0.0")

# Add CORS middleware
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080,https://cargonriv.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)

# Global variables for models and data
embedding_model = None
workspace_embeddings = []
llm_pipeline = None # Global variable for the LLM pipeline

@app.on_event("startup")
def load_models():
    """Load embedding model, workspace embeddings, and LLM"""
    global embedding_model, workspace_embeddings, llm_pipeline
    
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

    try:
        print("🧠 Loading LLM pipeline...")
        # Using a small, general-purpose model for demonstration
        llm_pipeline = pipeline("text-generation", model="gpt2")
        print("✅ LLM pipeline loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load LLM pipeline: {e}")
        llm_pipeline = None

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
        "llm_pipeline_loaded": llm_pipeline is not None,
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
    """Handle chat requests with RAG context retrieval and LLM generation"""
    start_time = time.time()
    
    try:
        context_used = retrieve_context(request.prompt, top_k=request.max_context_chunks)
        
        if context_used and llm_pipeline:
            # Prepare context for LLM
            formatted_context_for_llm = "\n".join([ctx['content'] for ctx in context_used])
            
            # Construct prompt for LLM
            prompt_for_llm = (
                f"Given the following context:

{formatted_context_for_llm}

"
                f"Answer the following question: {request.prompt}

"
                f"Answer:"
            )
            
            # Generate response using LLM
            # max_new_tokens and num_return_sequences are important for controlling output
            llm_output = llm_pipeline(prompt_for_llm, max_new_tokens=100, num_return_sequences=1)
            response_text = llm_output[0]['generated_text'].replace(prompt_for_llm, "").strip()
            
            # Fallback if LLM generates empty or irrelevant response
            if not response_text or len(response_text.split()) < 5:
                response_text = "I couldn't generate a specific answer based on the available information. Please try rephrasing your question or ask about something else."
                method = "llm_fallback"
            else:
                method = "rag_llm"
        elif context_used and not llm_pipeline:
            # Fallback to raw RAG output if LLM is not loaded
            formatted_context = "\n\n".join([
                f"From file: {ctx['filePath']}\nContent: {ctx['content']}" 
                for ctx in context_used
            ])
            response_text = (
                f"Based on your query, I found the following relevant information from my knowledge base:\n\n"
                f"{formatted_context}"
            )
            method = "rag_no_llm"
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
