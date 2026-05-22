import os

import ollama

ollama_client = ollama.Client(host=os.getenv("OLLAMA_HOST"))

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:12b")


def ask_ai(messages: list[dict]) -> str:
    response = ollama_client.chat(
        model=OLLAMA_MODEL,
        messages=messages,
    )
    return response["message"]["content"]


def stream_ai(messages: list[dict], chunk_size: int = 128):
    """
    Yield the AI response in chunks.

    Fetches the full response first, then slices for streaming.
    Replace with the LLM client's native streaming when available.
    """
    full = ask_ai(messages)
    if not full:
        return

    for i in range(0, len(full), chunk_size):
        yield full[i : i + chunk_size]
