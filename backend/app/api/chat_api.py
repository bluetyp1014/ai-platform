from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.ai.chat import stream_ai

router = APIRouter()


@router.post("/chat")
def chat(data: dict):
    """Return a streaming plain-text response (chunked).

    The endpoint yields successive chunks from `stream_ai`.
    """

    def generator():
        for chunk in stream_ai(data.get("message", "")):
            yield chunk

    return StreamingResponse(generator(), media_type="text/plain; charset=utf-8")