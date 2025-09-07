#!/bin/bash

# Deploy backend to Railway with production configuration

set -e

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Get the deployment URL
echo "🌐 Getting deployment URL..."
RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -n "$RAILWAY_URL" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Backend URL: $RAILWAY_URL"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your .env.production file with:"
    echo "   VITE_API_URL=$RAILWAY_URL"
    echo "2. Deploy your frontend with: ./deploy-production.sh"
else
    echo "⚠️ Could not retrieve Railway URL. Check Railway dashboard for deployment status."
fi

echo "✅ Backend deployment complete!"