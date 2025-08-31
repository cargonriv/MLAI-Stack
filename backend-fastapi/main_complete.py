import os
import json
import numpy as np
from typing import List, Optional
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from llama_cpp import Llama
from sse_starlette.sse import EventSourceResponse
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

app = FastAPI(title="ML Portfolio RAG API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models and data
embedding_model = None
workspace_embeddings = []
llm = None

def load_models():
    """Load embedding model, LLM, and workspace embeddings"""
    global embedding_model, workspace_embeddings, llm
    
    print("🚀 Loading models and embeddings...")
    
    # Load embedding model (same as used in frontend)
    try:
        print("📊 Loading embedding model...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load embedding model: {e}")
        embedding_model = None
    
    # Load workspace embeddings
    try:
        embeddings_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'workspace_embeddings.json'))
        print(f"📁 Loading workspace embeddings from: {embeddings_path}")
        
        if os.path.exists(embeddings_path):
            with open(embeddings_path, 'r', encoding='utf-8') as f:
                workspace_embeddings = json.load(f)
            print(f"✅ Loaded {len(workspace_embeddings)} document chunks!")
        else:
            print(f"⚠️ Embeddings file not found at {embeddings_path}")
            workspace_embeddings = []
    except Exception as e:
        print(f"❌ Failed to load workspace embeddings: {e}")
        workspace_embeddings = []
    
    # Load LLM
    model_filename = "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'models-backup', model_filename))
    
    if not os.path.exists(model_path):
        print(f"❌ LLM model not found at {model_path}")
        print(f"Please download the model from https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/{model_filename}")
        llm = None
    else:
        try:
            print(f"🧠 Loading LLM from: {model_path}")
            llm = Llama(model_path=model_path, n_gpu_layers=-1)
            print("✅ LLM loaded successfully!")
        except Exception as e:
            print(f"❌ Failed to load LLM: {e}")
            llm = None

# Load models on startup
load_models()

class ChatRequest(BaseModel):
    prompt: str
    use_rag: Optional[bool] = True
    max_context_chunks: Optional[int] = 5
    similarity_threshold: Optional[float] = 0.3

class DocumentChunk(BaseModel):
    id: str
    filePath: str
    chunkIndex: int
    content: str
    similarity_score: float

class RAGResponse(BaseModel):
    query: str
    relevant_chunks: List[DocumentChunk]
    context_used: str
    response: str

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    a_np = np.array(a)
    b_np = np.array(b)
    return np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np))

def find_relevant_chunks(query: str, max_chunks: int = 5, threshold: float = 0.3) -> List[DocumentChunk]:
    """Find relevant document chunks using vector similarity"""
    if not embedding_model or not workspace_embeddings:
        return []
    
    try:
        # Generate embedding for the query
        query_embedding = embedding_model.encode(query).tolist()
        
        # Calculate similarities
        similarities = []
        for doc in workspace_embeddings:
            if 'embedding' in doc and doc['embedding']:
                similarity = cosine_similarity(query_embedding, doc['embedding'])
                if similarity >= threshold:
                    similarities.append({
                        'doc': doc,
                        'similarity': similarity
                    })
        
        # Sort by similarity and take top chunks
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        relevant_chunks = []
        for item in similarities[:max_chunks]:
            doc = item['doc']
            relevant_chunks.append(DocumentChunk(
                id=doc['id'],
                filePath=doc['filePath'],
                chunkIndex=doc['chunkIndex'],
                content=doc['content'],
                similarity_score=item['similarity']
            ))
        
        return relevant_chunks
        
    except Exception as e:
        print(f"Error finding relevant chunks: {e}")
        return []

def create_rag_prompt(user_query: str, relevant_chunks: List[DocumentChunk]) -> str:
    """Create a RAG prompt with context"""
    if not relevant_chunks:
        return f"User: {user_query}\nAssistant:"
    
    context_parts = []
    for chunk in relevant_chunks:
        context_parts.append(f"From {chunk.filePath}:\n{chunk.content}")
    
    context = "\n\n".join(context_parts)
    
    prompt = f"""You are an AI assistant helping users understand Carlos Gonzalez Rivera's ML portfolio and projects. Use the following context from his codebase and documentation to answer the user's question accurately and helpfully.

Context:
{context}

User Question: {user_query}