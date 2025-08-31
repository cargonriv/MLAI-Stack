"""
RAG endpoints for the FastAPI backend
"""

@app.get("/search")
async def search_documents(query: str, max_chunks: int = 5, threshold: float = 0.3):
    """Search for relevant document chunks"""
    if not embedding_model:
        raise HTTPException(status_code=503, detail="Embedding model not available")
    
    relevant_chunks = find_relevant_chunks(query, max_chunks, threshold)
    
    return {
        "query": query,
        "relevant_chunks": [chunk.dict() for chunk in relevant_chunks],
        "total_found": len(relevant_chunks)
    }

@app.post("/chat")
async def chat(req: ChatRequest):
    """Enhanced chat endpoint with RAG support"""
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM model not available")

    # Get relevant context if RAG is enabled
    relevant_chunks = []
    context_used = ""
    
    if req.use_rag and embedding_model and workspace_embeddings:
        relevant_chunks = find_relevant_chunks(
            req.prompt, 
            req.max_context_chunks, 
            req.similarity_threshold
        )
        
        if relevant_chunks:
            context_used = "\n\n".join([f"From {chunk.filePath}: {chunk.content}" for chunk in relevant_chunks])
            prompt = create_rag_prompt(req.prompt, relevant_chunks)
        else:
            prompt = req.prompt
    else:
        prompt = req.prompt

    print(f"🔍 Using RAG: {req.use_rag}, Found {len(relevant_chunks)} relevant chunks")
    
    # Generate response with streaming
    stream = llm(prompt, max_tokens=512, stream=True, temperature=0.7)

    async def event_generator():
        for output in stream:
            if "choices" in output and len(output["choices"]) > 0 and "text" in output["choices"][0]:
                text_content = output["choices"][0]["text"]
                yield f"data: {json.dumps(text_content)}".encode('utf-8')

    return EventSourceResponse(event_generator())

@app.post("/chat-complete")
async def chat_complete(req: ChatRequest) -> RAGResponse:
    """Complete chat response with RAG context (non-streaming)"""
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM model not available")

    # Get relevant context
    relevant_chunks = []
    context_used = ""
    
    if req.use_rag and embedding_model and workspace_embeddings:
        relevant_chunks = find_relevant_chunks(
            req.prompt, 
            req.max_context_chunks, 
            req.similarity_threshold
        )
        
        if relevant_chunks:
            context_used = "\n\n".join([f"From {chunk.filePath}: {chunk.content}" for chunk in relevant_chunks])
            prompt = create_rag_prompt(req.prompt, relevant_chunks)
        else:
            prompt = req.prompt
    else:
        prompt = req.prompt

    # Generate complete response
    response = llm(prompt, max_tokens=512, temperature=0.7)
    response_text = response["choices"][0]["text"] if response["choices"] else "No response generated"

    return RAGResponse(
        query=req.prompt,
        relevant_chunks=relevant_chunks,
        context_used=context_used,
        response=response_text
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "embedding_model_loaded": embedding_model is not None,
        "llm_loaded": llm is not None,
        "workspace_chunks": len(workspace_embeddings),
        "models": {
            "embedding": "all-MiniLM-L6-v2" if embedding_model else None,
            "llm": "Mistral-7B-Instruct-v0.2" if llm else None
        }
    }