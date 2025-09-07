import { pipeline, Pipeline, env } from "@xenova/transformers";
import workspaceEmbeddingsData from '../data/workspace_embeddings.json';

// Document chunk interface matching the precomputed embeddings
export interface DocumentChunk {
  id: string;
  filePath: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
}

// Embedding model for queries
let embeddingModel: Pipeline | null = null;
let workspaceEmbeddings: DocumentChunk[] = [];
let isLoadingEmbeddings = false;

/**
 * Initialize the embedding model for query encoding
 */
export async function initializeEmbeddingModel(): Promise<Pipeline> {
  if (embeddingModel) {
    return embeddingModel;
  }

  try {
    console.log("🔍 Loading embedding model for queries...");
    
    // Use the same model as the backend for consistency
    embeddingModel = await pipeline(
      "feature-extraction",
      "/models/all-MiniLM-L6-v2",
      {
        quantized: true,
        progress_callback: (progress: any) => {
          if (progress.status === 'downloading') {
            console.log(`Downloading embedding model: ${Math.round(progress.progress || 0)}%`);
          }
        }
      }
    );

    console.log("✅ Embedding model loaded successfully!");
    return embeddingModel;
  } catch (error) {
    console.error("❌ Failed to load embedding model:", error);
    throw error;
  }
}

/**
 * Load precomputed workspace embeddings
 */
export async function loadWorkspaceEmbeddings(): Promise<DocumentChunk[]> {
  if (workspaceEmbeddings.length > 0) {
    return workspaceEmbeddings;
  }

  if (isLoadingEmbeddings) {
    // Wait for current loading to complete
    while (isLoadingEmbeddings) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return workspaceEmbeddings;
  }

  isLoadingEmbeddings = true;

  try {
    console.log("📚 Loading precomputed workspace embeddings...");
    
    workspaceEmbeddings = workspaceEmbeddingsData as DocumentChunk[];
    console.log(`✅ Loaded ${workspaceEmbeddings.length} document chunks`);
    
    return workspaceEmbeddings;
  } catch (error) {
    console.error("❌ Failed to load workspace embeddings:", error);
    throw error;
  } finally {
    isLoadingEmbeddings = false;
  }
}

/**
 * Encode a query text into an embedding vector
 */
export async function encodeQuery(text: string): Promise<number[]> {
  if (!embeddingModel) {
    await initializeEmbeddingModel();
  }

  if (!embeddingModel) {
    throw new Error("Embedding model not initialized");
  }

  try {
    const result = await embeddingModel(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  } catch (error) {
    console.error("Error encoding query:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find the most relevant document chunks for a query
 */
export async function findRelevantChunks(
  query: string,
  maxChunks: number = 5,
  similarityThreshold: number = 0.3
): Promise<{ chunk: DocumentChunk; similarity: number }[]> {
  try {
    // Ensure embeddings are loaded
    const chunks = await loadWorkspaceEmbeddings();
    
    // Encode the query
    const queryEmbedding = await encodeQuery(query);

    // Calculate similarities
    const similarities = chunks.map(chunk => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Filter by threshold and sort by similarity
    const relevantChunks = similarities
      .filter(item => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxChunks);

    console.log(`🔍 Found ${relevantChunks.length} relevant chunks for query: "${query}"`);
    
    return relevantChunks;
  } catch (error) {
    console.error("Error finding relevant chunks:", error);
    return [];
  }
}

/**
 * Build context from relevant chunks
 */
export function buildContext(relevantChunks: { chunk: DocumentChunk; similarity: number }[]): string {
  if (relevantChunks.length === 0) {
    return "";
  }
  const contextParts = relevantChunks.map(({ chunk, similarity }) => {
    return `File: ${chunk.filePath}\nContent: ${chunk.content}\nRelevance: ${(similarity * 100).toFixed(1)}%`;
  });
  return `Context from codebase:\n\n${contextParts.join('\n\n---\n\n')}`;
}

/**
 * Get embedding model status
 */
export function getEmbeddingModelStatus(): 'not-loaded' | 'loading' | 'ready' | 'error' {
  if (embeddingModel) return 'ready';
  if (isLoadingEmbeddings) return 'loading';
  return 'not-loaded';
}

/**
 * Get workspace embeddings status
 */
export function getWorkspaceEmbeddingsStatus(): {
  status: 'not-loaded' | 'loading' | 'ready' | 'error';
  count: number;
} {
  return {
    status: workspaceEmbeddings.length > 0 ? 'ready' :
            isLoadingEmbeddings ? 'loading' : 'not-loaded',
    count: workspaceEmbeddings.length
  };
}
