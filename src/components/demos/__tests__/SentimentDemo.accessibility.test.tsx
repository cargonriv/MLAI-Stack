import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SentimentDemo from '../SentimentDemo';

// Mock the accessibility hook
vi.mock('@/hooks/use-accessibility', () => ({
  useAccessibility: () => ({
    preferences: {
      reducedMotion: false,
      highContrast: false,
      keyboardNavigation: true,
      screenReader: false,
    },
    announce: vi.fn(),
    manageFocus: vi.fn(),
    handleKeyboardNavigation: vi.fn((e, options) => {
      if (e.key === 'Enter' && options.onEnter) options.onEnter();
      if (e.key === ' ' && options.onSpace) options.onSpace();
      if (e.key === 'Escape' && options.onEscape) options.onEscape();
    }),
    getAriaProps: vi.fn((type, options = {}) => {
      const props: Record<string, any> = {};
      if (options.label) props['aria-label'] = options.label;
      if (options.level) props['aria-level'] = options.level;
      if (type === 'region') props.role = 'region';
      if (type === 'heading') props.role = 'heading';
      return props;
    }),
  }),
}));

// Mock other hooks
vi.mock('@/hooks/use-retry', () => ({
  useRetry: () => ({
    retry: vi.fn().mockResolvedValue({ 
      label: 'POSITIVE', 
      confidence: 0.95,
      scores: { positive: 0.95, negative: 0.05 },
      processing_time: 123.4,
      model_info: {
        name: 'distilbert-base-uncased-finetuned-sst-2-english',
        architecture: 'DistilBERT',
        device: 'cpu'
      }
    }),
    isRetrying: false,
    attempt: 0,
    canRetry: true,
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-offline', () => ({
  useOffline: () => ({
    isOnline: true,
    isChecking: false,
  }),
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({
    label: 'POSITIVE',
    confidence: 0.95,
    scores: { positive: 0.95, negative: 0.05 },
    processing_time: 123.4,
    model_info: {
      name: 'distilbert-base-uncased-finetuned-sst-2-english',
      architecture: 'DistilBERT',
      device: 'cpu'
    }
  }),
});

describe('SentimentDemo Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have proper ARIA labels and roles', () => {
    render(<SentimentDemo />);
    
    // Check main region
    expect(screen.getByRole('region', { name: /BERT Sentiment Analysis Demo/i })).toBeInTheDocument();
    
    // Check heading
    expect(screen.getByRole('heading', { name: /BERT Sentiment Analysis/i })).toBeInTheDocument();
    
    // Check textarea
    const textarea = screen.getByLabelText(/Enter text to analyze/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-required', 'true');
    expect(textarea).toHaveAttribute('aria-describedby');
    
    // Check analyze button
    const analyzeButton = screen.getByRole('button', { name: /Analyze Sentiment/i });
    expect(analyzeButton).toBeInTheDocument();
    expect(analyzeButton).toHaveAttribute('aria-describedby');
  });

  it('should announce character count milestones', async () => {
    const user = userEvent.setup();
    const mockAnnounce = vi.fn();
    
    vi.mocked(require('@/hooks/use-accessibility').useAccessibility).mockReturnValue({
      preferences: { reducedMotion: false, highContrast: false, keyboardNavigation: true, screenReader: false },
      announce: mockAnnounce,
      manageFocus: vi.fn(),
      handleKeyboardNavigation: vi.fn(),
      getAriaProps: vi.fn(() => ({})),
    });

    render(<SentimentDemo />);
    
    const textarea = screen.getByLabelText(/Enter text to analyze/i);
    
    // Type text to reach 950 characters
    const longText = 'a'.repeat(950);
    await user.type(textarea, longText);
    
    expect(mockAnnounce).toHaveBeenCalledWith(
      'Approaching character limit: 950 of 1000 characters',
      'polite'
    );
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<SentimentDemo />);
    
    const textarea = screen.getByLabelText(/Enter text to analyze/i);
    
    // Focus textarea and type text
    await user.click(textarea);
    await user.type(textarea, 'This is a test message');
    
    // Test Ctrl+Enter to analyze
    await user.keyboard('{Control>}{Enter}{/Control}');
    
    // Should trigger analysis (button should show loading state)
    await waitFor(() => {
      expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
    });
  });

  it('should have proper focus management', async () => {
    const mockManageFocus = vi.fn();
    
    vi.mocked(require('@/hooks/use-accessibility').useAccessibility).mockReturnValue({
      preferences: { reducedMotion: false, highContrast: false, keyboardNavigation: true, screenReader: false },
      announce: vi.fn(),
      manageFocus: mockManageFocus,
      handleKeyboardNavigation: vi.fn(),
      getAriaProps: vi.fn(() => ({})),
    });

    const user = userEvent.setup();
    render(<SentimentDemo />);
    
    const textarea = screen.getByLabelText(/Enter text to analyze/i);
    const clearButton = screen.getByRole('button', { name: /Clear/i });
    
    // Type some text
    await user.type(textarea, 'Test text');
    
    // Click clear button
    await user.click(clearButton);
    
    // Should manage focus back to textarea
    expect(mockManageFocus).toHaveBeenCalled();
  });

  it('should have accessible progress indicators', () => {
    render(<SentimentDemo />);
    
    const textarea = screen.getByLabelText(/Enter text to analyze/i);
    fireEvent.change(textarea, { target: { value: 'Test text' } });
    
    // Check character count progress bar
    const progressBar = screen.getByRole('progressbar', { name: /Character count progress/i });
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '1000');
  });

  it('should announce analysis results', async () => {
    const mockAnnounce = vi.fn();
    
    vi.mocked(require('@/hooks/use-accessibility').useAccessibility).mockReturnValue({
      preferences: { reducedMotion: false, highContrast: false, keyboardNavigation: true, screenReader: false },
      announce: mockAnnounce,
      manageFocus: vi.fn(),
      handleKeyboardNavigation: vi.fn(),
      getAriaProps: vi.fn(() => ({})),
    });

    const user = userEvent.setup();
    render(<SentimentDemo />);
    
    const textarea = screen.getByLabelText(/Enter text to analyze/i);
    const analyzeButton = screen.getByRole('button', { name: /Analyze Sentiment/i });
    
    // Type text and analyze
    await user.type(textarea, 'This is a great product!');
    await user.click(analyzeButton);
    
    // Should announce start of analysis
    expect(mockAnnounce).toHaveBeenCalledWith(
      'Starting sentiment analysis. Please wait...',
      'polite'
    );
    
    // Wait for results and check announcement
    await waitFor(() => {
      expect(mockAnnounce).toHaveBeenCalledWith(
        expect.stringContaining('Analysis complete'),
        'polite'
      );
    });
  });

  it('should handle reduced motion preferences', () => {
    vi.mocked(require('@/hooks/use-accessibility').useAccessibility).mockReturnValue({
      preferences: { reducedMotion: true, highContrast: false, keyboardNavigation: true, screenReader: false },
      announce: vi.fn(),
      manageFocus: vi.fn(),
      handleKeyboardNavigation: vi.fn(),
      getAriaProps: vi.fn(() => ({})),
    });

    render(<SentimentDemo />);
    
    // Check that motion-reduce classes are applied
    const mainContainer = screen.getByRole('region', { name: /BERT Sentiment Analysis Demo/i });
    expect(mainContainer).toHaveClass('motion-reduce:transition-none');
  });

  it('should have proper error announcements', async () => {
    const mockAnnounce = vi.fn();
    
    vi.mocked(require('@/hooks/use-accessibility').useAccessibility).mockReturnValue({
      preferences: { reducedMotion: false, highContrast: false, keyboardNavigation: true, screenReader: false },
      announce: mockAnnounce,
      manageFocus: vi.fn(),
      handleKeyboardNavigation: vi.fn(),
      getAriaProps: vi.fn(() => ({})),
    });

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();
    render(<SentimentDemo />);
    
    const textarea = screen.getByLabelText(/Enter text to analyze/i);
    const analyzeButton = screen.getByRole('button', { name: /Analyze Sentiment/i });
    
    // Type text and analyze
    await user.type(textarea, 'This is a test');
    await user.click(analyzeButton);
    
    // Should announce error
    await waitFor(() => {
      expect(mockAnnounce).toHaveBeenCalledWith(
        expect.stringContaining('Analysis failed'),
        'assertive'
      );
    });
  });

  it('should have accessible connection status', () => {
    render(<SentimentDemo />);
    
    // Check connection status indicator
    const connectionStatus = screen.getByRole('status', { name: /Connection status/i });
    expect(connectionStatus).toBeInTheDocument();
    expect(connectionStatus).toHaveAttribute('aria-live', 'polite');
  });
});