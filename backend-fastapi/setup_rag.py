#!/usr/bin/env python3
"""
Setup script for RAG backend
"""

import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed!")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} is not compatible. Need Python 3.8+")
        return False

def setup_virtual_environment():
    """Set up virtual environment"""
    if not os.path.exists("venv"):
        return run_command("python -m venv venv", "Creating virtual environment")
    else:
        print("✅ Virtual environment already exists")
        return True

def install_requirements():
    """Install Python requirements"""
    activate_cmd = "source venv/bin/activate" if os.name != 'nt' else "venv\\Scripts\\activate"
    pip_cmd = f"{activate_cmd} && pip install -r requirements.txt"
    return run_command(pip_cmd, "Installing Python requirements")

def check_model_file():
    """Check if the LLM model file exists"""
    model_path = "../public/models-backup/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
    if os.path.exists(model_path):
        print("✅ LLM model file found")
        return True
    else:
        print("⚠️ LLM model file not found")
        print(f"   Expected location: {model_path}")
        print("   Download from: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf")
        return False

def check_embeddings_file():
    """Check if workspace embeddings exist"""
    embeddings_path = "../public/workspace_embeddings.json"
    if os.path.exists(embeddings_path):
        print("✅ Workspace embeddings file found")
        return True
    else:
        print("⚠️ Workspace embeddings file not found")
        print(f"   Expected location: {embeddings_path}")
        print("   Run 'npm run generate:embeddings' from the root directory")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up RAG Backend...\n")
    
    # Check Python version
    if not check_python_version():
        return
    
    # Set up virtual environment
    if not setup_virtual_environment():
        return
    
    # Install requirements
    if not install_requirements():
        return
    
    # Check for required files
    model_exists = check_model_file()
    embeddings_exist = check_embeddings_file()
    
    print("\n📋 Setup Summary:")
    print("✅ Virtual environment created")
    print("✅ Python requirements installed")
    print(f"{'✅' if model_exists else '⚠️'} LLM model {'found' if model_exists else 'missing'}")
    print(f"{'✅' if embeddings_exist else '⚠️'} Embeddings {'found' if embeddings_exist else 'missing'}")
    
    if model_exists and embeddings_exist:
        print("\n🎉 Setup complete! You can now run:")
        print("   python main.py")
        print("   or")
        print("   uvicorn main:app --reload")
    else:
        print("\n⚠️ Setup incomplete. Please download missing files before running the server.")

if __name__ == "__main__":
    main()