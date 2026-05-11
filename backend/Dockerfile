# ── MindCare AI Backend ──────────────────────────────────────────────────────
# Lightweight Python 3.10 base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system-level dependencies required by librosa / soundfile / opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (leverages Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code
COPY . .

# Ensure the Pre-trained_Models directory exists at runtime
RUN mkdir -p /app/Pre-trained_Models

# Ensure the uploads directory exists at runtime
RUN mkdir -p /app/uploads

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# Start the FastAPI app with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
