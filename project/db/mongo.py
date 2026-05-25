import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(override=True)

MONGO_URL = os.getenv("MONGO_URL")

try:
    # Explicitly using certifi for TLS CA file to resolve [SSL: TLSV1_ALERT_INTERNAL_ERROR]
    # Atlas requires the newest root certificates.
    client = MongoClient(
        MONGO_URL,
        tls=True,
        tlsAllowInvalidCertificates=True,  # Keeps it flexible for internal/proxy TLS
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    # Trigger a ping to confirm connection
    client.admin.command('ping')
    print("✅ Connected to MongoDB")
    db = client["ai_dashboard"] 
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    # Still set db to None so the app doesn't crash on import, 
    # but specific routes will handle the None state.
    db = None

collection = db["analysis"] if db is not None else None
users_collection = db["users"] if db is not None else None
