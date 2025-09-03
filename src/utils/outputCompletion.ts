/**
 * Intelligent Output Completion Utility
 * 
 * Ensures LLM-generated text completes full sentences and thoughts
 * rather than cutting off mid-sentence or mid-thought.
 */

export interface CompletionConfig {
  maxAdditionalTokens?: number;
  timeoutMs?: number;
  minCompletionLength?: number;
  languageCode?: string;
  contentType?: 'conversational' | 'technical' | 'code' | 'creative' | 'structured';
  ensureCompleteThought?: boolean;
  adaptiveTokens?: boolean;
  complexityLevel?: 'simple' | 'moderate' | 'complex' | 'detailed';
}

export interface CompletionResult {
  completedText: string;
  wasCompleted: boolean;
  additionalTokensUsed: number;
  completionReason: string;
  processingTimeMs: number;
}

/**
 * Analyzes text to determine if it needs completion
 */
export function needsCompletion(text: string, config: CompletionConfig = {}): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const trimmedText = text.trim();
  const languageCode = config.languageCode || 'en';
  
  // Enhanced completion detection for complete thoughts
  if (config.ensureCompleteThought !== false) {
    // Check for incomplete sentences (basic)
    if (isIncompleteBasic(trimmedText, languageCode)) {
      return true;
    }

    // Check for incomplete thoughts (advanced)
    if (isIncompleteThought(trimmedText, config.contentType)) {
      return true;
    }

    // Check for mid-sentence cutoffs
    if (isMidSentenceCutoff(trimmedText)) {
      return true;
    }

    // Check for incomplete explanations
    if (isIncompleteExplanation(trimmedText, config.complexityLevel)) {
      return true;
    }
  }

  // Check for incomplete code blocks
  if (config.contentType === 'code' && isIncompleteCode(trimmedText)) {
    return true;
  }

  return false;
}

/**
 * Basic incomplete sentence detection
 */
function isIncompleteBasic(text: string, languageCode: string): boolean {
  const trimmed = text.trim();
  
  // Check for sentences that don't end with proper punctuation
  const endsWithPunctuation = /[.!?]$/.test(trimmed);
  if (!endsWithPunctuation) {
    return true;
  }

  // Check for incomplete parentheses, brackets, or quotes
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/\]/g) || []).length;
  const openBraces = (trimmed.match(/\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}/g) || []).length;
  const quotes = (trimmed.match(/"/g) || []).length;

  if (openParens !== closeParens || openBrackets !== closeBrackets || 
      openBraces !== closeBraces || quotes % 2 !== 0) {
    return true;
  }

  return false;
}

/**
 * Check for incomplete thoughts based on content type
 */
function isIncompleteThought(text: string, contentType?: string): boolean {
  switch (contentType) {
    case 'technical':
      return isIncompleteTechnical(text);
    case 'conversational':
      return isIncompleteConversational(text);
    case 'structured':
      return isIncompleteStructured(text);
    case 'creative':
      return isIncompleteCreative(text);
    default:
      return isIncompleteGeneral(text);
  }
}

function isIncompleteTechnical(text: string): boolean {
  // Technical explanations often have multi-part structures
  const technicalPatterns = [
    /\b(step|phase|stage|part|section|component|element|aspect|feature|function|method|process|procedure|algorithm|implementation|configuration|setup|installation|deployment|testing|debugging|optimization|analysis|evaluation|comparison|example|demonstration|illustration|explanation|description|definition|specification|requirement|constraint|limitation|advantage|disadvantage|benefit|drawback|consideration|recommendation|suggestion|conclusion|summary|overview|introduction|background|context|scope|objective|goal|purpose|result|outcome|finding|observation|insight|implication|application|usage|practice|approach|strategy|technique|solution|problem|issue|challenge|difficulty|complexity|simplicity|efficiency|performance|scalability|reliability|security|maintainability|usability|accessibility|compatibility|interoperability|portability|flexibility|extensibility|modularity|reusability|testability|debuggability|readability)\s+\d+[:\.]?\s*$/i,
    /\b(first|second|third|fourth|fifth|next|then|finally|lastly|additionally|furthermore|moreover|however|therefore|thus|consequently|as a result|in conclusion|to summarize)\b.*$/i,
  ];

  return technicalPatterns.some(pattern => pattern.test(text));
}

function isIncompleteConversational(text: string): boolean {
  const conversationalPatterns = [
    /\b(and|or|but|however|so|because|since|while|when|if|unless|although|though|whereas|moreover|furthermore|additionally|also|likewise|similarly|conversely|on the other hand|in contrast|for example|for instance|such as|including|like|as well as|not only|either|neither|both|whether)\s*$/i,
    /\b(let me|i think|i believe|i feel|in my opinion|from my perspective|it seems|it appears|it looks like|it sounds like)\b.*$/i,
  ];

  return conversationalPatterns.some(pattern => pattern.test(text));
}

function isIncompleteStructured(text: string): boolean {
  const structuredPatterns = [
    /^\d+\.\s*$/,  // Numbered list item with no content
    /^[-*]\s*$/,   // Bullet point with no content
    /:\s*$/,       // Colon at end suggesting list or explanation follows
  ];

  return structuredPatterns.some(pattern => pattern.test(text));
}

function isIncompleteCreative(text: string): boolean {
  const creativePatterns = [
    /\b(once upon a time|in a world where|imagine|picture this|it was a|there was a|long ago|in the beginning|suddenly|meanwhile|later|eventually|finally|the end)\b.*$/i,
  ];

  return creativePatterns.some(pattern => pattern.test(text));
}

function isIncompleteGeneral(text: string): boolean {
  const generalPatterns = [
    /\b(that|which|who|whom|whose|where|when|why|how|what)\s*$/i,
    /\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their|some|any|all|each|every|no|none)\s*$/i,
  ];

  return generalPatterns.some(pattern => pattern.test(text));
}

