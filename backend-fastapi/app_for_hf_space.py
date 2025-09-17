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
from threading import Thread
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TextIteratorStreamer
from fastapi.responses import StreamingResponse

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
llm_model = None # Global variable for the LLM model
llm_tokenizer = None # Global variable for the LLM tokenizer

@app.on_event("startup")
def load_models():
    """Load embedding model, workspace embeddings, and LLM"""
    global embedding_model, workspace_embeddings, llm_model, llm_tokenizer
    
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
        # Path for Hugging Face Space environment
        embeddings_path = 'workspace_embeddings.json'
        with open(embeddings_path, "r") as f:
            workspace_embeddings = json.load(f)
        print(f"✅ Loaded {len(workspace_embeddings)} workspace embeddings.")
    except Exception as e:
        print(f"❌ Failed to load workspace embeddings: {e}")
        workspace_embeddings = []

    try:
        print("🧠 Loading LLM model and tokenizer...")
        # Quantization is disabled for CPU performance
        # model_name = "HuggingFaceTB/SmolLM3-3B-Base"
        model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        
        llm_tokenizer = AutoTokenizer.from_pretrained(model_name)
        llm_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            # quantization_config=quantization_config, # Disabled for CPU performance
            device_map="auto", # Automatically maps model to available devices (GPU/CPU)
            dtype=torch.bfloat16, # Use dtype instead of torch_dtype
        )
        llm_model.eval() # Set model to evaluation mode
        print("✅ LLM model and tokenizer loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load LLM model or tokenizer: {e}")
        llm_model = None
        llm_tokenizer = None

class ChatRequest(BaseModel):
    prompt: str
    use_rag: bool = True
    max_context_chunks: int = 7
    
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
        "llm_model_loaded": llm_model is not None,
        "llm_tokenizer_loaded": llm_tokenizer is not None,
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

def ensure_complete_sentence(text: str) -> str:
    """Ensures the text ends with a complete sentence."""
    if not text:
        return text

    # Look for the last sentence-ending punctuation
    last_period = text.rfind('.')
    last_exclamation = text.rfind('!')
    last_question = text.rfind('?')

    last_punctuation_index = max(last_period, last_exclamation, last_question)

    if last_punctuation_index != -1:
        # Return text up to and including the last punctuation
        return text[:last_punctuation_index + 1].strip()
    else:
        # If no punctuation, and text is long, it might be incomplete.
        # For now, return as is, or consider a more advanced fallback.
        return text.strip()

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Handle chat requests with RAG context retrieval and LLM generation"""
    start_time = time.time()
    
    async def generate_stream_response():
        nonlocal start_time # Allow modification of start_time from outer scope
        try:
            context_used = retrieve_context(request.prompt, top_k=request.max_context_chunks)
            
            if context_used and llm_model and llm_tokenizer:
                # Build the prompt using the model's chat template
                system_prompt = "You are CargonBot, a helpful AI assistant for a project portfolio. Your goal is to answer questions about the portfolio and the person who created it, based on the provided context. Answer the user's question concisely based ONLY on the provided context. If the context is not relevant or not provided, have a simple, friendly conversation. Do not make up information or perform actions. You are a read-only assistant."
                
                prompt_parts = [f"<|system|>\n{system_prompt}"]

                if context_used:
                    formatted_context = "\n".join([ctx['content'] for ctx in context_used])
                    prompt_parts.append(f"<|user|>\nContext:\n{formatted_context}\n\nQuestion: {request.prompt}")
                else:
                    prompt_parts.append(f"<|user|>\n{request.prompt}")
                
                prompt_parts.append("<|assistant|>")
                prompt_for_llm = "\n".join(prompt_parts)
                
                # Tokenize the prompt to get input_ids and attention_mask
                inputs = llm_tokenizer(prompt_for_llm, return_tensors="pt").to(llm_model.device)
                
                # Set up the streamer for streaming generation
                streamer = TextIteratorStreamer(llm_tokenizer, skip_prompt=True, skip_special_tokens=True)

                # Generation arguments
                generation_kwargs = dict(
                    **inputs,
                    streamer=streamer,
                    # max_new_tokens=100,
                    num_return_sequences=1,
                    pad_token_id=llm_tokenizer.eos_token_id,
                    eos_token_id=llm_tokenizer.eos_token_id,
                    do_sample=True,
                    temperature=0.3, # Low temperature for less randomness
                    no_repeat_ngram_size=2,
                )

                # Run generation in a separate thread
                thread = Thread(target=llm_model.generate, kwargs=generation_kwargs)
                thread.start()

                # Yield generated tokens as they become available in SSE format
                for new_text in streamer:
                    if new_text:
                        payload = {"response": new_text, "processing_time": time.time() - start_time, "method": "rag_llm_stream"}
                        yield f"data: {json.dumps(payload)}\n\n"

            elif context_used and not llm_model:
                # Fallback to raw RAG output if LLM is not loaded
                formatted_context = "\n\n".join([
                    f"From file: {ctx['filePath']}\nContent: {ctx['content']}" 
                    for ctx in context_used
                ])
                response_text = (
                    f"Based on your query, I found the following relevant information from my knowledge base:\n\n"
                    f"{formatted_context}"
                )
                payload = {"response": response_text, "processing_time": time.time() - start_time, "method": "rag_no_llm"}
                yield f"data: {json.dumps(payload)}\n\n"
            else:
                response_text = "I couldn't find any specific information related to your query in my document knowledge base. Please try rephrasing your question."
                payload = {"response": response_text, "processing_time": time.time() - start_time, "method": "no_context_found"}
                yield f"data: {json.dumps(payload)}\n\n"
                
        except Exception as e:
            print(f"Error in chat endpoint: {e}")
            payload = {"response": f"Internal server error: {str(e)}", "processing_time": time.time() - start_time, "method": "error"}
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(generate_stream_response(), 
                             media_type="text/event-stream",
                             headers={'Cache-Control': 'no-cache',
                                      'X-Accel-Buffering': 'no'})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)