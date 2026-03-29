import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(override=True)

MONGO_URL = os.getenv("MONGO_URL")

try:
    client = MongoClient(
        MONGO_URL,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    # Trigger a ping to confirm connection
    client.admin.command('ping')
    print("✅ Connected to MongoDB")
    db = client["ai_dashboard"] # Use clear database name
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    db = None

collection = db["analysis"] if db is not None else None
users_collection = db["users"] if db is not None else None
