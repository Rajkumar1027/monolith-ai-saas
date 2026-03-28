import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(override=True)

MONGO_URL = os.getenv("MONGO_URL")

ca = certifi.where()
client = MongoClient(MONGO_URL, tlsCAFile=ca, tlsAllowInvalidCertificates=True)

db = client["ai_dashboard"]

collection = db["analysis"]
users_collection = db["users"]
