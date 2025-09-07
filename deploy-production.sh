#!/bin/bash

# Production deployment script for cargonriv.com

set -e  # Exit on any error

echo "🚀 Deploying to cargonriv.com production environment"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Load production environment variables
if [ -f ".env.production" ]; then
    echo "📋 Loading production environment variables"
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "⚠️ Warning: .env.production not found, using defaults"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
rm -rf node_modules
npm ci

# Generate embeddings (if needed)
echo "🔍 Generating embeddings..."
npm run generate:embeddings

# Build for production
echo "🏗️ Building for production..."
NODE_ENV=production npm run build:prod

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if dist contains the expected files
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: index.html not found in dist/"
    exit 1
fi

echo "📊 Build statistics:"
du -sh dist/
echo "📁 Files in dist/:"
ls -la dist/

# Deploy to GitHub Pages (assuming you're using gh-pages)
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "🎉 Deployment completed successfully!"
echo "🌐 Your site should be available at: https://cargonriv.com"
echo ""
echo "⚠️ Important: Make sure your backend is deployed and accessible at:"
echo "   ${VITE_API_URL:-https://api.cargonriv.com}"