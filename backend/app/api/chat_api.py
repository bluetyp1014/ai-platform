from fastapi import APIRouter
from app.ai.chat import ask_ai

router = APIRouter()

@router.post("/chat")
def chat(data: dict):

    result = ask_ai(data["message"])

    return {
        "response": result
    }