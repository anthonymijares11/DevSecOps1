# Stage 1: Build dependencies
FROM python:3.11-slim-bookworm AS builder
RUN apt-get update && apt-get upgrade -y && \
    pip install --no-cache-dir --upgrade pip setuptools wheel
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Final Runtime Image
FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN useradd -m appuser
WORKDIR /app
COPY --from=builder /install /usr/local
COPY app/ ./app/
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]