# WebLLM Implementation Guide

This document explains the client-side WebLLM implementation that replaces the backend-fastapi approach for the AdvancedTokenizedChat component.

## Overview

The new implementation runs entirely in the browser using:
- **WebLLM** for LLM inference (Mistral/LLaMA models compiled to WebAssembly + WebGPU)
- **Transformers.js** for embedding generation (Xenova/all-MiniLM-L6-v2)
- **Precomputed embeddings** shipped as JSON for RAG context retrieval

## Architecture

### 1. WebLLM Engine (`src/utils/webllm.ts`)
- Initializes and manages WebLLM models
- Supports multiple lightweight models:
  - `Phi-3.5-mini-instruct-q4f16_1-MLC` (~2.4GB) - Recommended
  - `Llama-3.2-1B-Instruct-q4f32_1-MLC` (~1.2GB) - Fastest
  - `gemma-2-2b-it-q4f16_1-MLC` (~1.8GB) - Good balance

### 2. Embeddings System (`src/utils/embeddings.ts`)
- Loads precomputed workspace embeddings from `/workspace_embeddings.json`
- Uses Transformers.js for query encoding
- Implements cosine similarity for context retrieval

### 3. RAG Pipeline (`src/utils/rag.ts`)
- Combines WebLLM with embedding-based context retrieval
- Provides fallback responses for unsupported browsers
- Handles streaming responses with progress updates

### 4. Updated Chat Component (`src/components/AdvancedTokenizedChat.tsx`)
- WebLLM integration with model selection
- RAG toggle and configuration options
- Browser compatibility detection
- Enhanced UI with loading states and context indicators

## Browser Requirements

### Supported Browsers
- **Chrome 113+** with WebGPU enabled
- **Edge 113+** with WebGPU enabled
- **Firefox** (experimental WebGPU support)

### Required Features
- **WebGPU** for GPU acceleration
- **WebAssembly** for model execution
- **SharedArrayBuffer** for memory management
- **4GB+ RAM** recommended for larger models

### Enabling WebGPU
1. Chrome/Edge: Navigate to `chrome://flags/#enable-unsafe-webgpu`
2. Enable "Unsafe WebGPU" flag
3. Restart browser

## Performance Characteristics

### Model Loading Times
- **First load**: 30-120 seconds (downloads model)
- **Subsequent loads**: 5-15 seconds (cached)
- **Inference**: 10-50 tokens/second (depends on hardware)

### Memory Usage
- **Phi-3.5 Mini**: ~3-4GB RAM
- **Llama 3.2 1B**: ~2-3GB RAM
- **Gemma 2 2B**: ~2.5-3.5GB RAM

### Storage Requirements
- Models cached in browser storage
- Embeddings: ~61MB JSON file
- Total: 1.2-2.4GB depending on model

## Configuration

### Environment Variables
```bash
# Optional: Custom API fallback (not used with WebLLM)
VITE_API_URL=http://localhost:8000
```

### Model Selection
Users can choose models in the chat settings panel based on their hardware capabilities.

### RAG Configuration
- **Max Context Chunks**: 5 (configurable)
- **Similarity Threshold**: 0.3 (configurable)
- **Context Window**: 512 tokens max

## Fallback Strategy

When WebLLM is not supported:
1. **Browser Detection**: Check for WebGPU/WebAssembly support
2. **Graceful Degradation**: Use predefined contextual responses
3. **User Notification**: Clear messaging about limitations
4. **Functionality Preservation**: Core chat features remain available

## Development

### Running Locally
```bash
npm install
npm run dev
```

### Testing
```bash
npm run test
npm run test:unit src/utils/__tests__/webllm.test.ts
npm run test:unit src/utils/__tests__/embeddings.test.ts
```

### Building
```bash
npm run build
```

## Deployment Considerations

### Headers Required
The application requires specific headers for WebLLM:
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### CDN Optimization
- Models are loaded from Hugging Face CDN
- Embeddings served as static JSON
- Aggressive caching recommended for embeddings

### Error Handling
- Network failures gracefully fall back to cached responses
- Model loading errors trigger fallback mode
- User-friendly error messages for unsupported browsers

## Monitoring

### Performance Metrics
- Model loading time
- Inference speed (tokens/second)
- Memory usage
- Cache hit rates

### User Analytics
- Browser compatibility rates
- Model selection preferences
- Feature usage patterns
- Error frequencies

## Future Enhancements

### Planned Features
1. **Model Quantization**: Smaller model variants
2. **Progressive Loading**: Streaming model downloads
3. **Offline Mode**: Full functionality without network
4. **Custom Models**: User-uploaded model support

### Optimization Opportunities
1. **WebWorker Integration**: Background model loading
2. **Memory Management**: Better cleanup and caching
3. **Compression**: Optimized embedding storage
4. **Batching**: Multiple query processing

## Troubleshooting

### Common Issues

**Model Loading Fails**
- Check WebGPU support in browser
- Verify sufficient RAM available
- Clear browser cache and retry

**Slow Performance**
- Try smaller model (Llama 3.2 1B)
- Close other browser tabs
- Check system resources

**Context Not Found**
- Verify embeddings file loads correctly
- Check network connectivity
- Ensure CORS headers are set

**Browser Compatibility**
- Update to latest Chrome/Edge
- Enable WebGPU flags
- Check hardware acceleration settings

## Security Considerations

### Data Privacy
- All processing happens locally in browser
- No data sent to external servers (except model downloads)
- Embeddings contain only code snippets, no sensitive data

### Content Security
- Models run in sandboxed WebAssembly environment
- No arbitrary code execution
- Input sanitization for user queries

### Resource Limits
- Memory usage monitoring
- Timeout handling for long operations
- Graceful degradation on resource exhaustion

This implementation provides a fully client-side AI chat experience while maintaining compatibility with browsers that don't support WebLLM through intelligent fallback mechanisms.