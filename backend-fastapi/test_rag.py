#!/usr/bin/env python3
"""
Test script for the RAG functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"   - Embedding model loaded: {data['embedding_model_loaded']}")
            print(f"   - LLM loaded: {data['llm_loaded']}")
            print(f"   - Workspace chunks: {data['workspace_chunks']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_search():
    """Test the search endpoint"""
    print("\n🔍 Testing search endpoint...")
    try:
        query = "machine learning models"
        response = requests.get(f"{BASE_URL}/search", params={
            "query": query,
            "max_chunks": 3,
            "threshold": 0.2
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Search successful! Found {data['total_found']} relevant chunks")
            for i, chunk in enumerate(data['relevant_chunks'][:2]):
                print(f"   {i+1}. {chunk['filePath']} (similarity: {chunk['similarity_score']:.3f})")
                print(f"      Content preview: {chunk['content'][:100]}...")
            return True
        else:
            print(f"❌ Search failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Search error: {e}")
        return False

def test_chat_complete():
    """Test the complete chat endpoint"""
    print("\n🔍 Testing complete chat endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/chat-complete", json={
            "prompt": "What machine learning models are used in this portfolio?",
            "use_rag": True,
            "max_context_chunks": 3,
            "similarity_threshold": 0.3
        })
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Chat complete successful!")
            print(f"   - Query: {data['query']}")
            print(f"   - Relevant chunks found: {len(data['relevant_chunks'])}")
            print(f"   - Response preview: {data['response'][:200]}...")
            return True
        else:
            print(f"❌ Chat complete failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat complete error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting RAG API tests...\n")
    
    # Test health first
    if not test_health():
        print("\n❌ Health check failed. Make sure the server is running.")
        return
    
    # Test search functionality
    test_search()
    
    # Test complete chat (only if LLM is available)
    test_chat_complete()
    
    print("\n✅ RAG API tests completed!")

if __name__ == "__main__":
    main()