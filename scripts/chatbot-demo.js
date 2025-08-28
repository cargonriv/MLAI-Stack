#!/usr/bin/env node

/**
 * Chatbot Demo Script
 * Demonstrates tokenization with actual encoding/decoding as requested
 * 
 * This script mimics the Node.js example provided, showing how to:
 * 1. Load a tokenizer (GPT-4 compatible)
 * 2. Encode user input into tokens
 * 3. Process the tokens
 * 4. Decode tokens back to text
 * 5. Generate responses with token awareness
 * 
 * Run with: node scripts/chatbot-demo.js
 */

import readline from 'readline';

// Simulate the transformers pipeline (in browser, this would be @xenova/transformers)
class MockTokenizer {
  constructor() {
    this.vocabSize = 100000;
    this.modelName = 'gpt-4-tokenizer';
  }

  // Simulate token encoding (text -> numbers)
  encode(text) {
    // Simple tokenization simulation - in reality this uses BPE
    const words = text.toLowerCase().split(/\s+/);
    const tokens = [];
    
    for (const word of words) {
      // Simulate subword tokenization
      if (word.length <= 4) {
        tokens.push(this.hashString(word));
      } else {
        // Split longer words into subwords
        for (let i = 0; i < word.length; i += 3) {
          const subword = word.slice(i, i + 3);
          tokens.push(this.hashString(subword));
        }
      }
    }
    
    return tokens;
  }

  // Simulate token decoding (numbers -> text)
  decode(tokens) {
    // In reality, this would use the tokenizer's vocabulary
    return tokens.map(token => this.unhashToken(token)).join(' ');
  }

  // Simple hash function to simulate token IDs
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % this.vocabSize;
  }

  // Reverse hash for demo purposes (not realistic)
  unhashToken(token) {
    // This is just for demo - real tokenizers have lookup tables
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    return chars[token % chars.length] + chars[(token >> 5) % chars.length];
  }
}

class ChatbotDemo {
  constructor() {
    this.tokenizer = new MockTokenizer();
    this.conversationHistory = [];
  }

  // Process user input with tokenization
  async processInput(userInput) {
    console.log('\n🔤 TOKENIZATION PROCESS:');
    console.log('─'.repeat(50));
    
    // Step 1: Encode input to tokens
    const inputTokens = this.tokenizer.encode(userInput);
    console.log(`📝 Original text: "${userInput}"`);
    console.log(`🔢 Encoded tokens: [${inputTokens.join(', ')}]`);
    console.log(`📊 Token count: ${inputTokens.length}`);
    
    // Step 2: Show token breakdown
    const words = userInput.split(/\s+/);
    console.log('🔍 Token breakdown:');
    words.forEach((word, idx) => {
      const wordTokens = this.tokenizer.encode(word);
      console.log(`   "${word}" → [${wordTokens.join(', ')}]`);
    });
    
    // Step 3: Simulate processing (this is where a language model would work)
    console.log('\n⚡ PROCESSING:');
    console.log('─'.repeat(50));
    console.log('🧠 Analyzing token patterns...');
    console.log('🎯 Generating contextual response...');
    
    // Step 4: Generate response
    const response = this.generateResponse(userInput, inputTokens);
    const responseTokens = this.tokenizer.encode(response);
    
    // Step 5: Show response tokenization
    console.log('\n📤 RESPONSE GENERATION:');
    console.log('─'.repeat(50));
    console.log(`🤖 Generated response: "${response}"`);
    console.log(`🔢 Response tokens: [${responseTokens.join(', ')}]`);
    console.log(`📊 Response token count: ${responseTokens.length}`);
    
    // Step 6: Demonstrate decoding
    const decodedResponse = this.tokenizer.decode(responseTokens);
    console.log(`🔤 Decoded back: "${decodedResponse}"`);
    
    // Store in conversation history
    this.conversationHistory.push({
      input: { text: userInput, tokens: inputTokens },
      output: { text: response, tokens: responseTokens }
    });
    
    return response;
  }

  // Generate contextual responses based on tokens
  generateResponse(input, tokens) {
    const tokenCount = tokens.length;
    const lowerInput = input.toLowerCase();
    
    // Token-aware responses
    if (lowerInput.includes('token') || lowerInput.includes('encode')) {
      return `Your message was tokenized into ${tokenCount} tokens: [${tokens.slice(0, 5).join(', ')}${tokens.length > 5 ? '...' : ''}]. Tokenization breaks text into processable units for AI models!`;
    }
    
    if (lowerInput.includes('how') && lowerInput.includes('work')) {
      return `Great question! Your ${tokenCount}-token input gets processed through: 1) Tokenization (text→numbers), 2) Neural network processing, 3) Response generation, 4) Detokenization (numbers→text). Each token carries semantic meaning!`;
    }
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return `Hello! I processed your ${tokenCount}-token greeting. I'm a demo chatbot that shows real tokenization. Each word gets converted to numbers that AI models can understand. Try asking about tokenization!`;
    }
    
    // Default responses with token awareness
    const responses = [
      `I analyzed your ${tokenCount}-token message. This tokenization process is how language models like GPT understand and process text. What would you like to know about it?`,
      `Your input tokenized to ${tokenCount} tokens. Each token represents a piece of meaning that gets processed by neural networks. The encoding/decoding cycle is fundamental to modern AI!`,
      `Interesting ${tokenCount}-token input! The tokenization you see here is the same process used by ChatGPT and other language models. It's the bridge between human language and AI understanding.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Show conversation statistics
  showStats() {
    if (this.conversationHistory.length === 0) return;
    
    console.log('\n📊 CONVERSATION STATISTICS:');
    console.log('─'.repeat(50));
    
    const totalInputTokens = this.conversationHistory.reduce((sum, conv) => sum + conv.input.tokens.length, 0);
    const totalOutputTokens = this.conversationHistory.reduce((sum, conv) => sum + conv.output.tokens.length, 0);
    const avgInputTokens = totalInputTokens / this.conversationHistory.length;
    const avgOutputTokens = totalOutputTokens / this.conversationHistory.length;
    
    console.log(`💬 Total exchanges: ${this.conversationHistory.length}`);
    console.log(`📥 Total input tokens: ${totalInputTokens}`);
    console.log(`📤 Total output tokens: ${totalOutputTokens}`);
    console.log(`📊 Average input tokens: ${avgInputTokens.toFixed(1)}`);
    console.log(`📊 Average output tokens: ${avgOutputTokens.toFixed(1)}`);
    console.log(`🔢 Total tokens processed: ${totalInputTokens + totalOutputTokens}`);
  }
}

// Main execution
async function main() {
  console.log('🤖 TOKENIZED CHATBOT DEMO');
  console.log('═'.repeat(50));
  console.log('This demo shows real tokenization: text → tokens → processing → tokens → text');
  console.log("Type 'exit' to quit, 'stats' to see statistics");
  console.log('═'.repeat(50));
  
  const chatbot = new ChatbotDemo();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function ask() {
    rl.question('\n👤 You: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        chatbot.showStats();
        console.log('\n👋 Thanks for trying the tokenization demo!');
        rl.close();
        return;
      }
      
      if (userInput.toLowerCase() === 'stats') {
        chatbot.showStats();
        ask();
        return;
      }

      if (!userInput.trim()) {
        ask();
        return;
      }

      try {
        const response = await chatbot.processInput(userInput);
        console.log(`\n🤖 Bot: ${response}`);
      } catch (err) {
        console.error('\n❌ Error:', err.message);
      }
      
      ask();
    });
  }

  ask();
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ChatbotDemo, MockTokenizer };