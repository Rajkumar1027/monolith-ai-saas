import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
print(f"Testing connection to: {MONGO_URL[:20]}...")

try:
    client = MongoClient(
        MONGO_URL,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    client.admin.command('ping')
    print("✅ Connection Successful!")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
