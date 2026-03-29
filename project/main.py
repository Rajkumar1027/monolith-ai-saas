import os 
from dotenv import load_dotenv
load_dotenv()

import io
import json
import requests
import hashlib
import logging
import sentry_sdk
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from project.ai.hf_ai import analyze_text as generate_answer
from project.db.pinecone_db import store_feedback, search_feedback
from project.db.mongo import collection, users_collection, db
from project.auth import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user
from pydantic import BaseModel
from fastapi.responses import JSONResponse

# --- CONFIGURATION ---
IS_PROD = os.getenv("IS_PROD", "False").lower() == "true"
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Optional: Sentry Setup (Uncomment and add DSN in production)
# sentry_sdk.init(dsn="YOUR_SENTRY_DSN", traces_sample_rate=1.0)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )

def generate_csv_hash(df):
    sample = df.head(10).to_string()
    return hashlib.md5(sample.encode()).hexdigest()


# load_dotenv()  # Handled at top

API_KEY = os.getenv("GEMINI_API_KEY")

def call_ai(prompt):
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        logger.info("Calling Gemini API...")
        response = requests.post(url, json=payload, timeout=20)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        logger.error("Gemini request timed out")
        raise HTTPException(status_code=504, detail="AI service timed out")
    except Exception as e:
        logger.error(f"Gemini error: {str(e)}")
        raise HTTPException(status_code=502, detail="AI service error")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "https://monolith-ai-saas.onrender.com",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    try:
        # Create indexes for performance
        collection.create_index([("owner", 1), ("created_at", -1)])
        users_collection.create_index("username", unique=True)
        logger.info("MongoDB indexes verified/created.")
    except Exception as e:
        logger.warning(f"Failed to create/verify MongoDB indexes: {e}")

@app.on_event("startup")
async def startup_banner():
    print("")
    print("╔══════════════════════════════════════╗")
    print("║     MONOLITH ENGINE — ONLINE ✅       ║")
    print("║  Backend:  http://127.0.0.1:8000     ║")
    print("║  Docs:     http://127.0.0.1:8000/docs║")
    print("║  Health:   /health                   ║")
    print("╚══════════════════════════════════════╝")
    print("")

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

@app.get("/health")
def health():
    mongo_status = "unknown"
    pinecone_status = "unknown"
    
    try:
        from project.db import pinecone_db
        pinecone_status = "ready" if pinecone_db.index else "disabled"
    except Exception as e:
        logger.warning(f"Pinecone health check failed: {e}")
        pinecone_status = "disabled"
    
    try:
        # Check mongo connection via the imported collection
        mongo_status = "connected" if users_collection.database.name else "error"
    except Exception as e:
        logger.warning(f"Mongo health check failed: {e}")
        mongo_status = "error"
    
    return {
        "status": "ok",
        "services": {
            "mongo": mongo_status,
            "pinecone": pinecone_status
        }
    }

@app.get("/")
def home():
    return {"message": "MONOLITH Intelligence Engine Online 🚀"}

@app.post("/register")
async def register(user: dict):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        
        username = user.get("username") or user.get("name")
        email = user.get("email")
        password = user.get("password")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Fix: truncate password to 72 bytes max for bcrypt
        password = password[:72]
        
        # Check if user already exists
        existing = db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = pwd_context.hash(password)
        
        # Save user
        db.users.insert_one({
            "username": username,
            "email": email,
            "password": hashed
        })
        
        print(f"✅ User registered: {email}")
        return {"message": "Registration successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ REGISTRATION_ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login(user: UserLogin, response: Response):
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        logger.warning(f"Failed login attempt for user: {user.username}")
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    # Set HTTP-only cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PROD,
        samesite="Lax" if not IS_PROD else "None"
    )

    logger.info(f"User logged in: {user.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/refresh")
async def refresh(request: Request):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token found")
    
    try:
        from project.auth import JWT_SECRET, ALGORITHM
        import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        new_access_token = create_access_token(data={"sub": username})
        return {"access_token": new_access_token}
    except Exception as e:
        logger.error(f"Refresh failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@app.post("/analyze")
@limiter.limit("5/minute")
async def analyze(request: Request, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # 1. Validation
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:  # 2MB Limit
        raise HTTPException(status_code=400, detail="File too large (Max 2MB)")
    
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        logger.error(f"CSV Parse Error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to parse CSV")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    if len(df) > 500:
        logger.info(f"Trimming CSV from {len(df)} to 500 rows for AI safety.")
        df = df.head(500)

    # 2. AI Caching check
    csv_hash = generate_csv_hash(df)

    owner_email = current_user.get("email", current_user.get("username"))
    
    cached_result = collection.find_one({"owner": owner_email, "csv_hash": csv_hash})
    if cached_result:
        logger.info(f"Returning cached result for {owner_email}")
        cached_result["_id"] = str(cached_result["_id"])
        return cached_result

    # 3. Call AI
    prompt = f"""
    Analyze this customer feedback data:
    {df.head(10).to_string()}

    Return STRICT JSON ONLY format:
    {{
      "urgency_score": number (1-10),
      "topic": "string",
      "summary": "string",
      "issues": ["list of problems"],
      "auto_reply": "string"
    }}
    """

    ai_response = call_ai(prompt)

    try:
        ai_text = ai_response["candidates"][0]["content"]["parts"][0]["text"]
        ai_text = ai_text.replace('```json', '').replace('```', '').strip()
        data = json.loads(ai_text)
    except Exception as e:
        logger.error(f"Gemini output parsing failed: {str(e)}")
        data = {"error": "Invalid AI response", "raw": str(ai_response)}

    document = {
        "owner": owner_email,
        "username": current_user.get("username"),
        "analysis": data,
        "rows": len(df),
        "filename": getattr(file, "filename", "upload.csv"),
        "csv_hash": csv_hash,
        "created_at": pd.Timestamp.now().isoformat()
    }
    collection.insert_one(document)

    if "_id" in document:
        document["_id"] = str(document["_id"])
        
    return document


@app.post("/upload")
async def upload(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    df = pd.read_csv(file.file)

    for i, row in df.iterrows():
        text = str(row[0])  # assuming first column is feedback
        store_feedback(str(i), text)

    return {"message": "Data stored in Pinecone"}

@app.post("/ask")
@limiter.limit("20/minute")
async def ask(request: Request, question: str, current_user: dict = Depends(get_current_user)):
    results = search_feedback(question)

    context = ""
    for r in results['matches']:
        context += r['metadata']['text'] + "\n"

    answer = generate_answer(question, context)

    return {
        "context": context,
        "answer": answer
    }

@app.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    # Only return history for the authenticated user
    email = current_user.get("email", current_user.get("username"))
    data = list(collection.find({"owner": email}, {"_id": 0}))
    old_data = list(collection.find({"username": current_user.get("username"), "owner": {"$exists": False}}, {"_id": 0}))
    return data + old_data
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("project.main:app", host="0.0.0.0", port=port)
