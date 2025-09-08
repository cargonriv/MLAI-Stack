import os
import json
import torch
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import asyncio
from llama_cpp import Llama
from huggingface_hub import hf_hub_download
from sentence_transformers import SentenceTransformer, util
from pydantic import BaseModel # Added this line

# Load environment variables
load_dotenv()

class ChatRequest(BaseModel): # Added this block
    prompt: str
    max_new_tokens: int = 512
    temperature: float = 0.7

# Configuration
MODEL_REPO = os.getenv("MODEL_REPO")
MODEL_FILE = os.getenv("MODEL_FILE")
if not MODEL_REPO or not MODEL_FILE:
    raise RuntimeError("MODEL_REPO or MODEL_FILE environment variable not set.")

# FastAPI app
app = FastAPI(title="LLM Backend API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity, adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models and embeddings
llm = None
workspace_embeddings = []
embedding_model = None

@app.on_event("startup")
async def load_model():
    """Load the GGUF model, embeddings, and embedding model on startup."""
    global llm, workspace_embeddings, embedding_model
    
    try:
        print(f"Downloading model from repo: {MODEL_REPO}...")
        model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
        print(f"Model downloaded to: {model_path}")

        print("Loading LLM...")
        llm = Llama(
            model_path=model_path,
            n_gpu_layers=0, # Offload all layers to GPU
            n_ctx=1024, # Context window
        )
        print("LLM loaded successfully.")

        print("Loading workspace embeddings...")
        with open("../public/workspace_embeddings.json", "r") as f:
            workspace_embeddings = json.load(f)
        print(f"Loaded {len(workspace_embeddings)} workspace embeddings.")

        print("Loading embedding model...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Embedding model loaded successfully.")

    except Exception as e:
        print(f"Failed to load models or embeddings: {e}")
        llm = None
        workspace_embeddings = []
        embedding_model = None


@app.get("/")
def root():
    return {"message": "LLM Backend is running."}

def retrieve_context(query: str, top_k: int = 3) -> str:
    """
    Retrieves the most relevant context from workspace embeddings based on the query.
    """
    if not embedding_model or not workspace_embeddings:
        print("Embedding model or workspace embeddings not loaded.")
        return ""

    query_embedding = embedding_model.encode(query, convert_to_tensor=True).cpu() # Ensure on CPU
    
    # Extract embeddings from loaded data and convert to tensor, ensure on CPU
    corpus_embeddings_list = [doc["embedding"] for doc in workspace_embeddings]
    corpus_embeddings_tensor = torch.tensor(corpus_embeddings_list).cpu()
    corpus_embeddings_tensor = util.normalize_embeddings(corpus_embeddings_tensor)

    # Compute cosine similarity between query and all document embeddings
    cosine_scores = util.cos_sim(query_embedding, corpus_embeddings_tensor)[0]

    # Sort the scores and get the top-k indices
    top_results = torch.topk(cosine_scores, k=top_k)

    context = []
    for score, idx in zip(top_results[0], top_results[1]):
        doc = workspace_embeddings[idx.item()] # Use .item() to get scalar from tensor
        context.append(f"File: {doc['filePath']}, Chunk: {doc['chunkIndex']}\nContent: {doc['content']}\n")
    
    return "\n".join(context)


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Handle chat requests with streaming, incorporating RAG.
    """
    prompt = request.prompt
    max_new_tokens = request.max_new_tokens
    temperature = request.temperature

    if not llm:
        raise HTTPException(status_code=503, detail="Model is not available.")

    # Retrieve relevant context
    context = retrieve_context(prompt)
    
    # Augment the prompt with context
    if context:
        augmented_prompt = (
            f"Based on the following context, answer the question concisely and directly. "
            f"If the context is not relevant, ignore it. Do not explain your reasoning or refer to the context."
            f"\n\nContext:\n{context}\n\n"
            f"Question: {prompt}\n\n"
            f"Answer:"
        )
    else:
        augmented_prompt = (
            f"Answer the following question concisely and directly. Do not explain your reasoning."
            f"\n\nQuestion: {prompt}\n\n"
            f"Answer:"
        )
    
    async def generate():
        try:
            stream = llm(
                augmented_prompt,
                max_tokens=max_new_tokens,
                temperature=temperature,
                stream=True,
            )
            
            for output in stream:
                yield output["choices"][0]["text"]
                # await asyncio.sleep(0.001)
            
            yield "[DONE]"

        except Exception as e:
            print(f"Error during generation: {e}")
            yield "Error generating response."

    return EventSourceResponse(generate())



if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
