// Simple test to demonstrate the adaptive token allocation system
import { analyzeInputComplexity, complexityExamples } from './src/utils/complexityAnalysis.js';

console.log('🧠 Adaptive Token Allocation Demo\n');

// Test different complexity levels
const testInputs = [
  // Simple examples
  "Hi",
  "What is React?",
  "Thanks!",
  
  // Moderate examples
  "How does machine learning work?",
  "What are the main features of TypeScript?",
  "Can you explain Carlos's background?",
  
  // Complex examples
  "How do I implement a neural network from scratch and what are the key considerations?",
  "Compare TensorFlow vs PyTorch for computer vision projects",
  "Explain the architecture of this portfolio website and how the client-side ML works",
  
  // Detailed examples
  "I need a comprehensive guide on building production ML systems, including data pipelines, model training, deployment strategies, monitoring, and scaling considerations. Can you also compare different approaches and provide code examples?",
  "Analyze Carlos's SIDS prediction project in detail, explain the methodology, compare it with other approaches, discuss the ethical implications, and suggest improvements"
];

console.log('Testing various input complexities:\n');

testInputs.forEach((input, index) => {
  const analysis = analyzeInputComplexity(input);
  
  console.log(`${index + 1}. Input: "${input.substring(0, 60)}${input.length > 60 ? '...' : ''}"`);
  console.log(`   Complexity: ${analysis.complexity}`);
  console.log(`   Suggested Tokens: ${analysis.suggestedTokens}`);
  console.log(`   Reasoning: ${analysis.reasoning}`);
  console.log(`   Score: ${analysis.score}\n`);
});

console.log('📊 Token Allocation Summary:');
console.log('• Simple (150 tokens): Quick answers, definitions, greetings');
console.log('• Moderate (250 tokens): Standard explanations with context');
console.log('• Complex (400 tokens): Technical topics, detailed explanations');
console.log('• Detailed (600 tokens): Multi-part questions, comprehensive guides');