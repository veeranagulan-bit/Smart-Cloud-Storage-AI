FROM python:3.12-slim

WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight CPU-only torch first to save RAM and build time on Render
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN grep -v "^torch" requirements.txt | grep -v "^\-\-" > reqs_no_torch.txt && \
    pip install --no-cache-dir -r reqs_no_torch.txt

COPY . .

# Seed database script on container startup if required
EXPOSE 8000

ENV PORT=8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
