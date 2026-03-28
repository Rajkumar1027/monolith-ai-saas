import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base"

HEADERS = {
    "Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}"
}

def generate_answer(question, context):
    prompt = f"""
    Based on the following customer feedback:
    {context}

    Answer clearly:
    {question}
    """

    response = requests.post(
        API_URL,
        headers=HEADERS,
        json={"inputs": prompt}
    )

    return response.json()[0]["generated_text"]
