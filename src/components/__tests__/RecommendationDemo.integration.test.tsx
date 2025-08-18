import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecommendationDemo } from '../demos/RecommendationDemo';

// Mock the collaborative filtering utility
vi.mock('../../utils/collaborativeFiltering', () => ({
  CollaborativeFilteringEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    generateRecommendations: vi.fn().mockResolvedValue([
      {
        movieId: 1,
        title: 'The Matrix',
        predictedRating: 4.5,
        confidence: 0.85,
        genres: ['Action', 'Sci-Fi'],
        explanation: 'Based on your ratings of similar sci-fi movies',
        similarUsers: [123, 456]
      },
      {
        movieId: 2,
        title: 'Inception',
        predictedRating: 4.2,
        confidence: 0.78,
        genres: ['Action', 'Thriller'],
        explanation: 'Users with similar tastes also enjoyed this',
        similarUsers: [789, 101]
      }
    ]),
    isModelLoaded: vi.fn().mockReturnValue(true),
    getModelInfo: vi.fn().mockReturnValue({
      name: 'SVD Matrix Factorization',
      size: 5 * 1024 * 1024,
      architecture: 'SVD',
      loadTime: 1500,
      memoryUsage: 5 * 1024 * 1024,
      device: 'cpu'
    })
  }))
}));

// Mock movie database
vi.mock('../../utils/movieDatabase', () => ({
  searchMovies: vi.fn().mockResolvedValue([
    { id: 1, title: 'The Matrix', genres: ['Action', 'Sci-Fi'], year: 1999 },
    { id: 2, title: 'Inception', genres: ['Action', 'Thriller'], year: 2010 },
    { id: 3, title: 'Interstellar', genres: ['Drama', 'Sci-Fi'], year: 2014 }
  ]),
  getMovieById: vi.fn().mockImplementation((id: number) => ({
    id,
    title: id === 1 ? 'The Matrix' : id === 2 ? 'Inception' : 'Interstellar',
    genres: id === 1 ? ['Action', 'Sci-Fi'] : id === 2 ? ['Action', 'Thriller'] : ['Drama', 'Sci-Fi'],
    year: id === 1 ? 1999 : id === 2 ? 2010 : 2014
  }))
}));

