#!/bin/bash

# Smoke tests for production deployment

set -e

BASE_URL=${BASE_URL:-"http://localhost"}
API_URL="$BASE_URL/api"

echo "🧪 Running smoke tests against $BASE_URL"

# Test 1: Health check
echo "🔍 Testing health check..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$response" != "200" ]; then
    echo "❌ Health check failed (HTTP $response)"
    exit 1
fi
echo "✅ Health check passed"

# Test 2: Readiness check
echo "🔍 Testing readiness check..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ready")
if [ "$response" != "200" ]; then
    echo "❌ Readiness check failed (HTTP $response)"
    exit 1
fi
echo "✅ Readiness check passed"

# Test 3: Frontend loading
echo "🔍 Testing frontend..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$response" != "200" ]; then
    echo "❌ Frontend test failed (HTTP $response)"
    exit 1
fi
echo "✅ Frontend test passed"

# Test 4: API health check
echo "🔍 Testing API health check..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$response" != "200" ]; then
    echo "❌ API health check failed (HTTP $response)"
    exit 1
fi
echo "✅ API health check passed"

# Test 5: Model info endpoint
echo "🔍 Testing model info endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/model-info")
if [ "$response" != "200" ]; then
    echo "❌ Model info test failed (HTTP $response)"
    exit 1
fi
echo "✅ Model info test passed"

# Test 6: Sentiment analysis endpoint
echo "🔍 Testing sentiment analysis..."
response=$(curl -s -X POST "$API_URL/sentiment" \
    -H "Content-Type: application/json" \
    -d '{"text": "I love this product!"}' \
    -w "%{http_code}" -o /tmp/sentiment_response.json)

if [ "$response" != "200" ]; then
    echo "❌ Sentiment analysis test failed (HTTP $response)"
    if [ -f /tmp/sentiment_response.json ]; then
        echo "Response: $(cat /tmp/sentiment_response.json)"
    fi
    exit 1
fi

# Validate response structure
if ! grep -q '"label"' /tmp/sentiment_response.json || \
   ! grep -q '"confidence"' /tmp/sentiment_response.json || \
   ! grep -q '"scores"' /tmp/sentiment_response.json; then
    echo "❌ Sentiment analysis response structure invalid"
    echo "Response: $(cat /tmp/sentiment_response.json)"
    exit 1
fi

echo "✅ Sentiment analysis test passed"

# Test 7: Performance metrics
echo "🔍 Testing performance metrics..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/performance")
if [ "$response" != "200" ]; then
    echo "❌ Performance metrics test failed (HTTP $response)"
    exit 1
fi
echo "✅ Performance metrics test passed"

# Test 8: Error handling
echo "🔍 Testing error handling..."
response=$(curl -s -X POST "$API_URL/sentiment" \
    -H "Content-Type: application/json" \
    -d '{"text": ""}' \
    -w "%{http_code}" -o /dev/null)

if [ "$response" != "400" ]; then
    echo "❌ Error handling test failed (expected 400, got $response)"
    exit 1
fi
echo "✅ Error handling test passed"

# Cleanup
rm -f /tmp/sentiment_response.json

echo "🎉 All smoke tests passed!"
echo "📊 Test Summary:"
echo "   ✅ Health checks"
echo "   ✅ Frontend loading"
echo "   ✅ API endpoints"
echo "   ✅ Sentiment analysis"
echo "   ✅ Error handling"
echo "   ✅ Performance metrics"