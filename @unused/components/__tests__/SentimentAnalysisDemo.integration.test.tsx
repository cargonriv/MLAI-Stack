import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SentimentAnalysisDemo } from '../demos/SentimentAnalysisDemo';

// Mock the sentiment analysis utility
vi.mock('../../utils/sentimentAnalysis', () => ({
  BERTSentimentAnalyzer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    analyze: vi.fn().mockResolvedValue({
      label: 'POSITIVE',
      confidence: 0.95,
      scores: {
        positive: 0.95,
        negative: 0.05
      },
      processingTime: 150,
      modelInfo: {
        name: 'distilbert-base-uncased-finetuned-sst-2-english',
        size: '67MB',
        architecture: 'DistilBERT'
      }
    }),
    isModelLoaded: vi.fn().mockReturnValue(true),
    getModelInfo: vi.fn().mockReturnValue({
      name: 'distilbert-base-uncased-finetuned-sst-2-english',
      size: 67 * 1024 * 1024,
      architecture: 'DistilBERT',
      loadTime: 2500,
      memoryUsage: 67 * 1024 * 1024,
      device: 'cpu'
    })
  }))
}));

describe('SentimentAnalysisDemo Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render and initialize model', async () => {
    render(<SentimentAnalysisDemo />);
    
    expect(screen.getByText(/Sentiment Analysis/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter text to analyze/i)).toBeInTheDocument();
    
    // Wait for model initialization
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
  });

  it('should analyze text and display results', async () => {
    render(<SentimentAnalysisDemo />);
    
    // Wait for model to be ready
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    const textInput = screen.getByPlaceholderText(/Enter text to analyze/i);
    const analyzeButton = screen.getByText(/Analyze/i);
    
    fireEvent.change(textInput, { target: { value: 'I love this product!' } });
    fireEvent.click(analyzeButton);
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText(/POSITIVE/i)).toBeInTheDocument();
      expect(screen.getByText(/95.00%/i)).toBeInTheDocument();
    });
    
    // Check if processing time is displayed
    expect(screen.getByText(/150ms/i)).toBeInTheDocument();
  });

  it('should handle model loading errors gracefully', async () => {
    const { BERTSentimentAnalyzer } = await import('../../utils/sentimentAnalysis');
    const mockAnalyzer = vi.mocked(BERTSentimentAnalyzer);
    
    mockAnalyzer.mockImplementation(() => ({
      initialize: vi.fn().mockRejectedValue(new Error('Model loading failed')),
      analyze: vi.fn(),
      isModelLoaded: vi.fn().mockReturnValue(false),
      getModelInfo: vi.fn().mockReturnValue(null)
    }) as any);
    
    render(<SentimentAnalysisDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading model/i)).toBeInTheDocument();
    });
  });

  it('should show loading states during analysis', async () => {
    const { BERTSentimentAnalyzer } = await import('../../utils/sentimentAnalysis');
    const mockAnalyzer = vi.mocked(BERTSentimentAnalyzer);
    
    let resolveAnalysis: (value: any) => void;
    const analysisPromise = new Promise(resolve => {
      resolveAnalysis = resolve;
    });
    
    mockAnalyzer.mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      analyze: vi.fn().mockReturnValue(analysisPromise),
      isModelLoaded: vi.fn().mockReturnValue(true),
      getModelInfo: vi.fn().mockReturnValue({
        name: 'test-model',
        size: 67 * 1024 * 1024,
        architecture: 'DistilBERT'
      })
    }) as any);
    
    render(<SentimentAnalysisDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    const textInput = screen.getByPlaceholderText(/Enter text to analyze/i);
    const analyzeButton = screen.getByText(/Analyze/i);
    
    fireEvent.change(textInput, { target: { value: 'Test text' } });
    fireEvent.click(analyzeButton);
    
    // Should show analyzing state
    expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
    expect(analyzeButton).toBeDisabled();
    
    // Resolve the analysis
    resolveAnalysis!({
      label: 'POSITIVE',
      confidence: 0.8,
      scores: { positive: 0.8, negative: 0.2 },
      processingTime: 200,
      modelInfo: { name: 'test-model', size: '67MB', architecture: 'DistilBERT' }
    });
    
    await waitFor(() => {
      expect(screen.getByText(/POSITIVE/i)).toBeInTheDocument();
      expect(screen.queryByText(/Analyzing/i)).not.toBeInTheDocument();
    });
  });

  it('should validate input text', async () => {
    render(<SentimentAnalysisDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    const analyzeButton = screen.getByText(/Analyze/i);
    
    // Try to analyze empty text
    fireEvent.click(analyzeButton);
    
    expect(screen.getByText(/Please enter some text/i)).toBeInTheDocument();
  });

  it('should display model information', async () => {
    render(<SentimentAnalysisDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    // Check if model info is displayed
    expect(screen.getByText(/distilbert-base-uncased-finetuned-sst-2-english/i)).toBeInTheDocument();
    expect(screen.getByText(/67MB/i)).toBeInTheDocument();
    expect(screen.getByText(/DistilBERT/i)).toBeInTheDocument();
  });

  it('should handle text truncation for long inputs', async () => {
    render(<SentimentAnalysisDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    const textInput = screen.getByPlaceholderText(/Enter text to analyze/i);
    const longText = 'a'.repeat(1000);
    
    fireEvent.change(textInput, { target: { value: longText } });
    
    expect(screen.getByText(/Text will be truncated/i)).toBeInTheDocument();
  });
});