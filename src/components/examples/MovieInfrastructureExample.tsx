/**
 * Example component demonstrating movie infrastructure usage
 * Shows how to integrate movie database and rating system
 */

import React, { useState } from 'react';
import { useMovieInfrastructure } from '@/hooks/useMovieInfrastructure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Search, Heart, TrendingUp } from 'lucide-react';

export function MovieInfrastructureExample() {
  const {
    status,
    isLoading,
    error,
    searchMovies,
    getMovie,
    getAllGenres,
    addRating,
    getRating,
    getUserProfile,
    getGenrePreferences,
    getGenreBasedRecommendations
  } = useMovieInfrastructure();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Handle search
  const handleSearch = () => {
    const filters: any = {};
    if (searchTerm) filters.searchTerm = searchTerm;
    if (selectedGenres.length > 0) filters.genres = selectedGenres;
    
    const results = searchMovies(filters);
    setSearchResults(results);
  };

  // Handle rating
  const handleRating = (movieId: number, rating: number) => {
    const movie = getMovie(movieId);
    if (movie) {
      addRating(movieId, rating, movie);
      
      // Update recommendations based on new preferences
      const preferences = getGenrePreferences();
      const newRecommendations = getGenreBasedRecommendations(preferences, 5);
      setRecommendations(newRecommendations);
    }
  };

  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Render star rating
  const renderStarRating = (movieId: number, currentRating?: number) => {
    const userRating = getRating(movieId);
    const rating = userRating?.rating || 0;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRating(movieId, star)}
            className={`p-1 rounded ${
              star <= rating 
                ? 'text-yellow-500' 
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          >
            <Star size={16} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
        {userRating && (
          <span className="text-sm text-gray-600 ml-2">
            {userRating.rating}/5
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading movie infrastructure...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  const userProfile = getUserProfile();
  const allGenres = getAllGenres();

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Movie Infrastructure Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{status.totalMovies}</div>
              <div className="text-sm text-gray-600">Movies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.totalRatings}</div>
              <div className="text-sm text-gray-600">Your Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{userProfile.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{allGenres.length}</div>
              <div className="text-sm text-gray-600">Genres</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Movies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          
          {/* Genre filters */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Filter by genres:</div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map(genre => (
                <Badge
                  key={genre}
                  variant={selectedGenres.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.map(movie => (
                <div key={movie.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{movie.title}</h3>
                      <p className="text-sm text-gray-600">{movie.year} • {movie.director}</p>
                      <p className="text-sm mt-1">{movie.plot}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genres.map((genre: string) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm text-gray-600">
                        ⭐ {movie.averageRating}/10
                      </div>
                      <div className="mt-2">
                        {renderStarRating(movie.id)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Recommended for You
            </CardTitle>
            <CardDescription>
              Based on your ratings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {recommendations.map(movie => (
                <div key={movie.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{movie.title}</h3>
                      <p className="text-sm text-gray-600">{movie.year} • {movie.director}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genres.map((genre: string) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm text-gray-600">
                        ⭐ {movie.averageRating}/10
                      </div>
                      <div className="mt-2">
                        {renderStarRating(movie.id)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Profile */}
      {userProfile.totalRatings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Genre Preferences:</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(getGenrePreferences())
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([genre, score]) => (
                      <Badge key={genre} variant="outline">
                        {genre} ({Math.round(score * 100)}%)
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}