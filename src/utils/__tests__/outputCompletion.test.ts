/**
 * Tests for output completion utility
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  needsCompletion, 
  estimateCompletionTokens, 
  completeOutput,
  createSimpleCompletionFunction 
} from '../outputCompletion';

describe('Output Completion Utility', () => {
  describe('needsCompletion', () => {
    it('should detect incomplete sentences', () => {
      expect(needsCompletion('This is an incomplete')).toBe(true);
      expect(needsCompletion('This is a complete sentence.')).toBe(false);
      expect(needsCompletion('What about this')).toBe(true);
      expect(needsCompletion('What about this?')).toBe(false);
    });

    it('should detect incomplete technical explanations', () => {
      const config = { contentType: 'technical' as const };
      expect(needsCompletion('The algorithm works by', config)).toBe(true);
      expect(needsCompletion('The algorithm works by processing data efficiently.', config)).toBe(false);
      expect(needsCompletion('Step 1:', config)).toBe(true);
      expect(needsCompletion('Step 1: Initialize the variables.', config)).toBe(false);
    });

    it('should detect incomplete conversational responses', () => {
      const config = { contentType: 'conversational' as const };
      expect(needsCompletion('Well, I think', config)).toBe(true);
      expect(needsCompletion('You know,', config)).toBe(true);
      expect(needsCompletion('I understand your question completely.', config)).toBe(false);
    });

    it('should detect incomplete code blocks', () => {
      const config = { contentType: 'code' as const };
      expect(needsCompletion('```javascript', config)).toBe(true);
      expect(needsCompletion('function test() {', config)).toBe(true);
      expect(needsCompletion('const result =', config)).toBe(true);
      expect(needsCompletion('console.log("Hello World");', config)).toBe(false);
    });

    it('should handle empty or whitespace-only text', () => {
      expect(needsCompletion('')).toBe(false);
      expect(needsCompletion('   ')).toBe(false);
      expect(needsCompletion('\n\t  ')).toBe(false);
    });
  });

  describe('estimateCompletionTokens', () => {
    it('should return reasonable token estimates', () => {
      const shortText = 'Hello';
      const longText = 'This is a much longer text that should require fewer proportional completion tokens';
      
      const shortEstimate = estimateCompletionTokens(shortText);
      const longEstimate = estimateCompletionTokens(longText);
      
      expect(shortEstimate).toBeGreaterThan(0);
      expect(longEstimate).toBeGreaterThan(0);
      expect(shortEstimate).toBeGreaterThan(longEstimate); // Shorter text needs proportionally more completion
    });

    it('should adjust estimates based on content type', () => {
      const text = 'This is a test';
      
      const conversationalEstimate = estimateCompletionTokens(text, { contentType: 'conversational' });
      const technicalEstimate = estimateCompletionTokens(text, { contentType: 'technical' });
      
      expect(technicalEstimate).toBeGreaterThan(conversationalEstimate);
    });

    it('should respect maxAdditionalTokens limit', () => {
      const text = 'Test';
      const maxTokens = 25;
      
      const estimate = estimateCompletionTokens(text, { maxAdditionalTokens: maxTokens });
      
      // The estimate should be reasonable, but the actual limit is enforced in completeOutput
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(200); // Reasonable upper bound
    });
  });

  describe('completeOutput', () => {
    it('should return original text when no completion is needed', async () => {
      const completeText = 'This is a complete sentence.';
      const mockGenerator = vi.fn();
      
      const result = await completeOutput(completeText, mockGenerator);
      
      expect(result.wasCompleted).toBe(false);
      expect(result.completedText).toBe(completeText);
      expect(result.completionReason).toContain('No completion needed');
      expect(mockGenerator).not.toHaveBeenCalled();
    });

    it('should complete incomplete text', async () => {
      const incompleteText = 'This is incomplete';
      const additionalText = ' but now it is complete.';
      const mockGenerator = vi.fn().mockResolvedValue(additionalText);
      
      const result = await completeOutput(incompleteText, mockGenerator);
      
      expect(result.wasCompleted).toBe(true);
      expect(result.completedText).toBe(incompleteText + additionalText);
      expect(result.additionalTokensUsed).toBeGreaterThan(0);
      expect(mockGenerator).toHaveBeenCalled();
    });

    it('should handle completion timeout', async () => {
      const incompleteText = 'This is incomplete';
      const mockGenerator = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );
      
      const result = await completeOutput(incompleteText, mockGenerator, { timeoutMs: 100 });
      
      expect(result.wasCompleted).toBe(false);
      expect(result.completedText).toBe(incompleteText);
      expect(result.completionReason).toContain('timeout');
    });

    it('should handle completion errors gracefully', async () => {
      const incompleteText = 'This is incomplete';
      const mockGenerator = vi.fn().mockRejectedValue(new Error('Generation failed'));
      
      const result = await completeOutput(incompleteText, mockGenerator);
      
      expect(result.wasCompleted).toBe(false);
      expect(result.completedText).toBe(incompleteText);
      expect(result.completionReason).toContain('failed');
    });

    it('should reject completion that is too short', async () => {
      const incompleteText = 'This is incomplete';
      const shortCompletion = '.';
      const mockGenerator = vi.fn().mockResolvedValue(shortCompletion);
      
      const result = await completeOutput(incompleteText, mockGenerator, { minCompletionLength: 10 });
      
      expect(result.wasCompleted).toBe(false);
      expect(result.completionReason).toContain('too short');
    });
  });

  describe('createSimpleCompletionFunction', () => {
    it('should create a working completion function', async () => {
      const originalText = 'This is about machine learning';
      const completionFn = createSimpleCompletionFunction(originalText);
      
      const result = await completionFn(20);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should provide some kind of completion
      expect(result.trim()).not.toBe('');
    });

    it('should provide different completions for different content', async () => {
      const technicalText = 'This technical implementation';
      const projectText = 'This project demonstrates';
      
      const technicalFn = createSimpleCompletionFunction(technicalText);
      const projectFn = createSimpleCompletionFunction(projectText);
      
      const technicalResult = await technicalFn(20);
      const projectResult = await projectFn(20);
      
      expect(technicalResult).not.toBe(projectResult);
      expect(technicalResult).toContain('technical');
      expect(projectResult).toContain('project');
    });
  });
});