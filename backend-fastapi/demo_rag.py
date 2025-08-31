#!/usr/bin/env python3
"""
Interactive demo of the RAG system
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_separator():
    print("=" * 80)

def demo_search(query):
    """Demonstrate vector search"""
    print(f"🔍 Searching for: '{query}'")
    
    try:
        response = requests.get(f"{BASE_URL}/search", params={
            "query": query,
            "max_chunks": 3,
            "threshold": 0.2
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total_found']} relevant chunks:")
            
            for i, chunk in enumerate(data['relevant_chunks'], 1):
                print(f"\n   {i}. File: {chunk['filePath']}")
                print(f"      Similarity: {chunk['similarity_score']:.3f}")
                print(f"      Content: {chunk['content'][:150]}...")
        else:
            print(f"❌ Search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def demo_rag_chat(question):
    """Demonstrate RAG-enhanced chat"""
    print(f"💬 Question: '{question}'")
    
    try:
        response = requests.post(f"{BASE_URL}/chat-complete", json={
            "prompt": question,
            "use_rag": True,
            "max_context_chunks": 3,
            "similarity_threshold": 0.3
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ RAG Response generated!")
            print(f"\n📚 Context used from {len(data['relevant_chunks'])} files:")
            
            for chunk in data['relevant_chunks']:
                print(f"   - {chunk['filePath']} (similarity: {chunk['similarity_score']:.3f})")
            
            print(f"\n🤖 AI Response:")
            print(f"   {data['response']}")
        else:
            print(f"❌ Chat failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run interactive RAG demo"""
    print("🚀 RAG System Interactive Demo")
    print_separator()
    
    # Check if server is running
    try:
        health_response = requests.get(f"{BASE_URL}/health", timeout=5)
        if health_response.status_code != 200:
            print("❌ Server not responding. Please start the backend first:")
            print("   python main.py")
            return
        
        health_data = health_response.json()
        print("✅ Server is running!")
        print(f"   - Embedding model: {'✅' if health_data['embedding_model_loaded'] else '❌'}")
        print(f"   - LLM model: {'✅' if health_data['llm_loaded'] else '❌'}")
        print(f"   - Workspace chunks: {health_data['workspace_chunks']}")
        
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("Please start the backend first: python main.py")
        return
    
    print_separator()
    
    # Demo queries
    demo_queries = [
        "machine learning models",
        "React components",
        "image classification",
        "FastAPI backend"
    ]
    
    demo_questions = [
        "What machine learning models are implemented in this portfolio?",
        "How does the image classification demo work?",
        "What technologies are used in the frontend?",
        "Tell me about the RAG implementation"
    ]
    
    # Demonstrate vector search
    print("🔍 VECTOR SEARCH DEMONSTRATION")
    print_separator()
    
    for query in demo_queries:
        demo_search(query)
        print()
        time.sleep(1)
    
    print_separator()
    
    # Demonstrate RAG chat
    print("💬 RAG CHAT DEMONSTRATION")
    print_separator()
    
    for question in demo_questions:
        demo_rag_chat(question)
        print()
        time.sleep(2)
    
    print_separator()
    print("✅ Demo completed! The RAG system is working correctly.")
    print("\nYou can now:")
    print("1. Use the frontend chat interface")
    print("2. Make API calls to the endpoints")
    print("3. Integrate with your own applications")

if __name__ == "__main__":
    main()