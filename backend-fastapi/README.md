# FastAPI RAG Backend for ML Portfolio

This directory contains a FastAPI backend that serves a local Hugging Face model with **Retrieval-Augmented Generation (RAG)** capabilities. The system combines vector similarity search with LLM generation to provide context-aware responses about Carlos Gonzalez Rivera's ML portfolio.

## Features

- **🧠 Local LLM**: Mistral-7B-Instruct-v0.2 for text generation
- **📊 Vector Search**: Sentence-Transformers for embedding-based retrieval
- **🔍 RAG Pipeline**: Context-aware responses using workspace embeddings
- **⚡ Streaming**: Real-time response generation
- **🌐 CORS Enabled**: Ready for frontend integration

## Architecture

```
User Query → Embedding Model → Vector Search → Context Retrieval → LLM + Context → Response
```

## Setup

### Automated Setup (Recommended)
```bash
python setup_rag.py
```

### Manual Setup

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Download LLM Model:** Download the GGUF model from [Hugging Face](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf) and place it in `../public/models-backup/`

4. **Generate Embeddings:** From the root directory, run:
   ```bash
   npm run generate:embeddings
   ```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns system status and loaded models.

### Vector Search
```bash
GET /search?query=machine learning&max_chunks=5&threshold=0.3
```
Search for relevant document chunks using vector similarity.

### RAG Chat (Streaming)
```bash
POST /chat
{
  "prompt": "What ML models are used in this portfolio?",
  "use_rag": true,
  "max_context_chunks": 5,
  "similarity_threshold": 0.3
}
```

### RAG Chat (Complete Response)
```bash
POST /chat-complete
```
Same as `/chat` but returns complete response instead of streaming.

## Running the Backend

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Production mode
python main.py
```

The server will be available at `http://localhost:8000`.

## Testing

Test the RAG functionality:
```bash
python test_rag.py
```

## Frontend Integration

The frontend chat component (`src/components/AdvancedTokenizedChat.tsx`) automatically uses RAG when available. The system will:

1. **Extract context** from your codebase using vector similarity
2. **Enhance prompts** with relevant code snippets and documentation  
3. **Generate responses** that reference specific files and implementations
4. **Provide citations** showing which files were used for context

## Configuration

Key parameters in the RAG system:

- **`similarity_threshold`**: Minimum similarity score for relevant chunks (0.0-1.0)
- **`max_context_chunks`**: Maximum number of context chunks to include
- **`temperature`**: LLM creativity level (0.0-1.0)
- **`max_tokens`**: Maximum response length

## Models Used

- **Embedding Model**: `all-MiniLM-L6-v2` (384-dimensional embeddings)
- **LLM**: `Mistral-7B-Instruct-v0.2` (4-bit quantized GGUF)
- **Vector Search**: Cosine similarity with numpy

## Performance

- **Cold start**: ~30-60 seconds (model loading)
- **Query processing**: ~100-500ms (embedding + search)
- **Response generation**: ~1-5 seconds (depending on length)
- **Memory usage**: ~4-8GB (with GPU acceleration)
