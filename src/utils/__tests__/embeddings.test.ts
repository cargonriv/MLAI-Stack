import { describe, it, expect, vi } from 'vitest';
import { cosineSimilarity, buildContext } from '../embeddings';

describe('Embeddings Utils', () => {
  it('should calculate cosine similarity correctly', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const vec3 = [1, 0, 0];
    
    expect(cosineSimilarity(vec1, vec2)).toBe(0);
    expect(cosineSimilarity(vec1, vec3)).toBe(1);
  });

  it('should build context from chunks', () => {
    const mockChunks = [
      {
        chunk: {
          id: 'test1',
          filePath: 'test.ts',
          chunkIndex: 0,
          content: 'Test content',
          embedding: []
        },
        similarity: 0.8
      }
    ];

    const context = buildContext(mockChunks);
    expect(context).toContain('File: test.ts');
    expect(context).toContain('Test content');
    expect(context).toContain('80.0%');
  });

  it('should handle empty chunks', () => {
    const context = buildContext([]);
    expect(context).toBe('');
  });
});