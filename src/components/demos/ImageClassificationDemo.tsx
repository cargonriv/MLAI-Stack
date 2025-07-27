import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, X } from "lucide-react";

const ImageClassificationDemo = () => {
  const [prediction, setPrediction] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockPredictions = [
    { label: "Cat", confidence: 94.2 },
    { label: "Dog", confidence: 87.5 },
    { label: "Bird", confidence: 76.8 },
    { label: "Car", confidence: 91.3 },
    { label: "House", confidence: 83.7 }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateClassification = () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const randomPrediction = mockPredictions[Math.floor(Math.random() * mockPredictions.length)];
      setPrediction(randomPrediction.label);
      setConfidence(randomPrediction.confidence);
      setIsAnalyzing(false);
    }, 2000);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPrediction("");
    setConfidence(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
        {selectedImage ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img 
                src={selectedImage} 
                alt="Selected for classification" 
                className="max-w-full max-h-48 rounded-lg object-contain"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={clearImage}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Button 
              onClick={simulateClassification}
              disabled={isAnalyzing}
              className="bg-gradient-accent hover:shadow-glow-accent transition-all duration-300"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Classify Image
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image to classify (demo simulation)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-accent hover:shadow-glow-accent transition-all duration-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          </>
        )}
      </div>
      
      {prediction && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-primary">Prediction:</span>
            <span className="text-lg font-bold">{prediction}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <span className="text-sm font-medium">{confidence}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-3">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-1000"
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageClassificationDemo;