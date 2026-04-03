import os 
from dotenv import load_dotenv
load_dotenv()

import io
import json
import requests
import hashlib
import logging
import base64
from bs4 import BeautifulSoup
import pandas as pd
from textblob import TextBlob
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
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
    return {"status": "ok"}

@app.get("/")
def home():
    return {"message": "MONOLITH Intelligence Engine Online 🚀"}

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.post("/register")
async def register(request: Request):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        
        try:
            body = await request.json()
        except:
            body = {}
            
        username = (body.get("username") or body.get("name") or body.get("user") or "").strip()
        email = (body.get("email") or body.get("EMAIL") or "").strip()
        password = (body.get("password") or body.get("PASSWORD") or "").strip()
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Consistent 72-byte truncation for bcrypt
        password_bytes = password.encode("utf-8")[:72]
        password_truncated = password_bytes.decode("utf-8", errors="ignore")
        
        existing = db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed = pwd_context.hash(password_truncated)
        user_obj = {
            "username": username,
            "email": email,
            "password": hashed
        }
        db.users.insert_one(user_obj)
        
        # Generate token for immediate auto-login
        access_token = create_access_token(data={"sub": email})
        
        print(f"✅ User registered: {email}")
        return {
            "message": "Registration successful",
            "access_token": access_token,
            "user": {
                "email": email,
                "username": username
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ REGISTRATION_ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login(request: Request):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        
        try:
            body = await request.json()
        except:
            body = {}
        
        email = (body.get("email") or body.get("EMAIL") or body.get("username") or body.get("user") or "").strip()
        password = (body.get("password") or body.get("PASSWORD") or body.get("pass") or "").strip()
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        existing = db.users.find_one({"email": email})
        if not existing:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        # Consistent 72-byte truncation for bcrypt
        password_bytes = password.encode("utf-8")[:72]
        password_truncated = password_bytes.decode("utf-8", errors="ignore")
        
        if not verify_password(password_truncated, existing["password"]):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        access_token = create_access_token(data={"sub": email})
        
        print(f"✅ User logged in: {email}")
        return {
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "email": email,
                "username": existing.get("username", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ LOGIN_ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

# ── Google OAuth 2.0 Callback ──────────────────────────────────────────────────
@app.api_route("/auth/google/callback", methods=["GET", "POST"])
async def google_oauth_callback(request: Request):
    """
    Receives the authorization code from the React frontend,
    exchanges it with Google for tokens, extracts the user's email,
    and returns a MONOLITH JWT access token.
    """
    code = request.query_params.get("code", "")
    if not code:
        try:
            body = await request.json()
            code = (body.get("code") or "").strip()
        except Exception:
            pass

    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is required")

    google_client_id     = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    google_redirect_uri  = os.getenv("GOOGLE_REDIRECT_URI", "https://monolith-ai-saas.onrender.com/auth/google/callback")

    if not google_client_id or not google_client_secret:
        logger.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment")
        raise HTTPException(status_code=500, detail="OAuth not configured on server")

    # Step 1 — Exchange the code for tokens with Google
    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code":          code,
            "client_id":     google_client_id,
            "client_secret": google_client_secret,
            "redirect_uri":  google_redirect_uri,
            "grant_type":    "authorization_code",
        },
        timeout=10,
    )

    if not token_response.ok:
        logger.error(f"Google token exchange failed: {token_response.text}")
        raise HTTPException(status_code=401, detail="Google token exchange failed")

    google_tokens       = token_response.json()
    google_access_token = google_tokens.get("access_token")
    google_refresh_token = google_tokens.get("refresh_token")  # Only present on first auth

    logger.info(
        f"[OAuth] access_token={'YES' if google_access_token else 'NO'} | "
        f"refresh_token={'YES' if google_refresh_token else 'NOT PROVIDED (subsequent login)'}"
    )

    if not google_access_token:
        raise HTTPException(status_code=401, detail="No access token returned by Google")

    # Step 2 — Fetch the user's profile from Google
    profile_response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {google_access_token}"},
        timeout=10,
    )

    if not profile_response.ok:
        logger.error(f"Google profile fetch failed: {profile_response.text}")
        raise HTTPException(status_code=401, detail="Failed to fetch Google profile")

    profile = profile_response.json()
    email   = profile.get("email", "")
    name    = profile.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=401, detail="Could not retrieve email from Google")

    # Step 3 — Upsert user in MongoDB (refresh token vault)
    if db is not None:
        try:
            # Always update the live access token and profile info
            update_data = {
                "email":               email,
                "username":            name,
                "oauth":               "google",
                "google_access_token": google_access_token,
            }

            # CRITICAL: Only persist the refresh token if Google actually sent one.
            # Google only sends it on the VERY FIRST authorization (or after revoking access).
            # If we blindly set it to None on subsequent logins we lose offline access forever.
            if google_refresh_token:
                update_data["google_refresh_token"] = google_refresh_token
                logger.info(f"[OAuth] Refresh token saved for: {email}")
            else:
                logger.info(f"[OAuth] No new refresh token — preserving existing vault for: {email}")

            db.users.update_one(
                {"email": email},
                {"$set": update_data},
                upsert=True,
            )
        except Exception as e:
            logger.warning(f"User upsert failed (non-fatal): {e}")

    # Step 4 — Issue a MONOLITH JWT (same format used by /login)
    access_token = create_access_token(data={"sub": email})

    logger.info(f"✅ Google OAuth success for: {email}")

    # GET = browser redirect from Google → send user back to frontend with token in URL
    # POST = React frontend API call → return JSON directly
    if request.method == "GET":
        from fastapi.responses import RedirectResponse
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}&email={email}"
        return RedirectResponse(url=redirect_url, status_code=302)

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "user": {
            "email":    email,
            "username": name,
        },
    }


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

    # 3. Call AI with improved data sampling (50 random rows for better trends)
    sample_df = df.sample(n=min(len(df), 50), random_state=42)
    prompt = f"""
    Analyze this customer feedback dataset (Sample size: {len(sample_df)} rows):
    {sample_df.to_string()}

    Act as 'MONOLITH Neural Intelligence'. Provide a deep enterprise-grade analysis.
    Return STRICT JSON ONLY format:
    {{
      "urgency_score": number (1-10),
      "topic": "Main high-level theme",
      "summary": "1-2 sentence executive overview",
      "issues": ["list of 3-5 specific problems found in the text"],
      "auto_reply": "A professional, empathetic draft response addressing the main concern"
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
    for r in results.get('matches', []):
        context += r['metadata'].get('text', '') + "\n"

    # Use Gemini for a real RAG experience instead of a local sentiment model
    prompt = f"""
    Act as the MONOLITH Intelligence Assistant. 
    Use the following customer feedback context to answer the user question.
    If the context is empty, politely ask to upload a data file first.
    
    [CONTEXT]
    {context}
    
    [USER QUESTION]
    {question}
    
    Provide a professional, data-driven answer in natural language (Markdown allowed).
    """

    try:
        ai_response = call_ai(prompt)
        answer = ai_response["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        logger.error(f"Assistant Query Error: {e}")
        answer = "I'm having trouble accessing my neural core. Please try again in a moment."

    return {
        "context": context[:500] + "...", # Truncate for frontend bandwidth
        "answer": answer
    }

@app.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    # Only return history for the authenticated user
    email = current_user.get("email", current_user.get("username"))
    data = list(collection.find({"owner": email}, {"_id": 0}))
    old_data = list(collection.find({"username": current_user.get("username"), "owner": {"$exists": False}}, {"_id": 0}))
    return data + old_data

# Helper function to decode and clean Gmail bodies
def extract_clean_text(payload):
    body_data = ""
    # Gmail payloads can be nested in 'parts'
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                body_data = part['body'].get('data', '')
                break  # We prefer plain text!
            elif part['mimeType'] == 'text/html':
                body_data = part['body'].get('data', '')
    else:
        # Sometimes it's right at the top level
        body_data = payload.get('body', {}).get('data', '')

    if not body_data:
        return "No text found."

    try:
        # Decode the Base64URL string
        clean_bytes = base64.urlsafe_b64decode(body_data + '===')
        raw_text = clean_bytes.decode('utf-8')
        
        # Strip away all the nasty HTML tags using BeautifulSoup
        soup = BeautifulSoup(raw_text, 'html.parser')
        clean_text = soup.get_text(separator=' ', strip=True)
        return clean_text
    except Exception as e:
        print("Decoding error:", e)
        return "Failed to decode email."

@app.get("/api/emails/sync")
async def sync_live_emails(user_email: str):
    """
    Pulls the latest 5 emails, deep-decodes the body, and sanitizes the text for AI.
    """
    user = db.users.find_one({"email": user_email})
    if not user or not user.get("google_access_token"):
        raise HTTPException(status_code=401, detail="Google account not connected.")

    access_token = user["google_access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Get the latest 5 message IDs
    gmail_list_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5"
    response = requests.get(gmail_list_url, headers=headers)
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Google token expired.")
        
    messages = response.json().get("messages", [])
    if not messages:
        return {"status": "success", "message": "Inbox is empty.", "emails": []}
    
    email_data = []
    for msg in messages:
        msg_id = msg['id']
        detail_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}"
        detail_res = requests.get(detail_url, headers=headers)
        
        if detail_res.status_code == 200:
            payload = detail_res.json().get("payload", {})
            
            # Extract Headers
            headers_list = payload.get("headers", [])
            subject = next((h["value"] for h in headers_list if h["name"] == "Subject"), "No Subject")
            sender = next((h["value"] for h in headers_list if h["name"] == "From"), "Unknown Sender")
            
            # Run the Deep Sanitization!
            clean_body = extract_clean_text(payload)
            
            # --- TEXTBLOB SENTIMENT PASS ---
            short_text = clean_body[:1500]

            ai_label = "NEUTRAL"
            ai_score = 0.0

            if len(short_text.strip()) > 5:
                try:
                    analysis = TextBlob(short_text)
                    score = analysis.sentiment.polarity
                    if score > 0.1:
                        ai_label = "POSITIVE"
                    elif score < -0.1:
                        ai_label = "NEGATIVE"
                    else:
                        ai_label = "NEUTRAL"
                    ai_score = round(abs(score), 4)
                except Exception as e:
                    print(f"Sentiment engine skipped email due to error: {e}")

            email_data.append({
                "id": msg_id,
                "sender": sender,
                "subject": subject,
                "full_text": clean_body,
                "sentiment": ai_label,
                "confidence": ai_score
            })

    return {
        "status": "success", 
        "count": len(email_data),
        "emails": email_data
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("project.main:app", host="0.0.0.0", port=port)
