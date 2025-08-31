import { describe, it, expect, vi } from 'vitest';
import { isWebLLMSupported, getAvailableModels } from '../webllm';

// Mock WebGPU and WebAssembly for testing
Object.defineProperty(navigator, 'gpu', {
  value: {},
  writable: true
});

Object.defineProperty(global, 'WebAssembly', {
  value: {},
  writable: true
});

describe('WebLLM Utils', () => {
  it('should check WebLLM support correctly', () => {
    expect(isWebLLMSupported()).toBe(true);
  });

  it('should return available models', () => {
    const models = getAvailableModels();
    expect(models).toContain('Phi-3.5-mini-instruct-q4f16_1-MLC');
    expect(models).toContain('Llama-3.2-1B-Instruct-q4f32_1-MLC');
    expect(models).toContain('gemma-2-2b-it-q4f16_1-MLC');
  });

  it('should detect unsupported browsers', () => {
    // Mock unsupported browser
    Object.defineProperty(navigator, 'gpu', {
      value: undefined,
      writable: true
    });
    
    expect(isWebLLMSupported()).toBe(false);
  });
});