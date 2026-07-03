import os
from collections.abc import Iterator
from typing import Any

import ollama

ollama_client = ollama.Client(host=os.getenv("OLLAMA_HOST"))

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:12b")


def ask_ai(messages: list[dict]) -> str:
    response = ollama_client.chat(
        model=OLLAMA_MODEL,
        messages=messages,
    )
    return response["message"]["content"]


def _extract_chunk_text(chunk: Any) -> str:
    message_obj = getattr(chunk, "message", None)
    content_obj = getattr(message_obj, "content", None)
    if isinstance(content_obj, str):
        return content_obj

    if not isinstance(chunk, dict):
        return ""

    message = chunk.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str):
            return content

    response = chunk.get("response")
    return response if isinstance(response, str) else ""


def stream_ai(messages: list[dict]) -> Iterator[str]:
    """Yield model output as true streaming chunks."""
    stream = ollama_client.chat(
        model=OLLAMA_MODEL,
        messages=messages,
        stream=True,
    )

    for chunk in stream:
        text = _extract_chunk_text(chunk)
        if text:
            yield text
