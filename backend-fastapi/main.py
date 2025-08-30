import os
import json
from fastapi import FastAPI, Request
from pydantic import BaseModel
from llama_cpp import Llama
from sse_starlette.sse import EventSourceResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Construct the absolute path to the model directory
model_filename = "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'models-backup', model_filename))

if not os.path.exists(model_path):
    print(f"Model not found at {model_path}")
    print(f"Please download the model from https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/{model_filename} and place it in the public/models-backup directory.")
    llm = None
else:
    print(f"Loading model from: {model_path}")
    llm = Llama(model_path=model_path, n_gpu_layers=-1)  # Offload all layers to GPU

class ChatRequest(BaseModel):
    prompt: str

@app.post("/chat")
async def chat(req: ChatRequest):
    if llm is None:
        return {"error": "Model not found"}, 500

    # stream = llm(req.prompt, max_tokens=50, stream=True)  # Reduced max_tokens
    stream = llm(req.prompt, max_tokens=256, stream=True)

    async def event_generator():
        for output in stream:
            if "choices" in output and len(output["choices"]) > 0 and "text" in output["choices"][0]:
                text_content = output["choices"][0]["text"]
                json_dumped_text = json.dumps(text_content)
                print(f"DEBUG: json_dumped_text = {json_dumped_text}")
                yield f"data: {json.dumps(text_content)}".encode('utf-8')

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
