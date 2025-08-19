# Production Deployment Guide

This document provides comprehensive instructions for deploying the BERT Sentiment Analysis demo in production environments.

## Overview

The deployment consists of:
- **Frontend**: React application served by Nginx
- **Backend**: FastAPI service with BERT model
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **Monitoring**: Health checks, metrics, and alerting

## Prerequisites

### System Requirements
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 2 CPU cores minimum
- 10GB disk space

### Optional (for Kubernetes)
- Kubernetes 1.20+
- kubectl configured
- Helm 3.0+ (optional)

## Environment Configuration

### 1. Frontend Environment Variables

Create `.env.production`:
```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### 2. Backend Environment Variables

Update `backend/.env.example` and create `backend/.env`:
```bash
# Server settings
HOST=0.0.0.0
PORT=8000
WORKERS=2

# Model settings
MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
MAX_TEXT_LENGTH=500
MODEL_CACHE_DIR=/app/models

# CORS settings
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=INFO

# Performance
USE_GPU=false
BATCH_SIZE=1
```

## Deployment Methods

### Method 1: Docker Compose (Recommended for single server)

1. **Build and deploy**:
```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to production
ENVIRONMENT=production ./deploy.sh
```

2. **Verify deployment**:
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Run smoke tests
./scripts/smoke-tests.sh
```

### Method 2: Kubernetes (Recommended for scalable production)

1. **Apply Kubernetes manifests**:
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Configure ingress
kubectl apply -f k8s/ingress.yaml

# Set up monitoring (optional)
kubectl apply -f k8s/monitoring.yaml
```

2. **Verify deployment**:
```bash
# Check pods
kubectl get pods -n mlai-sentiment

# Check services
kubectl get services -n mlai-sentiment

# View logs
kubectl logs -f deployment/mlai-backend -n mlai-sentiment
```

### Method 3: Manual Docker Deployment

1. **Build images**:
```bash
# Build backend
docker build -t mlai-backend:latest ./backend

# Build frontend
docker build -t mlai-frontend:latest -f Dockerfile.frontend .
```

2. **Run containers**:
```bash
# Create network
docker network create mlai-network

# Run backend
docker run -d \
  --name mlai-backend \
  --network mlai-network \
  -p 8000:8000 \
  -e HOST=0.0.0.0 \
  -e PORT=8000 \
  -e WORKERS=2 \
  mlai-backend:latest

# Run frontend
docker run -d \
  --name mlai-frontend \
  --network mlai-network \
  -p 80:80 \
  mlai-frontend:latest
```

## SSL/TLS Configuration

### Using Let's Encrypt with Certbot

1. **Install Certbot**:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain certificate**:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Update nginx configuration** to use SSL (uncomment HTTPS server block in `nginx.conf`)

### Using Custom Certificates

1. **Place certificates**:
```bash
mkdir -p ssl
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

2. **Update docker-compose.yml** to mount SSL directory

## Monitoring and Health Checks

### Health Check Endpoints

- **Basic health**: `GET /health`
- **Detailed health**: `GET /api/health`
- **Readiness**: `GET /ready`
- **Metrics**: `GET /metrics` (Prometheus format)
- **Performance**: `GET /api/performance`

### Monitoring Setup

1. **Prometheus configuration**:
```yaml
scrape_configs:
  - job_name: 'mlai-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

2. **Grafana dashboard**: Import the provided dashboard JSON

3. **Alerting rules**: Use the Kubernetes monitoring configuration

## Performance Optimization

### Backend Optimizations

1. **Worker processes**: Adjust `WORKERS` based on CPU cores
2. **Memory management**: Monitor memory usage and adjust limits
3. **Model caching**: Enabled by default, monitors cache hit rates
4. **GPU acceleration**: Set `USE_GPU=true` if CUDA is available

### Frontend Optimizations

1. **CDN**: Use a CDN for static assets
2. **Compression**: Gzip is enabled in nginx configuration
3. **Caching**: Static assets cached for 1 year
4. **Bundle splitting**: Configured in Vite build

### Database Optimizations (if applicable)

1. **Connection pooling**: Configure appropriate pool sizes
2. **Query optimization**: Monitor slow queries
3. **Indexing**: Ensure proper indexes on frequently queried fields

## Security Considerations

### Network Security

1. **Firewall rules**: Only expose necessary ports (80, 443)
2. **Rate limiting**: Configured in nginx (10 req/s for API)
3. **CORS**: Properly configured for your domain
4. **SSL/TLS**: Use strong ciphers and protocols

### Application Security

1. **Input validation**: All inputs validated on backend
2. **Error handling**: No sensitive information in error messages
3. **Logging**: Comprehensive logging without sensitive data
4. **Updates**: Regular security updates for dependencies

### Container Security

1. **Non-root user**: Containers run as non-root user
2. **Minimal images**: Using slim base images
3. **Security scanning**: Scan images for vulnerabilities
4. **Resource limits**: Proper CPU and memory limits

## Troubleshooting

### Common Issues

1. **Model loading fails**:
   - Check available memory (needs ~2GB)
   - Verify internet connection for model download
   - Check disk space in model cache directory

2. **High response times**:
   - Monitor CPU and memory usage
   - Check if GPU acceleration is available
   - Adjust worker processes

3. **Connection errors**:
   - Verify network connectivity
   - Check firewall rules
   - Validate SSL certificates

### Debugging Commands

```bash
# Check container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check resource usage
docker stats