function isIncompleteCode(text: string): boolean {
  const codePatterns = [
    /\{\s*$/,      // Opening brace
    /\(\s*$/,      // Opening parenthesis
    /\[\s*$/,      // Opening bracket
    /=\s*$/,       // Assignment operator
    /,\s*$/,       // Comma
    /\+\s*$/,      // Plus operator
    /-\s*$/,       // Minus operator
    /\*\s*$/,      // Multiplication operator
    /\/\s*$/,      // Division operator
    /&&\s*$/,      // Logical AND
    /\|\|\s*$/,    // Logical OR
  ];

  return codePatterns.some(pattern => pattern.test(text));
}

/**
 * Detects if text was cut off mid-sentence
 */
function isMidSentenceCutoff(text: string): boolean {
  const trimmed = text.trim();
  
  // Check for common mid-sentence indicators
  const midSentencePatterns = [
    /\b(and|or|but|however|therefore|thus|so|because|since|while|when|if|unless|although|though|whereas|moreover|furthermore|additionally|also|likewise|similarly|conversely|on the other hand|in contrast|for example|for instance|such as|including|like|as well as|not only|either|neither|both|whether|that|which|who|whom|whose|where|why|how|what|when)\s*$/i,
    /\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their|some|any|all|each|every|no|none|one|two|three|many|few|several|most|more|less|much|little|very|quite|rather|too|so|such|as|like|than|then|now|here|there|where|when|why|how|what|who|which|that)\s*$/i,
    /\b(is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|might|may|can|must|shall|ought)\s*$/i,
    /,\s*$/,  // Ends with comma
    /:\s*$/,  // Ends with colon
    /;\s*$/,  // Ends with semicolon
    /\(\s*$/, // Ends with opening parenthesis
    /\[\s*$/, // Ends with opening bracket
    /\{\s*$/, // Ends with opening brace
    /-\s*$/,  // Ends with dash
  ];

  return midSentencePatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Detects if an explanation is incomplete based on complexity level
 */
function isIncompleteExplanation(text: string, complexityLevel?: string): boolean {
  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
  // Minimum word counts based on complexity
  const minWordCounts = {
    simple: 20,
    moderate: 40,
    complex: 80,
    detailed: 150
  };

  const minWords = complexityLevel ? minWordCounts[complexityLevel as keyof typeof minWordCounts] || 30 : 30;
  
  if (wordCount < minWords) {
    return true;
  }

  // Check for incomplete explanatory patterns
  const incompleteExplanationPatterns = [
    /\b(let me explain|to understand|it's important to note|keep in mind|consider|remember|note that|it's worth mentioning|another important point|furthermore|additionally|moreover|also|in addition|besides|what's more)\b.*$/i,
    /\b(step|phase|stage|part|section|component|element|aspect|feature|function|method|process|procedure|algorithm|implementation|configuration|setup|installation|deployment|testing|debugging|optimization|analysis|evaluation|comparison|example|demonstration|illustration|explanation|description|definition|specification|requirement|constraint|limitation|advantage|disadvantage|benefit|drawback|consideration|recommendation|suggestion|conclusion|summary|overview|introduction|background|context|scope|objective|goal|purpose|result|outcome|finding|observation|insight|implication|application|usage|practice|approach|strategy|technique|solution|problem|issue|challenge|difficulty|complexity|simplicity|efficiency|performance|scalability|reliability|security|maintainability|usability|accessibility|compatibility|interoperability|portability|flexibility|extensibility|modularity|reusability|testability|debuggability|readability)\s+\d+[:\.]?\s*$/i,
  ];

  return incompleteExplanationPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Auto-detect and complete output using the best available method
 */
export async function autoCompleteOutput(
    originalText: string,
    messages: Array<{ role: string, content: string }>,
    generationMethod: string,
    config: CompletionConfig = {}
): Promise<CompletionResult> {
    const startTime = Date.now();
    
    // Enhanced configuration with adaptive tokens
    const enhancedConfig: CompletionConfig = {
        maxAdditionalTokens: 100,
        timeoutMs: 10000,
        minCompletionLength: 10,
        contentType: 'conversational',
        languageCode: 'en',
        ensureCompleteThought: true,
        adaptiveTokens: true,
        ...config
    };

    // Adjust completion tokens based on complexity
    if (enhancedConfig.adaptiveTokens && enhancedConfig.complexityLevel) {
        const complexityMultipliers = {
            simple: 0.5,
            moderate: 1.0,
            complex: 1.5,
            detailed: 2.0
        };
        
        const multiplier = complexityMultipliers[enhancedConfig.complexityLevel] || 1.0;
        enhancedConfig.maxAdditionalTokens = Math.round((enhancedConfig.maxAdditionalTokens || 100) * multiplier);
    }

    if (!needsCompletion(originalText, enhancedConfig)) {
        return {
            completedText: originalText,
            wasCompleted: false,
            additionalTokensUsed: 0,
            completionReason: 'Text appears complete',
            processingTimeMs: Date.now() - startTime
        };
    }

    try {
        // Use the same generation method that created the original text
        let completedText = originalText;
        let additionalTokens = 0;
        
        // Create completion prompt
        const completionPrompt = `Please complete this response naturally and ensure it finishes the thought completely:\n\n"${originalText}"`;
        
        // Add completion request to messages
        const completionMessages = [
            ...messages,
            { role: 'user', content: completionPrompt }
        ];

        // Generate completion based on the method used
        if (generationMethod.includes('transformers')) {
            const { generateTransformersResponse } = await import('./transformersLLM');
            const completion = await generateTransformersResponse(
                completionMessages.map(m => ({ role: m.role as any, content: m.content })),
                {
                    max_new_tokens: enhancedConfig.maxAdditionalTokens,
                    temperature: 0.3, // Lower temperature for more focused completion
                    adaptive_tokens: false // Don't double-apply adaptive tokens
                }
            );
            
            // Extract the completion part
            const completionStart = completion.indexOf(originalText);
            if (completionStart !== -1) {
                const additionalText = completion.substring(completionStart + originalText.length).trim();
                if (additionalText.length >= (enhancedConfig.minCompletionLength || 10)) {
                    completedText = originalText + ' ' + additionalText;
                    additionalTokens = additionalText.split(/\s+/).length;
                }
            }
        } else if (generationMethod.includes('webllm')) {
            const { generateResponse } = await import('./webllm');
            const completion = await generateResponse(
                completionMessages.map(m => ({ role: m.role as any, content: m.content })),
                {
                    max_tokens: enhancedConfig.maxAdditionalTokens,
                    temperature: 0.3,
                    adaptive_tokens: false
                }
            );
            
            // Extract the completion part
            const completionStart = completion.indexOf(originalText);
            if (completionStart !== -1) {
                const additionalText = completion.substring(completionStart + originalText.length).trim();
                if (additionalText.length >= (enhancedConfig.minCompletionLength || 10)) {
                    completedText = originalText + ' ' + additionalText;
                    additionalTokens = additionalText.split(/\s+/).length;
                }
            }
        }

        const wasCompleted = completedText !== originalText;
        
        return {
            completedText,
            wasCompleted,
            additionalTokensUsed: additionalTokens,
            completionReason: wasCompleted ? 'Successfully completed incomplete thought' : 'Could not generate meaningful completion',
            processingTimeMs: Date.now() - startTime
        };

    } catch (error) {
        console.error('Auto-completion failed:', error);
        return {
            completedText: originalText,
            wasCompleted: false,
            additionalTokensUsed: 0,
            completionReason: `Completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            processingTimeMs: Date.now() - startTime
        };
    }
}