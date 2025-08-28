import { AutoTokenizer } from '@huggingface/transformers';

export const testTokenizer = async () => {
  try {
    console.log('Loading GPT-4o tokenizer...');
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-4');
    // const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-4o');
    
    const testText = 'hello world';
    const tokens = tokenizer.encode(testText);
    
    console.log('Tokenizer test successful!');
    console.log(`Text: "${testText}"`);
    console.log(`Tokens: [${tokens.join(', ')}]`);
    console.log(`Token count: ${tokens.length}`);
    
    return {
      success: true,
      text: testText,
      tokens: tokens,
      tokenCount: tokens.length
    };
  } catch (error) {
    console.error('Tokenizer test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Example usage in component:
// const result = await testTokenizer();
// if (result.success) {
//   console.log(`Successfully tokenized "${result.text}" into ${result.tokenCount} tokens`);
// }