describe('RecommendationDemo Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render and initialize recommendation engine', async () => {
    render(<RecommendationDemo />);
    
    expect(screen.getByText(/Movie Recommendations/i)).toBeInTheDocument();
    expect(screen.getByText(/Rate some movies/i)).toBeInTheDocument();
    
    // Wait for model initialization
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
  });

  it('should allow users to rate movies and generate recommendations', async () => {
    render(<RecommendationDemo />);
    
    // Wait for model to be ready
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    // Search for a movie
    const searchInput = screen.getByPlaceholderText(/Search for movies/i);
    fireEvent.change(searchInput, { target: { value: 'Matrix' } });
    
    await waitFor(() => {
      expect(screen.getByText(/The Matrix/i)).toBeInTheDocument();
    });
    
    // Rate the movie
    const ratingStars = screen.getAllByRole('button', { name: /star/i });
    fireEvent.click(ratingStars[4]); // 5-star rating
    
    // Generate recommendations
    const getRecommendationsButton = screen.getByText(/Get Recommendations/i);
    fireEvent.click(getRecommendationsButton);
    
    // Wait for recommendations to appear
    await waitFor(() => {
      expect(screen.getByText(/Recommended for you/i)).toBeInTheDocument();
      expect(screen.getByText(/The Matrix/i)).toBeInTheDocument();
      expect(screen.getByText(/Inception/i)).toBeInTheDocument();
    });
    
    // Check if confidence scores are displayed
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
    expect(screen.getByText(/78%/i)).toBeInTheDocument();
  });

  it('should handle cold start problem with no ratings', async () => {
    render(<RecommendationDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    const getRecommendationsButton = screen.getByText(/Get Recommendations/i);
    fireEvent.click(getRecommendationsButton);
    
    expect(screen.getByText(/Please rate at least/i)).toBeInTheDocument();
  });

  it('should show loading states during recommendation generation', async () => {
    const { CollaborativeFilteringEngine } = await import('../../utils/collaborativeFiltering');
    const mockEngine = vi.mocked(CollaborativeFilteringEngine);
    
    let resolveRecommendations: (value: any) => void;
    const recommendationsPromise = new Promise(resolve => {
      resolveRecommendations = resolve;
    });
    
    mockEngine.mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      generateRecommendations: vi.fn().mockReturnValue(recommendationsPromise),
      isModelLoaded: vi.fn().mockReturnValue(true),
      getModelInfo: vi.fn().mockReturnValue({
        name: 'SVD Matrix Factorization',
        size: 5 * 1024 * 1024,
        architecture: 'SVD'
      })
    }) as any);
    
    render(<RecommendationDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    // Add a rating first
    const searchInput = screen.getByPlaceholderText(/Search for movies/i);
    fireEvent.change(searchInput, { target: { value: 'Matrix' } });
    
    await waitFor(() => {
      const ratingStars = screen.getAllByRole('button', { name: /star/i });
      fireEvent.click(ratingStars[4]);
    });
    
    const getRecommendationsButton = screen.getByText(/Get Recommendations/i);
    fireEvent.click(getRecommendationsButton);
    
    // Should show generating state
    expect(screen.getByText(/Generating recommendations/i)).toBeInTheDocument();
    expect(getRecommendationsButton).toBeDisabled();
    
    // Resolve the recommendations
    resolveRecommendations!([
      {
        movieId: 1,
        title: 'Test Movie',
        predictedRating: 4.0,
        confidence: 0.8,
        genres: ['Action'],
        explanation: 'Test explanation'
      }
    ]);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Movie/i)).toBeInTheDocument();
      expect(screen.queryByText(/Generating recommendations/i)).not.toBeInTheDocument();
    });
  });

  it('should display recommendation explanations', async () => {
    render(<RecommendationDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    // Add rating and generate recommendations
    const searchInput = screen.getByPlaceholderText(/Search for movies/i);
    fireEvent.change(searchInput, { target: { value: 'Matrix' } });
    
    await waitFor(() => {
      const ratingStars = screen.getAllByRole('button', { name: /star/i });
      fireEvent.click(ratingStars[4]);
    });
    
    const getRecommendationsButton = screen.getByText(/Get Recommendations/i);
    fireEvent.click(getRecommendationsButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Based on your ratings of similar sci-fi movies/i)).toBeInTheDocument();
      expect(screen.getByText(/Users with similar tastes also enjoyed this/i)).toBeInTheDocument();
    });
  });

  it('should allow algorithm selection', async () => {
    render(<RecommendationDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    // Check if algorithm selector is present
    const algorithmSelect = screen.getByLabelText(/Algorithm/i);
    expect(algorithmSelect).toBeInTheDocument();
    
    // Change algorithm
    fireEvent.change(algorithmSelect, { target: { value: 'neural' } });
    
    expect(algorithmSelect).toHaveValue('neural');
  });

  it('should handle model loading errors gracefully', async () => {
    const { CollaborativeFilteringEngine } = await import('../../utils/collaborativeFiltering');
    const mockEngine = vi.mocked(CollaborativeFilteringEngine);
    
    mockEngine.mockImplementation(() => ({
      initialize: vi.fn().mockRejectedValue(new Error('Model loading failed')),
      generateRecommendations: vi.fn(),
      isModelLoaded: vi.fn().mockReturnValue(false),
      getModelInfo: vi.fn().mockReturnValue(null)
    }) as any);
    
    render(<RecommendationDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading model/i)).toBeInTheDocument();
    });
  });

  it('should persist user ratings in localStorage', async () => {
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    render(<RecommendationDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Model Ready/i)).toBeInTheDocument();
    });
    
    // Rate a movie
    const searchInput = screen.getByPlaceholderText(/Search for movies/i);
    fireEvent.change(searchInput, { target: { value: 'Matrix' } });
    
    await waitFor(() => {
      const ratingStars = screen.getAllByRole('button', { name: /star/i });
      fireEvent.click(ratingStars[4]);
    });
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'movieRatings',
      expect.stringContaining('Matrix')
    );
  });
});