/**
 * Input complexity analysis utility for adaptive token allocation
 */

export interface ComplexityAnalysis {
  complexity: 'simple' | 'moderate' | 'complex' | 'detailed';
  suggestedTokens: number;
  reasoning: string;
  score: number;
}

/**
 * Analyze the complexity of user input to determine appropriate response length
 */
export function analyzeInputComplexity(input: string): ComplexityAnalysis {
  const messageLength = input.length;
  const wordCount = input.split(/\s+/).length;
  const sentenceCount = input.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  // Complexity indicators
  const hasQuestions = (input.match(/\?/g) || []).length;
  const hasCodeKeywords = /\b(code|implementation|function|class|algorithm|debug|error|syntax|programming|development)\b/i.test(input);
  const hasExplanationKeywords = /\b(explain|how|why|what|describe|detail|elaborate|compare|analyze|understand|clarify)\b/i.test(input);
  const hasListKeywords = /\b(list|steps|process|examples|types|methods|approaches|guide|tutorial|walkthrough)\b/i.test(input);
  const hasTechnicalTerms = /\b(machine learning|neural network|tensorflow|pytorch|react|typescript|javascript|python|api|database|algorithm|framework|library)\b/i.test(input);
  const hasMultipleTopics = input.includes(' and ') || input.includes(' or ') || hasQuestions > 1;
  const hasComparisons = /\b(vs|versus|difference|compare|better|best|pros|cons|advantages|disadvantages)\b/i.test(input);
  const hasDeepDive = /\b(deep|detailed|comprehensive|thorough|complete|full|extensive|in-depth)\b/i.test(input);

  let complexityScore = 0;
  let reasoning = [];

  // Length-based scoring
  if (wordCount > 50) {
    complexityScore += 2;
    reasoning.push('long input');
  } else if (wordCount > 20) {
    complexityScore += 1;
    reasoning.push('medium input');
  }

  // Content-based scoring
  if (hasCodeKeywords) {
    complexityScore += 2;
    reasoning.push('code-related');
  }
  if (hasExplanationKeywords) {
    complexityScore += 2;
    reasoning.push('explanation needed');
  }
  if (hasListKeywords) {
    complexityScore += 1;
    reasoning.push('list/steps requested');
  }
  if (hasTechnicalTerms) {
    complexityScore += 1;
    reasoning.push('technical content');
  }
  if (hasMultipleTopics) {
    complexityScore += 2;
    reasoning.push('multiple topics');
  }
  if (sentenceCount > 3) {
    complexityScore += 1;
    reasoning.push('multi-sentence query');
  }
  if (hasQuestions > 1) {
    complexityScore += 1;
    reasoning.push('multiple questions');
  }
  if (hasComparisons) {
    complexityScore += 1;
    reasoning.push('comparison requested');
  }
  if (hasDeepDive) {
    complexityScore += 2;
    reasoning.push('detailed analysis requested');
  }

  // Determine complexity level and token allocation
  let complexity: 'simple' | 'moderate' | 'complex' | 'detailed';
  let suggestedTokens: number;

  if (complexityScore <= 2) {
    complexity = 'simple';
    suggestedTokens = 4096; // Short, direct answers
  } else if (complexityScore <= 4) {
    complexity = 'moderate';
    suggestedTokens = 800; // Standard responses
  } else if (complexityScore <= 6) {
    complexity = 'complex';
    suggestedTokens = 1500; // Detailed explanations
  } else {
    complexity = 'detailed';
    suggestedTokens = 5000; // Comprehensive responses
  }

  return {
    complexity,
    suggestedTokens,
    reasoning: reasoning.join(', ') || 'basic query',
    score: complexityScore
  };
}

/**
 * Get a human-readable description of complexity levels
 */
export function getComplexityDescription(complexity: ComplexityAnalysis['complexity']): string {
  switch (complexity) {
    case 'simple':
      return 'Simple question requiring a brief, direct answer';
    case 'moderate':
      return 'Standard question needing a balanced explanation';
    case 'complex':
      return 'Complex topic requiring detailed explanation with examples';
    case 'detailed':
      return 'Multi-faceted question needing comprehensive coverage';
    default:
      return 'Unknown complexity level';
  }
}

/**
 * Get suggested token ranges for different complexity levels
 */
export function getTokenRanges(): Record<ComplexityAnalysis['complexity'], { min: number; max: number; description: string }> {
  return {
    simple: {
      min: 150,
      max: 200,
      description: 'Quick answers, definitions, simple facts'
    },
    moderate: {
      min: 300,
      max: 400,
      description: 'Standard explanations with context'
    },
    complex: {
      min: 600,
      max: 800,
      description: 'Detailed explanations with examples'
    },
    detailed: {
      min: 1200,
      max: 1500,
      description: 'Comprehensive analysis and multi-part responses'
    }
  };
}

/**
 * Example usage and test cases
 */
export const complexityExamples = {
  simple: [
    "Hi",
    "What is React?",
    "How old are you?",
    "Thanks!"
  ],
  moderate: [
    "How does machine learning work?",
    "What are the main features of TypeScript?",
    "Can you explain Carlos's background?"
  ],
  complex: [
    "How do I implement a neural network from scratch and what are the key considerations?",
    "Compare TensorFlow vs PyTorch for computer vision projects",
    "Explain the architecture of this portfolio website and how the client-side ML works"
  ],
  detailed: [
    "I need a comprehensive guide on building production ML systems, including data pipelines, model training, deployment strategies, monitoring, and scaling considerations. Can you also compare different approaches and provide code examples?",
    "Analyze Carlos's SIDS prediction project in detail, explain the methodology, compare it with other approaches, discuss the ethical implications, and suggest improvements"
  ]
};