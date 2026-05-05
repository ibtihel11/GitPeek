#Run with: py -3.11 -m uvicorn app:app --reload --port 8000
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import repos, languages, frameworks
from routes import chat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)

app = FastAPI(
    title="GitPeek: GitHub Tech Explorer API",
    description="Analyzes GitHub Archive events enriched with GitHub API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repos.router, prefix="/api/repos", tags=["Repos"])
app.include_router(languages.router, prefix="/api/languages", tags=["Languages"])
app.include_router(frameworks.router, prefix="/api/frameworks", tags=["Frameworks"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"status": "ok", "message": "GitHub Tech Explorer API is running"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}