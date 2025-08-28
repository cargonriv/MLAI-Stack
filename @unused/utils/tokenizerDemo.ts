/**
 * Tokenizer Demo Utility
 * Demonstrates token encoding and decoding similar to the Node.js example
 */

import { AutoTokenizer } from '@huggingface/transformers';

export interface TokenizationResult {
  originalText: string;
  tokens: number[];
  decodedTokens: string[];
  tokenCount: number;
  reconstructedText: string;
}

export class TokenizerDemo {
  private tokenizer: unknown = null;
  private isLoaded = false;

  async initialize(): Promise<boolean> {
    try {
      console.log('🤖 Loading GPT-4 tokenizer...');
      this.tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-4');
      this.isLoaded = true;
      console.log('✅ Tokenizer loaded successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to load tokenizer:', error);
      return false;
    }
  }

  /**
   * Encode text into tokens (similar to the Node.js example)
   */
  encode(text: string): TokenizationResult | null {
    if (!this.isLoaded || !this.tokenizer) {
      console.warn('Tokenizer not loaded');
      return null;
    }

    try {
      // Encode text to tokens
      const tokens = this.tokenizer.encode(text);
      
      // Decode each token individually to show breakdown
      const decodedTokens = tokens.map((token: number) => 
        this.tokenizer.decode([token])
      );
      
      // Reconstruct full text from tokens
      const reconstructedText = this.tokenizer.decode(tokens);

      return {
        originalText: text,
        tokens: Array.from(tokens),
        decodedTokens,
        tokenCount: tokens.length,
        reconstructedText
      };
    } catch (error) {
      console.error('Tokenization error:', error);
      return null;
    }
  }

  /**
   * Decode tokens back to text
   */
  decode(tokens: number[]): string {
    if (!this.isLoaded || !this.tokenizer) {
      console.warn('Tokenizer not loaded');
      return '';
    }

    try {
      return this.tokenizer.decode(tokens);
    } catch (error) {
      console.error('Decoding error:', error);
      return '';
    }
  }

  /**
   * Interactive demo similar to the Node.js readline example
   */
  async processUserInput(userInput: string): Promise<{
    input: TokenizationResult | null;
    response: TokenizationResult | null;
  }> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    // Tokenize user input
    const inputTokenization = this.encode(userInput);
    
    // Generate a simple response (in a real implementation, this would use a language model)
    const response = this.generateSimpleResponse(userInput, inputTokenization?.tokenCount || 0);
    const responseTokenization = this.encode(response);

    return {
      input: inputTokenization,
      response: responseTokenization
    };
  }

  /**
   * Generate a simple response for demo purposes
   */
  private generateSimpleResponse(input: string, tokenCount: number): string {
    const responses = [
      `I processed your ${tokenCount}-token message: "${input}". This demonstrates how text gets tokenized for AI processing!`,
      `Your input "${input}" was encoded into ${tokenCount} tokens. Each token represents a meaningful unit of text that AI models can understand.`,
      `Interesting! "${input}" tokenizes to ${tokenCount} tokens. This tokenization process is fundamental to how language models like GPT work.`,
      `I see you said "${input}" - that's ${tokenCount} tokens worth of information. The tokenizer breaks down text into these processable units.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Batch tokenization for multiple texts
   */
  batchEncode(texts: string[]): TokenizationResult[] {
    return texts.map(text => this.encode(text)).filter(Boolean) as TokenizationResult[];
  }

  /**
   * Get tokenizer statistics
   */
  getStats(): { isLoaded: boolean; modelName: string } {
    return {
      isLoaded: this.isLoaded,
      modelName: 'Xenova/gpt-4'
    };
  }

  /**
   * Compare tokenization between different texts
   */
  compareTokenization(texts: string[]): {
    texts: string[];
    tokenCounts: number[];
    averageTokens: number;
    totalTokens: number;
  } {
    const results = this.batchEncode(texts);
    const tokenCounts = results.map(r => r.tokenCount);
    
    return {
      texts,
      tokenCounts,
      averageTokens: tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length,
      totalTokens: tokenCounts.reduce((a, b) => a + b, 0)
    };
  }
}

// Export a singleton instance
export const tokenizerDemo = new TokenizerDemo();

// Example usage (similar to the Node.js example):
/*
async function runDemo() {
  const demo = new TokenizerDemo();
  await demo.initialize();
  
  const userInput = "Hello, how does tokenization work?";
  const result = await demo.processUserInput(userInput);
  
  console.log("User Input Tokenization:");
  console.log(`Text: "${result.input?.originalText}"`);
  console.log(`Tokens: [${result.input?.tokens.join(', ')}]`);
  console.log(`Token Count: ${result.input?.tokenCount}`);
  console.log(`Decoded Tokens: [${result.input?.decodedTokens.map(t => `"${t}"`).join(', ')}]`);
  
  console.log("\nBot Response Tokenization:");
  console.log(`Text: "${result.response?.originalText}"`);
  console.log(`Tokens: [${result.response?.tokens.join(', ')}]`);
  console.log(`Token Count: ${result.response?.tokenCount}`);
}
*/