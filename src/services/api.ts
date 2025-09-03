import { supabase } from '@/integrations/supabase/client';

// Use Supabase for authentication instead of custom API
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return {
    token: data.session?.access_token,
    user: data.user,
  };
};

export const register = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return {
    token: data.session?.access_token,
    user: data.user,
  };
};

// Mock data for GitHub Pages deployment (replace with Supabase queries as needed)
const mockMovies = [
  { id: 1, title: "The Shawshank Redemption", genre: "Drama", year: 1994, rating: 9.3 },
  { id: 2, title: "The Godfather", genre: "Crime", year: 1972, rating: 9.2 },
  { id: 3, title: "The Dark Knight", genre: "Action", year: 2008, rating: 9.0 },
  { id: 4, title: "Pulp Fiction", genre: "Crime", year: 1994, rating: 8.9 },
  { id: 5, title: "Forrest Gump", genre: "Drama", year: 1994, rating: 8.8 },
];

export const getMovies = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMovies;
};

export const getRecommendations = async (token: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mock recommendations based on popular movies
  return [
    { id: 6, title: "Inception", genre: "Sci-Fi", year: 2010, rating: 8.8, reason: "Similar to your liked movies" },
    { id: 7, title: "Interstellar", genre: "Sci-Fi", year: 2014, rating: 8.6, reason: "Recommended for you" },
    { id: 8, title: "The Matrix", genre: "Sci-Fi", year: 1999, rating: 8.7, reason: "Popular in your genre" },
  ];
};

export const addRating = async (token: string, movieId: number, rating: number) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a real app, this would save to Supabase
  console.log(`Rating added: Movie ${movieId}, Rating: ${rating}`);
  return { success: true, movieId, rating };
};

export const getProfile = async (token: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Get current user from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  
  // Mock user ratings for demo purposes
  const mockRatings = [
    { movieId: 1, rating: 5 },
    { movieId: 2, rating: 4 },
    { movieId: 3, rating: 5 },
  ];
  
  return {
    id: user?.id || 'demo-user',
    email: user?.email || 'demo@example.com',
    name: user?.user_metadata?.name || 'Demo User',
    ratingsCount: mockRatings.length,
    favoriteGenre: 'Sci-Fi',
    ratings: mockRatings, // Add the ratings property that the component expects
  };
};
