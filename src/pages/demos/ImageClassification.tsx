import Header from "@/components/Header";
import ImageClassificationDemo from "@/components/demos/ImageClassificationDemo";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const ImageClassificationPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="pt-16">
                <div className="container mx-auto px-4 py-8">
                    {/* Back Navigation */}
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => window.location.href = '/#/showcase'}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Showcase
                        </Button>
                    </div>

                    {/* Page Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow-primary/50">
                                <Camera className="w-8 h-8 text-background" />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                            Image Classification Demo
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Advanced object detection and segmentation using a Detection Transformer (DETR) with a Residual Neural Network as its backbone (ResNet-101)
                        </p>
                    </div>

                    {/* Demo Component */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card border border-border rounded-lg p-6">
                            <ImageClassificationDemo />
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="max-w-4xl mx-auto mt-8">
                        <div className="bg-card border border-border rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Technical Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium mb-2">Model Architecture</h3>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Meta's Detection Transformers (DETR)</li>
                                        <li>• ResNet-101 base for feature extraction</li>
                                        <li>• Zero-shot text-prompted detection</li>
                                        <li>• Predicts set of bounding boxes and category labels for each object of interest</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Features</h3>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Natural language object queries</li>
                                        <li>• Real-time processing</li>
                                        <li>• Multiple object detection</li>
                                        <li>• Bipartite matching</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageClassificationPage;