import ollama
import os
ollama_client = ollama.Client(
    host=os.getenv("OLLAMA_HOST")
)

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:12b")

def ask_ai(message: str):

    response = ollama_client.chat(
        model=OLLAMA_MODEL,
        messages=[
            {
                'role': 'user',
                'content': message
            }
        ]
    )

    return response['message']['content']


def stream_ai(message: str, chunk_size: int = 128):
    """
    Simple streaming generator that yields the AI response in chunks.

    Note: This implementation fetches the full response and then yields
    it in slices. Replace with the LLM client's native streaming API
    when available for token-level streaming.
    """

    full = ask_ai(message)
    if not full:
        return

    for i in range(0, len(full), chunk_size):
        yield full[i : i + chunk_size]