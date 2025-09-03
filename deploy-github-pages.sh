#!/bin/bash

# GitHub Pages deployment script
# This script builds the project for static hosting and deploys to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting GitHub Pages deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build for production
echo "🏗️ Building for production..."
NODE_ENV=production npm run build:prod

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "🎉 Deployment completed!"
echo "📊 Your site should be available at: https://cargonriv.github.io/MLAI-Stack/"
echo "⏳ Note: It may take a few minutes for changes to appear"