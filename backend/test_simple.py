#!/usr/bin/env python3
"""
Test script to verify the simple backend works
"""

def test_model_loading():
    """Test if we can load the model"""
    print("🧪 Testing model loading...")
    
    try:
        from transformers import pipeline
        
        print("📦 Loading DistilBERT model...")
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            return_all_scores=True
        )
        
        print("✅ Model loaded successfully!")
        
        # Test the model
        test_cases = [
            "I love this product!",
            "This is terrible.",
            "It's okay."
        ]
        
        for text in test_cases:
            result = sentiment_pipeline(text)
            best = max(result, key=lambda x: x['score'])
            print(f"   '{text}' -> {best['label']} ({best['score']:.3f})")
        
        print("🎉 Model test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

if __name__ == "__main__":
    test_model_loading()