# ML Engineer Portfolio & AI Demo Stack

Welcome to my comprehensive portfolio website featuring an interactive machine learning model collection and professional showcase.

## 🎯 About This Project

This is a full-stack React application that serves as both my personal portfolio and a demonstration platform for various machine learning and AI capabilities. The site showcases my work as a Machine Learning Engineer while providing interactive demos of cutting-edge AI models.

## 🤖 New Architecture: Server-Hosted LLM

The chat functionality has been re-architected to use a powerful, server-hosted Language Model (LLM) powered by a Python FastAPI backend. This replaces the previous implementation that used Transformers.js for client-side inference.

### Key Changes:

- **FastAPI Backend**: A new backend service built with FastAPI hosts a Hugging Face text-generation model (e.g., `mistralai/Mistral-7B-Instruct-v0.2`).
- **GPU-Powered**: The backend is designed for deployment on a GPU server for high-performance inference, with Docker support included.
- **Streaming API**: The backend exposes a `/chat` endpoint with streaming support, allowing for real-time, token-by-token responses in the UI.
- **Decoupled Frontend**: The React frontend now communicates with the FastAPI backend, making it a lightweight and highly scalable client application.

## 🛠️ Development Setup

This project now consists of two main parts: the React frontend and the FastAPI backend.

### 1. Backend Setup (FastAPI + Hugging Face)

The backend runs a Hugging Face model on a Python server. It requires a machine with a GPU for optimal performance.

**Prerequisites:**
- Python 3.10+
- An NVIDIA GPU with CUDA drivers installed.

**Instructions:**

1.  **Navigate to the backend directory:**
    ```bash
    cd backend-fastapi
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure the model:**
    Create a `.env` file in the `backend-fastapi` directory and specify the Hugging Face model you want to use:
    ```
    MODEL_ID="mistralai/Mistral-7B-Instruct-v0.2"
    ```

5.  **Run the backend server:**
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```
    The server will download the model on the first run, which may take some time.

### 2. Frontend Setup (React)

1.  **Navigate to the project root directory:**
    ```bash
    cd /path/to/MLAI-Stack
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` and will connect to the backend running on port 8000.

## 🐳 Docker Deployment (Backend)

The FastAPI backend can be easily deployed as a Docker container, which is the recommended approach for production.

**Prerequisites:**
- Docker
- NVIDIA Container Toolkit (for GPU support)

**Instructions:**

1.  **Navigate to the backend directory:**
    ```bash
    cd backend-fastapi
    ```

2.  **Build the Docker image:**
    ```bash
    docker build -t llm-backend .
    ```

3.  **Run the Docker container with GPU access:**
    ```bash
    docker run --gpus all -p 8000:8000 -v ./huggingface:/app/huggingface llm-backend
    ```
    - `--gpus all` provides the container with access to all available GPUs.
    - `-v ./huggingface:/app/huggingface` mounts a local directory to the container to cache the Hugging Face models, preventing re-downloads on container restarts.

## 🔗 Live Demo

Visit the live application to explore the interactive ML demos and portfolio content.

## 📞 Contact

**Carlos Gonzalez Rivera**
- Email: cargonriv@pm.me
- LinkedIn: [Connect with me](https://linkedin.com/in/carlosriver)
- Portfolio: Live demos and project showcase

---

*This project demonstrates the intersection of machine learning research, software engineering, and user experience design. Each component is built with production-quality standards and serves as both a functional tool and a learning resource.*