# Production Deployment Guide for cargonriv.com

## Overview
This guide covers deploying your ML portfolio website to production with proper backend integration.

## Current Issues Fixed
1. ✅ Hardcoded localhost URLs replaced with environment variables
2. ✅ Production build configuration optimized
3. ✅ Environment-specific configurations created

## Deployment Architecture

```
Frontend (cargonriv.com) → Backend API (api.cargonriv.com)
```

## Step 1: Backend Deployment

Your backend needs to be deployed to a publicly accessible URL. Here are your options:

### Option A: Railway (Recommended - Easy & Free Tier)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
cd backend-fastapi
railway init
railway up
```

### Option B: Render (Free Tier Available)
1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python main.py`
5. Add environment variables:
   - `CORS_ORIGINS=https://cargonriv.com`
   - `HOST=0.0.0.0`
   - `PORT=10000`

### Option C: Heroku
```bash
# Install Heroku CLI and login
heroku create your-app-name
cd backend-fastapi
git subtree push --prefix=backend-fastapi heroku main
```

### Option D: DigitalOcean App Platform
1. Connect GitHub repo
2. Select backend-fastapi folder
3. Configure environment variables

## Step 2: Update Backend CORS Configuration

Once you have your backend URL, update your backend's CORS settings to include your domain:

```python
# In your backend main.py or app.py
CORS_ORIGINS = [
    "https://cargonriv.com",
    "http://localhost:8080",  # Keep for development
]
```

## Step 3: Update Frontend Configuration

Update `.env.production` with your actual backend URL:

```bash
# Replace with your actual backend URL
VITE_API_URL=https://your-backend-url.railway.app
# or
VITE_API_URL=https://your-app.onrender.com
```

## Step 4: Deploy Frontend

Run the production deployment script:

```bash
./deploy-production.sh
```

This will:
1. Build the optimized production bundle
2. Deploy to GitHub Pages
3. Make your site available at cargonriv.com

## Step 5: DNS Configuration

Make sure your domain (cargonriv.com) is properly configured:

1. **GitHub Pages Custom Domain**: 
   - Go to your repo Settings → Pages
   - Set custom domain to `cargonriv.com`
   - Enable "Enforce HTTPS"

2. **DNS Records** (at your domain registrar):
   ```
   Type: CNAME
   Name: www
   Value: yourusername.github.io
   
   Type: A
   Name: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   ```

## Step 6: Test Production Deployment

After deployment, test these endpoints:

1. **Frontend**: https://cargonriv.com
2. **Backend Health**: https://your-backend-url/health
3. **Chatbot Functionality**: Try the chat feature on your site

## Troubleshooting

### CORS Errors
- Ensure your backend includes `https://cargonriv.com` in CORS_ORIGINS
- Check that your backend is accessible from the internet

### 404 Errors on CSS/JS
- Verify the build completed successfully
- Check that `base: "/"` is set correctly in vite.config.ts

### Backend Connection Issues
- Verify VITE_API_URL is set correctly
- Test backend endpoint directly in browser
- Check browser network tab for actual request URLs

## Environment Variables Summary

### Frontend (.env.production)
```bash
VITE_API_URL=https://your-backend-url
VITE_API_TIMEOUT=30000
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### Backend
```bash
CORS_ORIGINS=https://cargonriv.com,http://localhost:8080
HOST=0.0.0.0
PORT=8000  # or platform-specific port
```

## Quick Deploy Commands

```bash
# Deploy frontend only (after backend is set up)
./deploy-production.sh

# Full development setup
npm run dev:full

# Test production build locally
npm run build:prod && npm run preview
```

## Monitoring

After deployment, monitor:
- Frontend loading speed
- Backend response times
- Error rates in browser console
- CORS policy compliance

Your site should now be fully functional at https://cargonriv.com with a working chatbot connected to your deployed backend!