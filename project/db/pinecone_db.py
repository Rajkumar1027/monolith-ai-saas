import os
from dotenv import load_dotenv
from pinecone import Pinecone
from project.ai.embedding import get_embedding

# load_dotenv()  # Handled in main.py but good for standalone testing

pc = None
index = None

try:
    api_key = os.getenv("PINECONE_API_KEY")
    
    if not api_key:
        raise ValueError("Missing PINECONE_API_KEY")

    pc = Pinecone(api_key=api_key)
    index = pc.Index("feedback-index")
    print("✅ Pinecone initialized")
except Exception as e:
    print(f"❌ Pinecone failed: {e}")

def store_feedback(id, text):
    if index is None:
        print("Skipping store_feedback: Pinecone not initialized")
        return
    
    embedding = get_embedding(text)
    index.upsert([
        {
            "id": id,
            "values": embedding,
            "metadata": {"text": text}
        }
    ])

def search_feedback(query):
    if index is None:
        print("Skipping search_feedback: Pinecone not initialized")
        return {"matches": []}
        
    query_vector = get_embedding(query)
    results = index.query(
        vector=query_vector,
        top_k=5,
        include_metadata=True
    )
    return results
