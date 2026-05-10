FROM python:3.11-slim-bookworm
# This line fixes the 'High' errors you saw in the logs
RUN apt-get update && apt-get upgrade -y && \
    pip install --no-cache-dir --upgrade pip setuptools wheel && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 5000
CMD ["python", "app/main.py"]