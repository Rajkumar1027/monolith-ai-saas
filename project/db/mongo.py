import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(override=True)

MONGO_URL = os.getenv("MONGO_URL")

try:
    client = MongoClient(
        os.getenv("MONGO_URL"),
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=5000
    )
    # Trigger a ping to confirm connection
    client.admin.command('ping')
    print("✅ MongoDB Connected")
except Exception as e:
    print(f"❌ MongoDB Connection Error: {str(e)}")

db = client["ai_dashboard"]

collection = db["analysis"]
users_collection = db["users"]