# Test API endpoints
curl -f http://localhost/health
curl -X POST http://localhost/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this!"}'

# Check nginx configuration
docker-compose exec nginx nginx -t

# Monitor performance
curl http://localhost/api/performance
```

### Log Analysis

Important log patterns to monitor:
- `❌` - Error indicators
- `⏰` - Timeout issues
- `🧪` - Test results
- `📊` - Performance metrics

## Scaling

### Horizontal Scaling

1. **Backend scaling**:
```bash
# Docker Compose
docker-compose up -d --scale backend=3

# Kubernetes
kubectl scale deployment mlai-backend --replicas=3 -n mlai-sentiment
```

2. **Frontend scaling**:
```bash
# Kubernetes
kubectl scale deployment mlai-frontend --replicas=3 -n mlai-sentiment
```

### Vertical Scaling

1. **Increase resources** in docker-compose.yml or Kubernetes manifests
2. **Adjust worker processes** based on available CPU cores
3. **Monitor memory usage** and adjust limits accordingly

## Backup and Recovery

### Data Backup

1. **Model cache**: Backup `/app/models` directory
2. **Logs**: Backup `/app/logs` directory
3. **Configuration**: Backup environment files and configs

### Recovery Procedures

1. **Service recovery**:
```bash
# Restart services
docker-compose restart

# Rebuild if needed
docker-compose up -d --build
```

2. **Data recovery**:
```bash
# Restore model cache
docker cp backup/models mlai-backend:/app/

# Restart to reload models
docker-compose restart backend
```

## Maintenance

### Regular Tasks

1. **Update dependencies**: Monthly security updates
2. **Log rotation**: Configure logrotate for container logs
3. **Certificate renewal**: Automated with Let's Encrypt
4. **Performance monitoring**: Weekly performance reviews
5. **Backup verification**: Monthly backup tests

### Update Procedures

1. **Rolling updates**:
```bash
# Build new images
docker-compose build

# Rolling update
docker-compose up -d --no-deps backend
docker-compose up -d --no-deps frontend
```

2. **Rollback procedures**:
```bash
# Rollback to previous version
docker-compose down
docker-compose up -d
```

## Support and Monitoring

### Key Metrics to Monitor

- **Response time**: < 2 seconds average
- **Error rate**: < 1% of requests
- **Memory usage**: < 80% of allocated
- **CPU usage**: < 70% average
- **Disk usage**: < 80% of available

### Alerting Thresholds

- **Critical**: Service down, error rate > 5%
- **Warning**: Response time > 5s, memory > 90%
- **Info**: High request volume, model cache misses

### Contact Information

For deployment issues:
- Check logs first: `docker-compose logs -f`
- Run smoke tests: `./scripts/smoke-tests.sh`
- Review metrics: `curl http://localhost/api/performance`

## Appendix

### Useful Commands

```bash
# Quick deployment
./deploy.sh

# Health check
curl -f http://localhost/health

# Performance stats
curl http://localhost/api/performance | jq

# Container shell access
docker-compose exec backend bash
docker-compose exec frontend sh

# View real-time logs
docker-compose logs -f --tail=100

# Clean up
docker-compose down --volumes --remove-orphans
docker system prune -a
```

### Configuration Templates

See the following files for configuration templates:
- `.env.example` - Frontend environment variables
- `backend/.env.example` - Backend environment variables
- `docker-compose.yml` - Docker Compose configuration
- `nginx.conf` - Nginx reverse proxy configuration
- `k8s/` - Kubernetes deployment manifests