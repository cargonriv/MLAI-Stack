/**
 * Test file for BERT Sentiment Analysis Engine
 * Basic tests to verify functionality
 */

import { BERTSentimentAnalyzer, BERTTextPreprocessor } from '../sentimentAnalysis';
import type { BERTSentimentConfig } from '../sentimentAnalysis';

import { vi } from 'vitest';

// Mock the transformers import to avoid loading actual models in tests
vi.mock('@xenova/transformers', () => ({
  AutoTokenizer: {
    from_pretrained: vi.fn().mockResolvedValue({
      tokenize: vi.fn().mockResolvedValue({
        input_ids: { data: [101, 2023, 2003, 2307, 102] },
        attention_mask: { data: [1, 1, 1, 1, 1] },
        tokens: ['[CLS]', 'this', 'is', 'good', '[SEP]']
      })
    })
  },
  AutoModelForSequenceClassification: {
    from_pretrained: vi.fn().mockResolvedValue({
      predict: vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.95 }])
    })
  },
  pipeline: vi.fn().mockResolvedValue(
    vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.95 }])
  )
}));

describe('BERTTextPreprocessor', () => {
  let preprocessor: BERTTextPreprocessor;
  
  beforeEach(() => {
    const config: BERTSentimentConfig = {
      modelName: 'test-model',
      maxLength: 512,
      truncation: true,
      padding: true,
      returnTensors: 'pt'
    };
    preprocessor = new BERTTextPreprocessor(config);
  });

  describe('clean', () => {
    it('should clean and normalize text', () => {
      const input = '  This is a   test!!!   ';
      const result = preprocessor.clean(input);
      expect(result).toBe('This is a test!');
    });

    it('should handle empty input', () => {
      const result = preprocessor.clean('');
      expect(result).toBe('');
    });

    it('should handle null/undefined input', () => {
      expect(preprocessor.clean(null as unknown as string)).toBe('');
      expect(preprocessor.clean(undefined as unknown as string)).toBe('');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00\x08World';
      const result = preprocessor.clean(input);
      expect(result).toBe('HelloWorld');
    });
  });

  describe('validate', () => {
    it('should validate correct input', () => {
      const result = preprocessor.validate('This is a valid text');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty input', () => {
      const result = preprocessor.validate('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text input is required and must be a string');
    });

    it('should reject non-string input', () => {
      const result = preprocessor.validate(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text input is required and must be a string');
    });

    it('should warn about very short text', () => {
      const result = preprocessor.validate('Hi');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Very short text may not provide reliable sentiment analysis');
    });

    it('should warn about very long text', () => {
      const longText = 'a'.repeat(10001);
      const result = preprocessor.validate(longText);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Text is very long and will be truncated');
    });
  });
});

describe('BERTSentimentAnalyzer', () => {
  let analyzer: BERTSentimentAnalyzer;

  beforeEach(() => {
    analyzer = new BERTSentimentAnalyzer();
  });

  describe('constructor', () => {
    it('should create analyzer with default config', () => {
      expect(analyzer).toBeInstanceOf(BERTSentimentAnalyzer);
    });

    it('should create analyzer with custom config', () => {
      const customConfig = {
        modelName: 'custom-model',
        maxLength: 256
      };
      const customAnalyzer = new BERTSentimentAnalyzer(customConfig);
      expect(customAnalyzer).toBeInstanceOf(BERTSentimentAnalyzer);
    });
  });

  describe('static factory methods', () => {
    it('should create DistilBERT analyzer', () => {
      const distilBert = BERTSentimentAnalyzer.createDistilBERT();
      expect(distilBert).toBeInstanceOf(BERTSentimentAnalyzer);
    });

    it('should create RoBERTa analyzer', () => {
      const roberta = BERTSentimentAnalyzer.createRoBERTa();
      expect(roberta).toBeInstanceOf(BERTSentimentAnalyzer);
    });

    it('should create BERT analyzer', () => {
      const bert = BERTSentimentAnalyzer.createBERT();
      expect(bert).toBeInstanceOf(BERTSentimentAnalyzer);
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', () => {
      const info = analyzer.getModelInfo();
      expect(info).toHaveProperty('config');
      expect(info).toHaveProperty('isInitialized');
      expect(info.isInitialized).toBe(false);
    });
  });
});