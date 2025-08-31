# Quick Production Deployment for cargonriv.com

## 🚀 Step-by-Step Deployment

### 1. Deploy Backend (Choose One Option)

#### Option A: Railway (Recommended - Free & Easy)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend-fastapi
railway login
railway init
railway up

# Note the URL Railway gives you (e.g., https://your-app.railway.app)
```

#### Option B: Render (Alternative)
1. Go to https://render.com
2. Connect your GitHub repo
3. Create "New Web Service"
4. Select `backend-fastapi` folder
5. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`
   - Environment Variables:
     - `CORS_ORIGINS=https://cargonriv.com`

### 2. Update Frontend Configuration

Replace `YOUR_BACKEND_URL` in `.env.production` with your actual backend URL:

```bash
# Edit .env.production
VITE_API_URL=https://your-app.railway.app
# or
VITE_API_URL=https://your-app.onrender.com
```

### 3. Deploy Frontend

```bash
# Run the deployment script
./deploy-production.sh
```

### 4. Configure Domain (if not done already)

In your GitHub repo settings:
1. Go to Settings → Pages
2. Set custom domain to `cargonriv.com`
3. Enable "Enforce HTTPS"

## 🧪 Test Your Deployment

1. Visit https://cargonriv.com
2. Try the chatbot - it should work without CORS errors
3. Check browser console for any remaining errors

## 🔧 Troubleshooting

**If chatbot still shows CORS errors:**
1. Verify your backend URL is correct in `.env.production`
2. Check that your backend is accessible at the URL
3. Ensure CORS_ORIGINS includes `https://cargonriv.com`

**If CSS is missing:**
1. Clear browser cache
2. Check that the build completed successfully
3. Verify files exist in the `dist/` folder

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for specific error messages
2. Test your backend URL directly in a browser
3. Verify the deployment completed without errors

Your site should be fully functional at https://cargonriv.com after following these steps!