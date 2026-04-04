import os
import requests
from dotenv import load_dotenv

load_dotenv("c:\\Users\\grajk\\OneDrive\\Desktop\\sentimental_rework\\.env")

api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
req = {"content": {"parts": [{"text": "Check embedding dimension"}]}}
res = requests.post(url, json=req)
print(res.status_code)
if res.ok:
    val = res.json()
    embedding = val.get("embedding", {}).get("values", [])
    print(f"Dimension: {len(embedding)}")
else:
    print(res.text)
