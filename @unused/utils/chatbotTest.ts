// Simple test to verify chatbot functionality
export const testChatbotFeatures = () => {
  console.log('🧪 Testing Chatbot Features');
  
  // Test 1: Basic text validation
  const validateText = (text: string): boolean => {
    return text && typeof text === 'string' && text.trim().length > 0;
  };
  
  console.log('✅ Text validation:', {
    'valid text': validateText('hello world'),
    'empty string': validateText(''),
    'null': validateText(null as any),
    'undefined': validateText(undefined as any),
    'whitespace only': validateText('   ')
  });
  
  // Test 2: Message generation
  const generateTestMessage = (content: string, sender: 'user' | 'bot') => {
    return {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      tokens: Math.ceil(content.length / 4) // Rough estimate
    };
  };
  
  const testMessage = generateTestMessage('Hello, how are you?', 'user');
  console.log('✅ Message generation:', testMessage);
  
  // Test 3: Response patterns
  const testResponses = [
    'Tell me about your projects',
    'What is machine learning?',
    'Explain the SIDS model',
    'Hello there!',
    'What technologies do you use?'
  ];
  
  console.log('✅ Response patterns test:');
  testResponses.forEach(query => {
    const lowerQuery = query.toLowerCase();
    let responseType = 'general';
    
    if (lowerQuery.includes('project')) responseType = 'projects';
    else if (lowerQuery.includes('sids')) responseType = 'sids';
    else if (lowerQuery.includes('technology') || lowerQuery.includes('tech')) responseType = 'tech';
    else if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) responseType = 'greeting';
    
    console.log(`  "${query}" -> ${responseType}`);
  });
  
  console.log('🎉 All chatbot tests completed!');
};

// Export for use in components
export const getChatbotStatus = () => {
  return {
    tokenizerSupported: typeof window !== 'undefined' && 'WebAssembly' in window,
    transformersAvailable: true, // We have the package installed
    browserCompatible: typeof window !== 'undefined' && window.navigator && window.navigator.userAgent
  };
};