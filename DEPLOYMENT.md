# Deployment Guide

This guide covers deploying the ML Portfolio with FastAPI backend to production.

## Architecture Overview

```
Frontend (React/Vite) → Reverse Proxy → FastAPI Backend
                     ↓
                Static Files
```

## Frontend Deployment

### Option 1: GitHub Pages (Current)
```bash
npm run build
npm run deploy
```

### Option 2: Vercel
```bash
npm install -g vercel
vercel --prod
```

### Option 3: Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## Backend Deployment

### Option 1: Railway
1. Create account at railway.app
2. Connect GitHub repository
3. Add environment variables:
   ```
   PORT=8000
   CORS_ORIGINS=https://yourdomain.com
   ```
4. Deploy from `backend/` directory

### Option 2: Render
1. Create account at render.com
2. Create new Web Service
3. Connect repository, set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`
   - Environment: Python 3.9+

### Option 3: DigitalOcean App Platform
1. Create account at digitalocean.com
2. Create new App
3. Connect repository
4. Configure:
   ```yaml
   name: ml-portfolio-backend
   services:
   - name: api
     source_dir: /backend
     github:
       repo: your-username/MLAI-Stack
       branch: main
     run_command: python main.py
     environment_slug: python
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: PORT
       value: "8000"
     - key: CORS_ORIGINS
       value: "https://yourdomain.com"
   ```

### Option 4: Docker Deployment
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
```

```bash
# Build and run
docker build -t ml-portfolio-backend ./backend
docker run -p 8000:8000 ml-portfolio-backend
```

## Production Configuration

### Frontend (vite.config.ts)
```typescript
// Update proxy for production
server: {
  proxy: {
    '/api': {
      target: 'https://your-backend-domain.com',
      changeOrigin: true,
      secure: true,
    },
  },
},
```

### Backend Environment Variables
```bash
# Production settings
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=https://yourdomain.com
LOG_LEVEL=INFO
MODEL_CACHE_DIR=/app/models
```

## SSL/HTTPS Setup

### Using Nginx (Reverse Proxy)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring & Health Checks

### Health Check Endpoint
```bash
curl https://your-backend-domain.com/api/health
```

### Performance Monitoring
- Use `/api/model-info` for model metrics
- Monitor response times and error rates
- Set up alerts for service downtime

## Scaling Considerations

### Backend Scaling
- Use multiple workers: `uvicorn main:app --workers 4`
- Consider GPU instances for faster inference
- Implement model caching and request queuing

### Frontend Scaling
- Use CDN for static assets
- Enable gzip compression
- Implement service worker for offline support

## Security Best Practices

1. **CORS Configuration**: Restrict origins to your domain
2. **Rate Limiting**: Implement request rate limiting
3. **Input Validation**: Sanitize all user inputs
4. **HTTPS Only**: Force SSL/TLS encryption
5. **Environment Variables**: Never commit secrets to git

## Cost Optimization

### Free Tier Options
- **Frontend**: GitHub Pages, Netlify, Vercel
- **Backend**: Railway (500 hours/month), Render (750 hours/month)

### Paid Options
- **DigitalOcean**: $5/month droplet
- **AWS**: EC2 t3.micro with ELB
- **Google Cloud**: Cloud Run with auto-scaling

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check CORS_ORIGINS environment variable
2. **Model Loading**: Ensure sufficient memory (>1GB)
3. **Slow Responses**: Consider GPU instances or model quantization
4. **Connection Refused**: Verify backend is running and accessible

### Debug Commands
```bash
# Check backend logs
docker logs container-name

# Test API directly
curl -X POST "https://your-backend.com/api/sentiment" \
     -H "Content-Type: application/json" \
     -d '{"text": "test"}'

# Check frontend build
npm run build && npm run preview
```