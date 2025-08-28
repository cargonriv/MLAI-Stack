import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, RefreshCw, Search, Info, AlertCircle, LogIn, UserPlus, LogOut } from "lucide-react";
import { login, register, getRecommendations, addRating, getProfile, getMovies } from "@/services/api";

const RecommendationDemo = () => {
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const [userRatings, setUserRatings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [availableMovies, setAvailableMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const profile = await getProfile(token);
      setUserRatings(profile.ratings);
      const movies = await getMovies();
      console.log("Movies!", movies)
      setAvailableMovies(movies);
    } catch (error) {
      setError('Failed to fetch user data.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
      setIsAuthenticated(true);
      setAuthError('');
    } catch (error) {
      setAuthError('Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await register(email, password);
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
      setIsAuthenticated(true);
      setAuthError('');
    } catch (error) {
      setAuthError('Registration failed. User may already exist.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken('');
    setIsAuthenticated(false);
    setUserRatings([]);
    setRecommendations([]);
    setEmail('');
    setPassword('');
  };

  const handleAddRating = async (movieId, rating) => {
    try {
      await addRating(token, movieId, rating);
      // Refresh ratings
      const profile = await getProfile(token);
      setUserRatings(profile.ratings);
    } catch (error) {
      setError('Failed to add rating.');
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const recs = await getRecommendations(token);
      setRecommendations(recs);
    } catch (error) {
      setError('Failed to get recommendations.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilteredMovies = () => {
    if (!searchQuery) return availableMovies.slice(0, 20);
    return availableMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 20);
  };

  const getRatingForMovie = (movieId) => {
    return userRatings.find(r => r.movieId === movieId)?.rating || 0;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{isRegister ? 'Register' : 'Login'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-secondary/30 border border-border/50 rounded-lg"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-secondary/30 border border-border/50 rounded-lg"
                required
              />
              {authError && <p className="text-red-500 text-sm">{authError}</p>}
              <Button type="submit" className="w-full">
                {isRegister ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                {isRegister ? 'Register' : 'Login'}
              </Button>
            </form>
            <Button variant="link" onClick={() => setIsRegister(!isRegister)} className="w-full mt-4">
              {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">Rate Movies ({userRatings.length} rated)</h4>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-secondary/30 border border-border/50 rounded-lg"
          />
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {getFilteredMovies().map((movie) => {
            const userRating = getRatingForMovie(movie.id);
            return (
              <div key={movie.id} className="bg-secondary/20 rounded-lg p-3 border border-border/30">
                <h5 className="font-medium text-sm truncate">{movie.title}</h5>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} onClick={() => handleAddRating(movie.id, rating)}>
                      <Star className={`w-4 h-4 ${rating <= userRating ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {userRatings.length > 0 && (
        <Button onClick={handleGenerateRecommendations} disabled={isGenerating} className="w-full">
          {isGenerating ? 'Generating...' : 'Get Recommendations'}
        </Button>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-primary">Recommendations for You</h4>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <Card key={rec.movieId} className="bg-secondary/30">
                <CardContent className="p-3">
                  <h5 className="font-medium text-sm">{rec.title}</h5>
                  <p className="text-xs text-muted-foreground italic">{rec.explanation}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span>{rec.predictedRating.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationDemo;
