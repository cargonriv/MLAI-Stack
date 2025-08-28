/**
 * Example usage of the CollaborativeFilteringEngine
 * This demonstrates how to use the collaborative filtering system
 * for movie recommendations.
 */

import { CollaborativeFilteringEngine, MovieRating } from './collaborativeFiltering';
import { ModelManager } from './modelManager';

// Example usage function
export async function demonstrateCollaborativeFiltering() {
  // Initialize the model manager and collaborative filtering engine
  const modelManager = new ModelManager();
  const cfEngine = new CollaborativeFilteringEngine(modelManager, {
    numFactors: 50,
    learningRate: 0.01,
    regularization: 0.1,
    iterations: 100,
    minRatings: 3
  });

  try {
    // Initialize the engine (loads movie database and trains SVD model)
    console.log('Initializing collaborative filtering engine...');
    await cfEngine.initialize();
    
    // Get model information
    const modelInfo = cfEngine.getModelInfo();
    console.log('Model Info:', modelInfo);

    // Example 1: Cold start - no user ratings
    console.log('\n=== Cold Start Recommendations ===');
    const coldStartRecs = await cfEngine.generateRecommendations([], 5);
    coldStartRecs.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.title} (${rec.genres.join(', ')}) - Rating: ${rec.predictedRating.toFixed(2)}, Confidence: ${rec.confidence.toFixed(2)}`);
      console.log(`   Explanation: ${rec.explanation}`);
    });

    // Example 2: User with few ratings (still cold start)
    console.log('\n=== Few Ratings Recommendations ===');
    const fewRatings: MovieRating[] = [
      { movieId: 1, title: 'The Shawshank Redemption', rating: 5, genres: ['Drama'] },
      { movieId: 3, title: 'The Dark Knight', rating: 4, genres: ['Action', 'Crime', 'Drama'] }
    ];
    
    const fewRatingsRecs = await cfEngine.generateRecommendations(fewRatings, 5);
    fewRatingsRecs.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.title} (${rec.genres.join(', ')}) - Rating: ${rec.predictedRating.toFixed(2)}, Confidence: ${rec.confidence.toFixed(2)}`);
      console.log(`   Explanation: ${rec.explanation}`);
    });

    // Example 3: User with sufficient ratings
    console.log('\n=== Sufficient Ratings Recommendations ===');
    const sufficientRatings: MovieRating[] = [
      { movieId: 1, title: 'The Shawshank Redemption', rating: 5, genres: ['Drama'] },
      { movieId: 2, title: 'The Godfather', rating: 5, genres: ['Crime', 'Drama'] },
      { movieId: 3, title: 'The Dark Knight', rating: 4, genres: ['Action', 'Crime', 'Drama'] },
      { movieId: 6, title: 'Inception', rating: 4, genres: ['Action', 'Sci-Fi', 'Thriller'] },
      { movieId: 7, title: 'The Matrix', rating: 5, genres: ['Action', 'Sci-Fi'] }
    ];
    
    const sufficientRatingsRecs = await cfEngine.generateRecommendations(sufficientRatings, 5);
    sufficientRatingsRecs.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.title} (${rec.genres.join(', ')}) - Rating: ${rec.predictedRating.toFixed(2)}, Confidence: ${rec.confidence.toFixed(2)}`);
      console.log(`   Explanation: ${rec.explanation}`);
    });

    // Example 4: Search and browse movies
    console.log('\n=== Movie Search Examples ===');
    
    // Search by title
    const searchResults = cfEngine.searchMovies('lord');
    console.log('Search results for "lord":');
    searchResults.forEach(movie => {
      console.log(`- ${movie.title} (${movie.year}) - ${movie.genres.join(', ')} - Rating: ${movie.averageRating}/10`);
    });

    // Get movies by genre
    const actionMovies = cfEngine.getMoviesByGenre('Action').slice(0, 5);
    console.log('\nTop 5 Action movies:');
    actionMovies.forEach(movie => {
      console.log(`- ${movie.title} (${movie.year}) - Rating: ${movie.averageRating}/10`);
    });

    // Get all available genres
    const genres = cfEngine.getGenres();
    console.log('\nAvailable genres:', genres.join(', '));

    // Example 5: Get specific movie information
    console.log('\n=== Movie Information ===');
    const movie = cfEngine.getMovie(1);
    if (movie) {
      console.log(`Movie: ${movie.title} (${movie.year})`);
      console.log(`Genres: ${movie.genres.join(', ')}`);
      console.log(`Average Rating: ${movie.averageRating}/10`);
      console.log(`Rating Count: ${movie.ratingCount.toLocaleString()}`);
    }

  } catch (error) {
    console.error('Error demonstrating collaborative filtering:', error);
  }
}

// Example of how to integrate with a React component
export function useCollaborativeFiltering() {
  const modelManager = new ModelManager();
  const cfEngine = new CollaborativeFilteringEngine(modelManager);

  return {
    engine: cfEngine,
    
    // Helper function to get recommendations for a user
    async getRecommendations(userRatings: MovieRating[], count: number = 10) {
      if (!cfEngine.getModelInfo().isInitialized) {
        await cfEngine.initialize();
      }
      return cfEngine.generateRecommendations(userRatings, count);
    },

    // Helper function to search movies
    searchMovies(query: string) {
      return cfEngine.searchMovies(query);
    },

    // Helper function to get movie by ID
    getMovie(id: number) {
      return cfEngine.getMovie(id);
    },

    // Helper function to get all genres
    getGenres() {
      return cfEngine.getGenres();
    },

    // Helper function to get movies by genre
    getMoviesByGenre(genre: string) {
      return cfEngine.getMoviesByGenre(genre);
    }
  };
}

// Run the demonstration if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  demonstrateCollaborativeFiltering().catch(console.error);
}