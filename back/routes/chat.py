#GET /api/chat/
import os
import requests
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class ChatRequest(BaseModel):
    message: str

@router.post("/")
def chat(req: ChatRequest):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a programming assistant inside a GitHub Explorer app. "
                    "Explain languages, frameworks, and repositories clearly and briefly."
                ),
            },
            {"role": "user", "content": req.message},
        ],
        "temperature": 0.5,
    }

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        json=payload,
        headers=headers,
    )

    data = response.json()
    reply = data["choices"][0]["message"]["content"]

    return {"reply": reply}