#!/bin/bash

# Production deployment script for MLAI Stack Sentiment Demo

set -e  # Exit on any error

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
IMAGE_TAG=${IMAGE_TAG:-"latest"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command_exists docker; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "📋 Loading environment variables from .env.${ENVIRONMENT}"
    export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
fi

# Build images
echo "🏗️ Building Docker images..."
docker-compose build --no-cache

# Tag images if registry is specified
if [ -n "$DOCKER_REGISTRY" ]; then
    echo "🏷️ Tagging images for registry: $DOCKER_REGISTRY"
    docker tag mlai-frontend:latest $DOCKER_REGISTRY/mlai-frontend:$IMAGE_TAG
    docker tag mlai-backend:latest $DOCKER_REGISTRY/mlai-backend:$IMAGE_TAG
    
    echo "📤 Pushing images to registry..."
    docker push $DOCKER_REGISTRY/mlai-frontend:$IMAGE_TAG
    docker push $DOCKER_REGISTRY/mlai-backend:$IMAGE_TAG
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Start services
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Starting production services..."
    docker-compose --profile production up -d
else
    echo "🚀 Starting development services..."
    docker-compose up -d
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=300  # 5 minutes
elapsed=0
interval=10

while [ $elapsed -lt $timeout ]; do
    if curl -f http://localhost/health >/dev/null 2>&1; then
        echo "✅ Backend health check passed"
        break
    fi
    
    echo "⏳ Waiting for backend to be healthy... (${elapsed}s/${timeout}s)"
    sleep $interval
    elapsed=$((elapsed + interval))
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Backend health check failed after ${timeout}s"
    echo "📋 Container logs:"
    docker-compose logs --tail=50
    exit 1
fi

# Test frontend
if curl -f http://localhost/ >/dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

# Run smoke tests
echo "🧪 Running smoke tests..."
if [ -f "scripts/smoke-tests.sh" ]; then
    bash scripts/smoke-tests.sh
else
    echo "⚠️ No smoke tests found, skipping..."
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Service URLs:"
echo "   Frontend: http://localhost/"
echo "   Backend API: http://localhost/api/"
echo "   Health Check: http://localhost/health"
echo "   Metrics: http://localhost/metrics (internal only)"

# Show running containers
echo "📋 Running containers:"
docker-compose ps