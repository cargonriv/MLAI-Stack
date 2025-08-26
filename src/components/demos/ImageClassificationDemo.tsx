import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, X, Search, AlertCircle, RefreshCw, ZoomIn, Download, Maximize2 } from "lucide-react";
import { GroundedSAMClassifier, loadImageFromFile, GroundedSAMResult } from "@/utils/onnxLCA";
import { useAccessibility } from "@/hooks/use-accessibility";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { useOptimizedAnimation } from "@/hooks/use-optimized-animation";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AsyncState } from "@/components/ui/loading-fallback";
import { useRetry } from "@/hooks/use-retry";
import { useOffline } from "@/hooks/use-offline";

const ImageClassificationDemo = () => {
  const [textPrompt, setTextPrompt] = useState<string>("cat. dog. person. car.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [groundedSAM, setGroundedSAM] = useState<GroundedSAMClassifier | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [results, setResults] = useState<GroundedSAMResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Removed announce to prevent infinite loops
  const { isOnline } = useOffline();
  
  const { retry: retryModelLoad, isRetrying: isRetryingModel, attempt: modelAttempt } = useRetry({
    maxAttempts: 3,
    delay: 2000,
    onRetry: (attempt) => {
      console.log(`Retrying model load, attempt ${attempt + 1}`);
    }
  });

  const { retry: retryAnalysis, isRetrying: isRetryingAnalysis } = useRetry({
    maxAttempts: 2,
    delay: 1000
  });

  // Initialize Grounded SAM model on component mount with retry logic
  useEffect(() => {
    const initializeModel = async () => {
      if (!isOnline) {
        setModelError("Model loading requires internet connection");
        return;
      }

      try {
        setModelError(null);
        console.log("Loading image classification model...");
        
        await retryModelLoad(async () => {
          const classifier = new GroundedSAMClassifier();
          await classifier.initialize();
          setGroundedSAM(classifier);
          setModelLoaded(true);
          console.log("Image classification model loaded successfully");
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to load Grounded SAM models:', error);
        setModelError(errorMessage);
        setModelLoaded(false);
        console.error("Failed to load image classification model");
      }
    };

    initializeModel();

    return () => {
      groundedSAM?.dispose();
    };
  }, []); // Remove dependencies that cause infinite loop

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log("Image file is too large. Please select an image under 10MB");
      return;
    }

    try {
      setSelectedFile(file);
      setAnalysisError(null);
      console.log(`Selected image: ${file.name}`);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        console.log("Image loaded and ready for analysis");
      };
      reader.onerror = () => {
        console.error("Failed to load image file");
        setAnalysisError("Failed to read image file");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file selection:', error);
      console.error("Error processing selected file");
      setAnalysisError("Error processing selected file");
    }
  };

  const analyzeWithGroundedSAM = async () => {
    if (!selectedFile) {
      setAnalysisError("No image selected");
      return;
    }

    if (!textPrompt.trim()) {
      setAnalysisError("Please enter a text prompt");
      return;
    }

    if (!isOnline && !modelLoaded) {
      setAnalysisError("Analysis requires internet connection when models aren't cached");
      return;
    }
    
    console.log('Starting analysis with:', { textPrompt, modelLoaded });
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      await retryAnalysis(async () => {
        if (modelLoaded && groundedSAM) {
          console.log('Loading image from file...');
          const imageElement = await loadImageFromFile(selectedFile);
          console.log('Image loaded, running detection...');
          
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000);
          });
          
          const result = await Promise.race([
            groundedSAM.detectAndSegment(imageElement, textPrompt),
            timeoutPromise
          ]);
          
          console.log('Detection complete:', result);
          setResults(result);
          console.log(`Analysis complete. Found ${result.detections.length} objects.`);
        } else {
          console.log('Models not loaded, using fallback data');
          // Fallback to mock data when models aren't available
          const mockResult = {
            detections: [
              { label: "detected object", confidence: 85, box: [150, 75, 350, 275] }
            ],
            processingTime: 1.2
          };
          setResults(mockResult);
          console.log("Analysis complete using fallback mode");
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      console.error('Analysis error:', error);
      setAnalysisError(errorMessage);
      console.error(`Analysis failed: ${errorMessage}`);
      
      // Only show fallback data if it's a timeout or network error
      if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        setResults({
          detections: [
            { label: "fallback detection", confidence: 75, box: [150, 75, 350, 275] }
          ],
          processingTime: 1.5
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResults(null);
    setAnalysisError(null);
    setShowZoomModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    console.log("Image cleared");
  };

  const saveDetectionImage = () => {
    if (!results?.segmentedImage) return;
    
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = results.segmentedImage;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `detection-result-${timestamp}.png`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Detection image saved as ${filename}`);
    } catch (error) {
      console.error('Failed to save detection image:', error);
      setAnalysisError('Failed to save image. Please try again.');
    }
  };

  const openImageInNewTab = () => {
    if (!results?.segmentedImage) return;
    
    try {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Detection Results - Full Size</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  background: #000; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh;
                }
                img { 
                  max-width: 100%; 
                  max-height: 100vh; 
                  object-fit: contain;
                  border-radius: 8px;
                  box-shadow: 0 4px 20px rgba(255,255,255,0.1);
                }
              </style>
            </head>
            <body>
              <img src="${results.segmentedImage}" alt="Detection Results" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Failed to open image in new tab:', error);
      setAnalysisError('Failed to open image in new tab.');
    }
  };

  const retryModelLoading = () => {
    setModelError(null);
    setModelLoaded(false);
    // Trigger re-initialization
    const initializeModel = async () => {
      try {
        setModelError(null);
        console.log("Retrying model load...");
        
        await retryModelLoad(async () => {
          const classifier = new GroundedSAMClassifier();
          await classifier.initialize();
          setGroundedSAM(classifier);
          setModelLoaded(true);
          console.log("Model loaded successfully");
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setModelError(errorMessage);
        console.error("Model loading failed");
      }
    };
    
    initializeModel();
  };

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('ImageClassificationDemo error:', error);
        console.error("Demo encountered an error");
      }}
    >
      <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2 chrome-scrollbar-fix firefox-enhanced-fix" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--accent-primary)) hsl(var(--background-secondary))'
      }}>
        
        {/* Model Loading Status */}
        <AsyncState
          isLoading={isRetryingModel}
          error={modelError}
          onRetry={retryModelLoading}
          loadingComponent={
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-400">
                  Loading ML models... (Attempt {modelAttempt + 1}/3)
                </span>
              </div>
            </div>
          }
          errorComponent={
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-400 mb-1">Model Loading Failed</h4>
                  <p className="text-xs text-red-300 mb-2">{modelError}</p>
                  <Button
                    onClick={retryModelLoading}
                    size="sm"
                    variant="outline"
                    className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          }
        >
          {modelLoaded && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 sm:p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs sm:text-sm text-green-400">
                  ML models loaded and ready
                </span>
              </div>
            </div>
          )}
        </AsyncState>
      {/* Text Prompt Input - mobile optimized */}
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-medium text-foreground">
          Text Prompt (describe what to detect)
        </label>
        <div className="flex gap-2">
          <Input
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="cat. dog. person. car."
            className="flex-1 text-sm touch-manipulation"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTextPrompt("cat. dog. person. car.")}
            title="Reset to default"
            className="px-2 sm:px-3 touch-manipulation active:scale-95"
          >
            <Search className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Separate objects with periods (e.g., "cat. dog. person.")
        </p>
      </div>

      {/* Image Upload Area - mobile optimized */}
      <div className="border-2 border-dashed border-border/50 rounded-lg p-4 sm:p-6 lg:p-8 text-center hover:border-primary/50 transition-colors touch-manipulation">
        {selectedImage ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="relative inline-block group">
              <ProgressiveImage
                src={results?.segmentedImage || selectedImage}
                alt="Selected for analysis"
                className="max-w-full max-h-48 sm:max-h-56 lg:max-h-64 rounded-lg object-contain cursor-pointer transition-all duration-200 hover:shadow-lg"
                skeletonClassName="max-h-48 sm:max-h-56 lg:max-h-64 rounded-lg"
                onClick={() => results?.segmentedImage && setShowZoomModal(true)}
              />
              
              {/* Image Controls */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {results?.segmentedImage && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowZoomModal(true)}
                      className="h-6 w-6 rounded-full p-0 bg-black/50 border-white/20 hover:bg-black/70 text-white"
                      title="Zoom image"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openImageInNewTab}
                      className="h-6 w-6 rounded-full p-0 bg-black/50 border-white/20 hover:bg-black/70 text-white"
                      title="Open in new tab"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearImage}
                  className="h-6 w-6 rounded-full p-0 bg-black/50 border-white/20 hover:bg-black/70 text-white"
                  title="Clear image"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Zoom hint */}
              {results?.segmentedImage && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Click to zoom
                </div>
              )}
            </div>
            <div className="space-y-2">
              {analysisError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 sm:p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-red-300">{analysisError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => {
                    console.log('Button clicked!', { 
                      isAnalyzing, 
                      textPrompt, 
                      textPromptTrimmed: textPrompt.trim(),
                      disabled: isAnalyzing || !textPrompt.trim(),
                      selectedFile: !!selectedFile,
                      groundedSAM: !!groundedSAM 
                    });
                    analyzeWithGroundedSAM();
                  }}
                  disabled={isAnalyzing || isRetryingAnalysis || !textPrompt.trim()}
                  className="bg-gradient-accent hover:shadow-glow-accent transition-all duration-300 flex-1 sm:flex-none touch-manipulation active:scale-95 text-sm sm:text-base py-2.5 sm:py-3"
                >
                  {isAnalyzing || isRetryingAnalysis ? (
                    <div className="flex items-center">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      <span>{isRetryingAnalysis ? 'Retrying...' : 'Analyzing...'}</span>
                      <div className="ml-2 flex space-x-1">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Detect & Segment
                    </>
                  )}
                </Button>
                
                {/* Save Detection Button - only show when results are available */}
                {results?.segmentedImage && (
                  <Button
                    onClick={saveDetectionImage}
                    variant="outline"
                    className="flex-1 sm:flex-none touch-manipulation active:scale-95 text-sm sm:text-base py-2.5 sm:py-3 border-green-500/20 hover:bg-green-500/10 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Save Result
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
              Upload an image to detect and segment objects
              {modelLoaded ? " (Models ready)" : modelError ? " (Models unavailable)" : " (Loading models...)"}
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
              className="bg-gradient-accent hover:shadow-glow-accent transition-all duration-300 w-full sm:w-auto touch-manipulation active:scale-95 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Upload Image
            </Button>
          </>
        )}
      </div>
      
      {/* Results Display - mobile optimized with progressive loading */}
      {results && (
        <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-500">
          {/* Detection Results */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-primary mb-2 sm:mb-3 text-sm sm:text-base">
              Detected Objects ({results.detections.length})
            </h4>
            {results.detections.length > 0 ? (
              <div className="space-y-2">
                {results.detections.map((detection, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-2 sm:p-3 bg-background/50 rounded animate-in slide-in-from-left duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="font-medium text-sm sm:text-base truncate mr-2">{detection.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {detection.confidence}%
                      </span>
                      <div className="w-12 sm:w-16 bg-secondary rounded-full h-1.5 sm:h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-primary h-1.5 sm:h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${detection.confidence}%`,
                            animationDelay: `${index * 150 + 300}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                No objects matching "{textPrompt}" were detected.
              </p>
            )}
          </div>
          
          {/* Processing Info */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-accent mb-2 sm:mb-3 text-sm sm:text-base">Analysis Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground">Processing Time:</span>
                <div className="font-medium">{results.processingTime.toFixed(2)}s</div>
              </div>
              <div>
                <span className="text-muted-foreground">Model Status:</span>
                <div className="font-medium">{modelLoaded ? "WebGPU" : "Fallback"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Zoom Modal */}
      {showZoomModal && results?.segmentedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoomModal(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 bg-black/50 text-white p-3 flex justify-between items-center z-10">
              <h3 className="text-sm font-medium">Detection Results - Full Size</h3>
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveDetectionImage();
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-black/50 border-white/20 hover:bg-black/70 text-white h-8"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageInNewTab();
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-black/50 border-white/20 hover:bg-black/70 text-white h-8"
                >
                  <Maximize2 className="w-3 h-3 mr-1" />
                  New Tab
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowZoomModal(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-black/50 border-white/20 hover:bg-black/70 text-white h-8"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* Modal Image */}
            <img
              src={results.segmentedImage}
              alt="Detection Results - Full Size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Modal Footer with Detection Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
              <div className="flex justify-between items-center text-sm">
                <span>
                  {results.detections.length} object{results.detections.length !== 1 ? 's' : ''} detected
                </span>
                <span>
                  Processed in {results.processingTime.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default ImageClassificationDemo;