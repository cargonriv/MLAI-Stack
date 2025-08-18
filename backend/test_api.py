#!/usr/bin/env python3
"""
Simple test script for the FastAPI sentiment analysis backend
"""

import requests
import json
import time

def test_api():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing FastAPI Sentiment Analysis Backend")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check passed: {health_data['status']}")
            print(f"   Model loaded: {health_data['model_loaded']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on port 8000.")
        return False
    
    # Test sentiment analysis
    print("\n2. Testing sentiment analysis...")
    test_cases = [
        "I love this product! It's amazing!",
        "This is terrible and I hate it.",
        "The weather is okay today.",
        "Best purchase ever! Highly recommend!",
        "Worst experience of my life."
    ]
    
    for i, text in enumerate(test_cases, 1):
        print(f"\n   Test {i}: '{text[:30]}...'")
        try:
            start_time = time.time()
            response = requests.post(
                f"{base_url}/api/sentiment",
                json={"text": text},
                headers={"Content-Type": "application/json"}
            )
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ {result['label']} ({result['confidence']:.3f}) - {end_time - start_time:.3f}s")
                print(f"      Positive: {result['scores']['positive']:.3f}, Negative: {result['scores']['negative']:.3f}")
            else:
                print(f"   ❌ Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Test model info
    print("\n3. Testing model info endpoint...")
    try:
        response = requests.get(f"{base_url}/api/model-info")
        if response.status_code == 200:
            model_info = response.json()
            print("✅ Model info retrieved:")
            print(f"   Name: {model_info['model_info']['name']}")
            print(f"   Architecture: {model_info['model_info']['architecture']}")
            print(f"   Size: {model_info['model_info']['size']}")
            print(f"   Device: {model_info['model_info']['device']}")
        else:
            print(f"❌ Model info failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Model info error: {e}")
    
    print("\n🎉 Backend testing complete!")
    return True

if __name__ == "__main__":
    test_api()