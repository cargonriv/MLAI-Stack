import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface GroundedSAMResult {
  detections: Array<{
    label: string;
    confidence: number;
    box: [number, number, number, number]; // [x1, y1, x2, y2]
  }>;
  segmentedImage?: string; // Base64 image with segments
  processingTime: number;
}

export class GroundedSAMClassifier {
  private detector: any = null;
  private segmenter: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      console.log('Loading Grounded SAM models...');

      // Use WASM mode for reliable cross-platform support
      this.detector = await pipeline(
        'object-detection',
        // 'Xenova/detr-resnet-50',
        'Xenova/detr-resnet-101',
        {
          device: 'wasm',
          revision: 'main'
        }
      );

      console.log('Object detection model loaded successfully');

      this.initialized = true;
      console.log('Grounded SAM models loaded successfully (detection only)');
    } catch (error) {
      console.error('Failed to load detection model:', error);
      throw error;
    }
  }

  async detectAndSegment(
    imageElement: HTMLImageElement,
    textPrompt?: string
  ): Promise<GroundedSAMResult> {
    if (!this.initialized) {
      throw new Error('Models not initialized');
    }

    const startTime = performance.now();

    try {
      // Convert image to canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);

      // Get image as data URL for the models
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Run object detection
      console.log('Running object detection...');
      const detectionResults = await this.detector(imageData);

      // Filter detections by text prompt if provided
      let filteredDetections = detectionResults;
      if (textPrompt) {
        const keywords = textPrompt.toLowerCase().split(/[.,\s]+/).filter(k => k.length > 0);
        filteredDetections = detectionResults.filter((detection: any) =>
          keywords.some(keyword => detection.label.toLowerCase().includes(keyword))
        );
      }

      // Convert detection format
      const detections = filteredDetections.map((detection: any) => ({
        label: detection.label,
        confidence: Math.round(detection.score * 100),
        box: [detection.box.xmin, detection.box.ymin, detection.box.xmax, detection.box.ymax]
      }));

      // Create visualization with bounding boxes
      let segmentedImage;
      if (detections.length > 0) {
        console.log('Creating detection visualization...');
        segmentedImage = await this.visualizeSegmentation(canvas, detections, []);
      }

      const processingTime = (performance.now() - startTime) / 1000;

      return {
        detections,
        segmentedImage,
        processingTime
      };
    } catch (error) {
      console.error('Detection/Segmentation error:', error);
      throw error;
    }
  }

  private async visualizeSegmentation(
    canvas: HTMLCanvasElement,
    detections: any[],
    segmentationResults: any[]
  ): Promise<string> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Create overlay canvas
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) throw new Error('Could not get overlay canvas context');

    // Draw original image
    overlayCtx.drawImage(canvas, 0, 0);

    // Draw detection boxes and labels
    overlayCtx.strokeStyle = '#00ff00';
    overlayCtx.lineWidth = 2;
    overlayCtx.font = '16px Arial';
    overlayCtx.fillStyle = '#00ff00';

    detections.forEach((detection, index) => {
      const [x1, y1, x2, y2] = detection.box;

      // Draw bounding box
      overlayCtx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Draw label background
      const label = `${detection.label} (${detection.confidence}%)`;
      const textWidth = overlayCtx.measureText(label).width;
      overlayCtx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      overlayCtx.fillRect(x1, y1 - 20, textWidth + 8, 20);

      // Draw label text
      overlayCtx.fillStyle = '#000';
      overlayCtx.fillText(label, x1 + 4, y1 - 4);
    });

    return overlayCanvas.toDataURL('image/png');
  }

  dispose(): void {
    // Transformers.js handles cleanup automatically
    this.initialized = false;
    this.detector = null;
    this.segmenter = null;
  }
}

export const loadImageFromFile = async (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};