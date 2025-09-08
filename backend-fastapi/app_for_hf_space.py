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
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
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
        # Configure 4-bit quantization
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
        
        model_name = "HuggingFaceTB/SmolLM3-3B-Base"
        
        llm_tokenizer = AutoTokenizer.from_pretrained(model_name)
        llm_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=quantization_config,
            device_map="auto", # Automatically maps model to available devices (GPU/CPU)
            torch_dtype=torch.bfloat16,
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
                # Prepare context for LLM
                formatted_context_for_llm = "\n".join([ctx['content'] for ctx in context_used])
                
                # Construct prompt for LLM
                prompt_for_llm = (
                    f"Given the following context:{formatted_context_for_llm}"
                    f"Answer the following question: {request.prompt}"
                    f"Answer:"
                )
                
                # Tokenize the prompt
                input_ids = llm_tokenizer.encode(prompt_for_llm, return_tensors="pt").to(llm_model.device)
                
                # Generate response using model.generate for more granular control
                # max_new_tokens is important for controlling output length
                # num_return_sequences=1 for single response
                # pad_token_id and eos_token_id are crucial for proper generation and stopping
                # no_repeat_ngram_size can prevent repetitive output
                # do_sample, top_p, temperature for controlling creativity
                
                # For now, let's just yield the full response at the end of generation,
                # but ensure the prompt removal and sentence completion are correct.
                # This will revert to non-streaming for now, but fix the logic.

                generation_output = llm_model.generate(
                    input_ids,
                    max_new_tokens=100,
                    num_return_sequences=1,
                    pad_token_id=llm_tokenizer.eos_token_id,
                    eos_token_id=llm_tokenizer.eos_token_id,
                    do_sample=True,
                    top_p=0.9,
                    temperature=0.7,
                    no_repeat_ngram_size=2,
                    return_dict_in_generate=True,
                    output_scores=True,
                )
                
                generated_text_raw = llm_tokenizer.decode(generation_output.sequences[0][input_ids.shape[-1]:], skip_special_tokens=True)

                # More robust prompt removal
                response_start_index = generated_text_raw.find("Answer:")
                if response_start_index != -1:
                    response_text = generated_text_raw[response_start_index + len("Answer:"):
].strip()
                else:
                    response_text = generated_text_raw.replace(prompt_for_llm, "").strip()
                
                # Ensure complete sentence
                final_response_text = ensure_complete_sentence(response_text)
                
                # Yield the final response as a single chunk
                yield json.dumps({"response": final_response_text, "processing_time": time.time() - start_time, "method": "rag_llm"}) + "\n"

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
                yield json.dumps({"response": response_text, "processing_time": time.time() - start_time, "method": "rag_no_llm"}) + "\n"
            else:
                response_text = "I couldn't find any specific information related to your query in my document knowledge base. Please try rephrasing your question."
                yield json.dumps({"response": response_text, "processing_time": time.time() - start_time, "method": "no_context_found"}) + "\n"
                
        except Exception as e:
            print(f"Error in chat endpoint: {e}")
            yield json.dumps({"response": f"Internal server error: {str(e)}", "processing_time": time.time() - start_time, "method": "error"}) + "\n"

    return StreamingResponse(generate_stream_response(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
