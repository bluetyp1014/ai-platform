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