import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, RefreshCw } from "lucide-react";

const RecommendationDemo = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{title: string, rating: number, genre: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const genres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Documentary'];
  
  const mockMovies = {
    'Action': [
      { title: 'Quantum Strike', rating: 8.7, genre: 'Action' },
      { title: 'Steel Guardian', rating: 8.2, genre: 'Action' },
      { title: 'Lightning Force', rating: 7.9, genre: 'Action' }
    ],
    'Comedy': [
      { title: 'Laughing Matters', rating: 8.5, genre: 'Comedy' },
      { title: 'Comic Relief', rating: 8.0, genre: 'Comedy' },
      { title: 'Funny Business', rating: 7.8, genre: 'Comedy' }
    ],
    'Sci-Fi': [
      { title: 'Cosmic Journey', rating: 9.1, genre: 'Sci-Fi' },
      { title: 'Neural Network', rating: 8.8, genre: 'Sci-Fi' },
      { title: 'Time Paradox', rating: 8.4, genre: 'Sci-Fi' }
    ],
    'Drama': [
      { title: 'Deep Waters', rating: 8.9, genre: 'Drama' },
      { title: 'Silent Voices', rating: 8.3, genre: 'Drama' },
      { title: 'Breaking Point', rating: 8.1, genre: 'Drama' }
    ]
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const generateRecommendations = () => {
    if (selectedGenres.length === 0) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const recs = selectedGenres.flatMap(genre => {
        const movies = mockMovies[genre as keyof typeof mockMovies] || [];
        return movies.slice(0, 2); // Get top 2 from each selected genre
      });
      
      setRecommendations(recs.sort((a, b) => b.rating - a.rating).slice(0, 4));
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-3">Select your favorite genres:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {genres.map(genre => (
            <Badge
              key={genre}
              variant={selectedGenres.includes(genre) ? "default" : "secondary"}
              className={`cursor-pointer transition-all ${
                selectedGenres.includes(genre) 
                  ? 'bg-gradient-primary shadow-glow-primary/50' 
                  : 'hover:bg-primary/20'
              }`}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
        
        <Button 
          onClick={generateRecommendations}
          disabled={selectedGenres.length === 0 || isGenerating}
          className="w-full bg-gradient-accent hover:shadow-glow-accent transition-all duration-300"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Get Recommendations
            </>
          )}
        </Button>
      </div>
      
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-primary">Recommended for you:</h4>
          {recommendations.map((movie, index) => (
            <div key={index} className="bg-secondary/30 rounded-lg p-3 border border-border/50">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-medium">{movie.title}</h5>
                  <p className="text-sm text-muted-foreground">{movie.genre}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{movie.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationDemo;