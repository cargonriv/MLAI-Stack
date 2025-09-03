import os
import json
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import jwt
import hashlib
from datetime import datetime, timedelta

app = FastAPI(title="ML Portfolio API", version="1.0.0")

# Add CORS middleware
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080,https://cargonriv.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret-key")

# Simple in-memory user storage (for demo purposes)
users_db = {}

class AuthRequest(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

class AuthResponse(BaseModel):
    token: str

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

def create_jwt_token(email: str) -> str:
    """Create JWT token"""
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> str:
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["email"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    email = verify_jwt_token(credentials.credentials)
    if email not in users_db:
        raise HTTPException(status_code=401, detail="User not found")
    return email

@app.get("/")
async def root():
    return {"message": "ML Portfolio API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0"
    }

@app.post("/api/auth/register", response_model=AuthResponse)
async def register(auth_request: AuthRequest):
    """Register a new user"""
    if auth_request.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Store user (in production, use a real database)
    users_db[auth_request.email] = {
        "email": auth_request.email,
        "password": hash_password(auth_request.password),
        "username": auth_request.username or auth_request.email.split("@")[0]
    }
    
    token = create_jwt_token(auth_request.email)
    return AuthResponse(token=token)

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(auth_request: AuthRequest):
    """Login user"""
    if auth_request.email not in users_db:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    user = users_db[auth_request.email]
    if not verify_password(auth_request.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    token = create_jwt_token(auth_request.email)
    return AuthResponse(token=token)

# Mock endpoints for the recommendation system
@app.get("/api/recommendations")
async def get_recommendations(current_user: str = Depends(get_current_user)):
    """Mock recommendations endpoint"""
    return [
        {"id": 1, "title": "The Matrix", "rating": 4.5, "reason": "Based on your sci-fi preferences"},
        {"id": 2, "title": "Inception", "rating": 4.3, "reason": "Complex narrative structure"},
        {"id": 3, "title": "Blade Runner 2049", "rating": 4.2, "reason": "Visually stunning sci-fi"}
    ]

@app.post("/api/user/rating")
async def add_rating(rating_data: dict, current_user: str = Depends(get_current_user)):
    """Mock add rating endpoint"""
    return {"message": "Rating added successfully"}

@app.get("/api/user/profile")
async def get_profile(current_user: str = Depends(get_current_user)):
    """Get user profile"""
    user = users_db[current_user]
    return {
        "email": user["email"],
        "username": user["username"]
    }

@app.get("/api/movies")
async def get_movies():
    """Mock movies endpoint"""
    return [
        {"id": 1, "title": "The Matrix", "genre": "Sci-Fi"},
        {"id": 2, "title": "Inception", "genre": "Sci-Fi"},
        {"id": 3, "title": "The Godfather", "genre": "Drama"},
        {"id": 4, "title": "Pulp Fiction", "genre": "Crime"},
        {"id": 5, "title": "The Dark Knight", "genre": "Action"}
    ]

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)