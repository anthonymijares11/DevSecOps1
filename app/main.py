import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "secure", "environment": os.getenv("ENV", "production")}