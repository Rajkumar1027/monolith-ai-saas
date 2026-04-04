import os
import requests
import json

def get_embedding(text: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Missing GEMINI_API_KEY for embedding.")
        return [0.0] * 768

    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
    payload = {
        "content": {"parts": [{"text": text[:5000]}]} # Cap length to avoid token limits
    }
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("embedding", {}).get("values", [0.0] * 768)
        else:
            print(f"Embedding failed: {response.status_code} - {response.text}")
            return [0.0] * 768
    except Exception as e:
        print(f"Embedding error: {e}")
        return [0.0] * 768