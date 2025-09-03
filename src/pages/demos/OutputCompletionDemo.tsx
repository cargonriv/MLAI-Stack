import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, Info, Zap } from 'lucide-react';
import { needsCompletion, completeOutput, createSimpleCompletionFunction, CompletionConfig } from '@/utils/outputCompletion';

const OutputCompletionDemo = () => {
  const [inputText, setInputText] = useState('This is an example of incomplete text that needs');
  const [completedText, setCompletedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);
  const [contentType, setContentType] = useState<'conversational' | 'technical' | 'code' | 'creative' | 'structured'>('conversational');

  const handleAnalyze = () => {
    const needsCompl = needsCompletion(inputText, { contentType });
    setCompletionResult({
      needsCompletion: needsCompl,
      reason: needsCompl ? 'Text appears incomplete' : 'Text appears complete'
    });
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    setCompletionResult(null);

    try {
      const config: CompletionConfig = {
        maxAdditionalTokens: 50,
        timeoutMs: 5000,
        minCompletionLength: 5,
        contentType,
        languageCode: 'en'
      };

      const completionFunction = createSimpleCompletionFunction(inputText);
      const result = await completeOutput(inputText, completionFunction, config);

      setCompletedText(result.completedText);
      setCompletionResult(result);
    } catch (error) {
      setCompletionResult({
        wasCompleted: false,
        completionReason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingTimeMs: 0,
        additionalTokensUsed: 0
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleTexts = {
    conversational: [
      "Well, I think that",
      "You know, the interesting thing about AI is",
      "I'd be happy to help you with",
      "That's a great question, and"
    ],
    technical: [
      "The algorithm works by",
      "Step 1: Initialize the",
      "The implementation requires",
      "This approach leverages"
    ],
    code: [
      "function processData() {",
      "const result =",
      "```javascript",
      "if (condition) {"
    ],
    creative: [
      "Once upon a time, in a distant land",
      "The mysterious figure approached",
      "As the sun set behind the mountains",
      "She opened the ancient book and"
    ],
    structured: [
      "The main benefits include:",
      "1. First advantage",
      "Key features:",
      "Requirements:"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              LLM Output Completion Demo
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience intelligent text completion that ensures LLM responses finish complete thoughts and sentences.
            </p>
          </div>

          {/* Main Demo */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Input Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Content Type</label>
                  <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="structured">Structured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Text to Analyze</label>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text that might need completion..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleAnalyze} variant="outline" size="sm">
                    Analyze
                  </Button>
                  <Button 
                    onClick={handleComplete} 
                    disabled={isProcessing || !inputText.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      'Complete Text'
                    )}
                  </Button>
                </div>

                {/* Example Texts */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Example Incomplete Texts</label>
                  <div className="flex flex-wrap gap-1">
                    {exampleTexts[contentType].map((example, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="text-xs h-auto p-2"
                        onClick={() => setInputText(example)}
                      >
                        {example.length > 30 ? example.substring(0, 30) + '...' : example}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Completion Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completionResult && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {completionResult.wasCompleted !== undefined ? (
                            completionResult.wasCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          ) : (
                            <Info className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="font-medium">
                            {completionResult.wasCompleted !== undefined 
                              ? (completionResult.wasCompleted ? 'Completed' : 'Not Completed')
                              : (completionResult.needsCompletion ? 'Needs Completion' : 'Complete')
                            }
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {completionResult.completionReason || completionResult.reason}
                        </p>
                        {completionResult.additionalTokensUsed > 0 && (
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              +{completionResult.additionalTokensUsed} tokens
                            </Badge>
                            <Badge variant="outline">
                              {completionResult.processingTimeMs}ms
                            </Badge>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {completedText && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Completed Text</label>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">
                        <span className="text-muted-foreground">{inputText}</span>
                        {completedText !== inputText && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {completedText.substring(inputText.length)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {!completionResult && !isProcessing && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Enter text above and click "Analyze" or "Complete Text" to see results.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feature Explanation */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How Output Completion Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyzes text patterns to identify incomplete sentences, thoughts, or code blocks.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Completion</h3>
                  <p className="text-sm text-muted-foreground">
                    Generates additional content to naturally complete the thought or sentence.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensures the completion maintains style, tone, and provides meaningful content.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OutputCompletionDemo;