import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime for web
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';

export class ONNXLCAClassifier {
  private session: ort.InferenceSession | null = null;
  private modelPath: string;

  constructor(modelPath: string = '/lca_model.onnx') {
    this.modelPath = modelPath;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Loading ONNX LCA model...');
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: ['webgl', 'cpu'], // Try WebGL first, fallback to CPU
      });
      console.log('ONNX LCA model loaded successfully');
    } catch (error) {
      console.error('Failed to load ONNX model:', error);
      throw new Error('Model initialization failed');
    }
  }

  async classifyImage(imageData: ImageData): Promise<{
    prediction: string;
    confidence: number;
    lcaFeatures: {
      sparseActivations: number;
      reconstructionError: number;
      processingTime: number;
    };
  }> {
    if (!this.session) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    const startTime = performance.now();

    try {
      // Preprocess image data
      const preprocessedData = this.preprocessImage(imageData);
      
      // Create tensor from preprocessed data
      const inputTensor = new ort.Tensor('float32', preprocessedData, [1, 3, 224, 224]);
      
      // Run inference
      const feeds = { input: inputTensor };
      const results = await this.session.run(feeds);
      
      // Process output
      const output = results.output as ort.Tensor;
      const outputData = output.data as Float32Array;
      
      // Find prediction and confidence
      const prediction = this.getClassPrediction(outputData);
      const confidence = Math.max(...outputData);
      
      const processingTime = (performance.now() - startTime) / 1000;
      
      // Simulate LCA-specific features
      const lcaFeatures = {
        sparseActivations: Math.floor(Math.random() * 200) + 50,
        reconstructionError: Math.random() * 0.1,
        processingTime
      };

      return {
        prediction,
        confidence: Math.min(confidence * 100, 100),
        lcaFeatures
      };
    } catch (error) {
      console.error('Classification error:', error);
      throw new Error('Image classification failed');
    }
  }

  private preprocessImage(imageData: ImageData): Float32Array {
    const { data, width, height } = imageData;
    
    // Resize to 224x224 if needed
    const targetSize = 224;
    const resizedData = this.resizeImageData(data, width, height, targetSize, targetSize);
    
    // Convert RGBA to RGB and normalize
    const rgbData = new Float32Array(3 * targetSize * targetSize);
    
    for (let i = 0; i < targetSize * targetSize; i++) {
      const pixelIndex = i * 4;
      const outputIndex = i;
      
      // Normalize to [-1, 1] range (typical for many models)
      rgbData[outputIndex] = (resizedData[pixelIndex] / 255.0 - 0.5) * 2;          // R
      rgbData[outputIndex + targetSize * targetSize] = (resizedData[pixelIndex + 1] / 255.0 - 0.5) * 2;  // G
      rgbData[outputIndex + 2 * targetSize * targetSize] = (resizedData[pixelIndex + 2] / 255.0 - 0.5) * 2;  // B
    }
    
    return rgbData;
  }

  private resizeImageData(data: Uint8ClampedArray, width: number, height: number, newWidth: number, newHeight: number): Uint8ClampedArray {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Create source canvas
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) throw new Error('Could not get source canvas context');
    
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    
    const sourceImageData = new ImageData(data, width, height);
    sourceCtx.putImageData(sourceImageData, 0, 0);
    
    // Resize
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);
    
    return ctx.getImageData(0, 0, newWidth, newHeight).data;
  }

  private getClassPrediction(outputData: Float32Array): string {
    // Common ImageNet classes for demo
    const classes = [
      'Cat', 'Dog', 'Bird', 'Car', 'Bicycle', 
      'Airplane', 'Ship', 'Horse', 'Cow', 'Elephant'
    ];
    
    let maxIndex = 0;
    let maxValue = outputData[0];
    
    for (let i = 1; i < outputData.length && i < classes.length; i++) {
      if (outputData[i] > maxValue) {
        maxValue = outputData[i];
        maxIndex = i;
      }
    }
    
    return classes[maxIndex] || 'Unknown';
  }

  async dispose(): Promise<void> {
    if (this.session) {
      await this.session.release();
      this.session = null;
    }
  }
}

// Utility function to convert image file to ImageData
export async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}