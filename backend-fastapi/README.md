# FastAPI Backend for Text Generation

This directory contains a FastAPI backend that serves a local Hugging Face model for text generation.

## Setup

1.  **Install Dependencies:** Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Download Model:** Download the GGUF model from [Hugging Face](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf) and place it in the `public/models-backup` directory. Create the directory if it doesn't exist.

    The final path should be `public/models-backup/mistral-7b-instruct-v0.2.Q4_K_M.gguf`.

## Running the Backend

To run the backend server, execute the following command from within this directory:
```bash
uvicorn main:app --reload
```
The server will be available at `http://localhost:8000`.

## Frontend Integration

The main frontend component at `src/components/AdvancedTokenizedChat.tsx` has been updated to use this backend for text generation.
