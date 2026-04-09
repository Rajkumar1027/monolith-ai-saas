import os
import nltk
# Force download of required NLP data for TextBlob
for res in ['punkt', 'averaged_perceptron_tagger', 'brown', 'punkt_tab']:
    try:
        nltk.data.find(f'tokenizers/{res}')
    except LookupError:
        nltk.download(res)
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
        if collection is not None:
            collection.create_index([("owner", 1), ("created_at", -1)])
            logger.info("MongoDB 'analysis' indexes verified/created.")
        else:
            logger.error("CRITICAL: MongoDB 'analysis' collection not available. Indices not created.")

        if users_collection is not None:
            users_collection.create_index("username", unique=True)
            logger.info("MongoDB 'users' indexes verified/created.")
        else:
            logger.error("CRITICAL: MongoDB 'users' collection not available. Indices not created.")

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
        
        print(f"🔍 Login attempt: {email}")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        existing = db.users.find_one({"email": email})
        if not existing:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Consistent 72-byte truncation for bcrypt
        password_bytes = password.encode("utf-8")[:72]
        password_truncated = password_bytes.decode("utf-8", errors="ignore")
        
        if not verify_password(password_truncated, existing["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate proper JWT tokens (sub = email to match get_current_user)
        access_token = create_access_token(data={"sub": email})
        refresh_token_str = create_refresh_token(data={"sub": email})
        
        print(f"✅ Login successful: {email}")
        
        # Return access token in body and refresh token as HTTP-only cookie
        response = JSONResponse(content={
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "email": email,
                "username": existing.get("username", "")
            }
        })
        response.set_cookie(
            key="refresh_token",
            value=refresh_token_str,
            httponly=True,
            secure=False,   # Set to True in production (HTTPS)
            samesite="lax",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        return response
        
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


class SynthesisRequest(BaseModel):
    prompt: str
    context_summary: str = "" 

@app.post("/api/feedback/ask")
async def ask_monolith(request: SynthesisRequest):
    try:
        system_prompt = f"""
        You are an AI Customer Feedback Intelligence Engine — an elite data analysis system.
        The user is asking a question about their recently uploaded feedback data.
        Context of their data: {request.context_summary}

        User Question: {request.prompt}

        Analyze the full context and provide a comprehensive, data-driven intelligence report.
        Calculate or estimate the percentage split of Positive, Negative, and Neutral sentiments.
        Return ONLY a valid JSON object. No markdown. No extra text. Strictly this structure:
        {{
          "summary": "A high-level paragraph starting with calculated percentages (e.g. 'The overall sentiment shows a 53% positive and 47% negative split...').",
          "positive_insights": ["What customers appreciate most", "Key areas of strength"],
          "critical_issues": ["Urgent or repeated complaints", "High-risk areas requiring immediate attention"],
          "neutral_observations": ["Stable areas or patterns with unclear direction"],
          "actionable_suggestions": ["How to fix or improve negative feedback", "How to scale positive trends"]
        }}
        """

        ai_response = call_ai(system_prompt)
        answer = ai_response["candidates"][0]["content"]["parts"][0]["text"]

        import json
        clean_json = answer.replace('```json', '').replace('```', '').strip()
        try:
            parsed = json.loads(clean_json)
        except:
            parsed = {"summary": clean_json, "positive_insights": [], "critical_issues": [], "neutral_observations": [], "actionable_suggestions": []}

        return {"answer": parsed}
    except Exception as e:
        logger.error(f"Synthesis ask error: {str(e)}")
        fallback = {"summary": "Error: Neural connection lost.", "positive_insights": [], "critical_issues": [], "neutral_observations": [], "actionable_suggestions": []}
        return {"error": str(e), "answer": fallback}

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


@app.post("/api/feedback/upload")
async def process_feedback_upload(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        logger.error(f"Failed to parse CSV: {e}")
        raise HTTPException(status_code=400, detail="Invalid CSV format")

    possible_columns = ['feedback', 'text', 'comment', 'review', 'message']
    target_col = next((c for c in df.columns if c.lower() in possible_columns), None)
    
    if target_col is None:
        raise HTTPException(status_code=400, detail=f"CSV must contain one of these columns: {', '.join(possible_columns)}")

    processed_data = []
    total_polarity = 0.0
    all_words = []

    for _, row in df.iterrows():
        if pd.isna(row[target_col]):
            continue
        
        text_val = str(row[target_col]).strip()
        if not text_val:
            continue
            
        blob = TextBlob(text_val)
        polarity = blob.sentiment.polarity
        total_polarity += polarity
        
        # Categorize Sentiment
        if polarity > 0.1:
            sentiment_label = "Positive"
        elif polarity < -0.1:
            sentiment_label = "Negative"
        else:
            sentiment_label = "Neutral"

        # Collect keywords (Nouns and Adjectives) for overall top_keywords
        for word, tag in blob.tags:
            # We want words longer than 2 characters
            if len(word) > 2 and tag in ('NN', 'NNS', 'JJ'):
                all_words.append(word.lower())

        processed_data.append({
            "text": text_val,
            "sentiment": sentiment_label,
            "confidence": round(abs(polarity), 2) if abs(polarity) > 0.1 else 0.50,
            "polarity": polarity
        })

    total_rows = len(processed_data)
    if total_rows == 0:
        raise HTTPException(status_code=400, detail="No readable text found in CSV")

    average_sentiment = (total_polarity / total_rows) * 100

    from collections import Counter
    keyword_counts = Counter(all_words)
    top_keywords = [word for word, count in keyword_counts.most_common(5)]

    # Deep Intelligence Report Generation (Gemini)
    pos_count = sum(1 for row in processed_data if row["sentiment"] == "Positive")
    neg_count = sum(1 for row in processed_data if row["sentiment"] == "Negative")
    neu_count = sum(1 for row in processed_data if row["sentiment"] == "Neutral")
    pos_pct = round((pos_count / total_rows) * 100, 1)
    neg_pct = round((neg_count / total_rows) * 100, 1)
    neu_pct = round((neu_count / total_rows) * 100, 1)

    fallback_report = {
        "summary": f"Dataset contains {pos_pct}% positive, {neg_pct}% negative, and {neu_pct}% neutral feedback. Insufficient data for a full neural executive briefing.",
        "positive_insights": [],
        "critical_issues": [],
        "neutral_observations": [],
        "actionable_suggestions": []
    }

    try:
        sorted_data = sorted(processed_data, key=lambda x: x["polarity"])
        top_negative = [row["text"] for row in sorted_data[:8]]
        top_positive = [row["text"] for row in sorted_data[-8:]]
        neutral_rows = [row["text"] for row in processed_data if row["sentiment"] == "Neutral"][:5]

        if len(processed_data) >= 2:
            prompt = f"""You are an AI Customer Feedback Intelligence Engine — an elite enterprise data analysis system.

You are analyzing a real customer feedback dataset with the following verified statistics:
- Total responses: {total_rows}
- Positive: {pos_count} responses ({pos_pct}%)
- Negative: {neg_count} responses ({neg_pct}%)
- Neutral: {neu_count} responses ({neu_pct}%)

Top positive feedback samples:
{top_positive}

Top negative feedback samples:
{top_negative}

Neutral feedback samples:
{neutral_rows}

Generate a comprehensive, multi-tiered intelligence report based on this data.
Return ONLY a valid JSON object. No markdown. No extra text. Strictly this structure:
{{
  "summary": "A high-level paragraph that starts with the exact percentage split (e.g. 'The overall sentiment reveals a {pos_pct}% positive and {neg_pct}% negative split across {total_rows} responses...'). Summarise the overarching mood and most significant finding.",
  "positive_insights": ["Specific highlight of what customers praise", "Another strength or trend from positive samples"],
  "critical_issues": ["Most urgent or repeated complaint from negative samples", "Another high-risk issue that needs action"],
  "neutral_observations": ["A pattern or theme from neutral feedback", "An area that is neither praised nor criticized"],
  "actionable_suggestions": ["Concrete fix or improvement based on the negative feedback", "Strategy to amplify the positive trends"]
}}"""
            ai_response = call_ai(prompt)
            ai_text = ai_response["candidates"][0]["content"]["parts"][0]["text"].strip()

            import json
            clean_json = ai_text.replace('```json', '').replace('```', '').strip()
            try:
                ai_report = json.loads(clean_json)
            except:
                ai_report = {**fallback_report, "summary": clean_json}
        else:
            ai_report = fallback_report
    except Exception as e:
        logger.error(f"Executive Summary Error: {e}")
        ai_report = {**fallback_report, "summary": "Neural Executive Summary currently unavailable due to AI framework latency. Proceed with raw intelligence."}

    return {
        "total_rows": total_rows,
        "average_sentiment": round(average_sentiment, 2),
        "top_keywords": top_keywords,
        "ai_report": ai_report,
        "processed_data": processed_data
    }

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


# ── AI Draft Generator ─────────────────────────────────────────────────────────
class DraftRequest(BaseModel):
    original_text: str
    sender: str
    subject: str
    tone: str = "Formal"
    length: str = "Med"
    user_email: str

@app.post("/api/generate-draft")
async def generate_draft(req: DraftRequest):
    """
    Calls Gemini to generate a professional reply to an email.
    """
    length_guide = {"Short": "2-3 sentences", "Med": "1 concise paragraph", "Long": "2-3 thorough paragraphs"}
    length_hint = length_guide.get(req.length, "1 concise paragraph")

    prompt = f"""You are MONOLITH Neural Composer, an elite AI executive assistant.
A user has received an email and needs a {req.tone.lower()} reply.

Original email from: {req.sender}
Subject: {req.subject}
Body:
{req.original_text[:2000]}

Write a {req.tone.lower()} professional reply. Length: {length_hint}.
Do NOT include a subject line or 'Re:' prefix.
Do NOT add placeholders like [Your Name]. Write the complete, ready-to-send reply body only.
Start directly with the greeting."""

    try:
        ai_response = call_ai(prompt)
        draft = ai_response["candidates"][0]["content"]["parts"][0]["text"].strip()
        return {"draft": draft}
    except Exception as e:
        logger.error(f"Draft generation failed: {e}")
        raise HTTPException(status_code=500, detail="Draft generation failed")


# ── Gmail Send ─────────────────────────────────────────────────────────────────
class SendEmailRequest(BaseModel):
    user_email: str
    to: str
    subject: str
    body: str

@app.post("/api/send-email")
async def send_email(req: SendEmailRequest):
    """
    Sends an email via the Gmail API using the stored OAuth access token.
    """
    user = db.users.find_one({"email": req.user_email})
    if not user or not user.get("google_access_token"):
        raise HTTPException(status_code=401, detail="Google account not connected.")

    access_token = user["google_access_token"]

    # Build RFC 2822 message
    import email as email_lib
    from email.mime.text import MIMEText

    msg = MIMEText(req.body)
    msg["To"]      = req.to
    msg["From"]    = req.user_email
    msg["Subject"] = f"Re: {req.subject}" if not req.subject.startswith("Re:") else req.subject

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")

    send_response = requests.post(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        json={"raw": raw},
        timeout=15,
    )

    if not send_response.ok:
        logger.error(f"Gmail send failed: {send_response.text}")
        raise HTTPException(status_code=502, detail=f"Gmail send failed: {send_response.json().get('error', {}).get('message', 'Unknown error')}")

    sent = send_response.json()
    logger.info(f"✅ Email sent. Message ID: {sent.get('id')} → {req.to}")
    return {"status": "sent", "message_id": sent.get("id")}


# ── Analytics: Sentiment Velocity ─────────────────────────────────────────────
@app.get("/api/analytics/velocity")
async def get_sentiment_velocity(user_email: str, days: int = 14):
    """
    Fetches up to 50 recent emails from Gmail, scores sentiment, groups by date,
    and returns a 14-day stacked chart payload plus an AI-generated intelligence report.
    """
    from datetime import datetime, timedelta, timezone

    user = db.users.find_one({"email": user_email})
    if not user or not user.get("google_access_token"):
        raise HTTPException(status_code=401, detail="Google account not connected.")

    access_token = user["google_access_token"]
    headers      = {"Authorization": f"Bearer {access_token}"}

    # Fetch up to 50 message IDs (metadata only for speed)
    list_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&format=metadata"
    list_res = requests.get(list_url, headers=headers, timeout=15)
    if list_res.status_code == 401:
        raise HTTPException(status_code=401, detail="Google token expired.")

    messages = list_res.json().get("messages", [])
    if not messages:
        return {"chart": [], "report": "No emails found to analyse.", "current": {}, "previous": {}}

    now      = datetime.now(timezone.utc)
    cutoff   = now - timedelta(days=days)
    mid_cut  = now - timedelta(days=days // 2)   # splits into two equal halves

    # Bucket: date_str → { POSITIVE: n, NEGATIVE: n, NEUTRAL: n }
    buckets: dict[str, dict[str, int]] = {}

    for msg in messages:
        msg_id = msg["id"]
        detail_url = (
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}"
            f"?format=metadata&metadataHeaders=Subject&metadataHeaders=From"
        )
        d = requests.get(detail_url, headers=headers, timeout=10)
        if not d.ok:
            continue

        data         = d.json()
        internal_ms  = int(data.get("internalDate", 0))
        email_dt     = datetime.fromtimestamp(internal_ms / 1000, tz=timezone.utc)

        if email_dt < cutoff:
            continue

        date_str = email_dt.strftime("%b %d")

        # Lightweight snippet sentiment
        snippet = data.get("snippet", "")[:500]
        sentiment = "NEUTRAL"
        if len(snippet.strip()) > 5:
            try:
                score = TextBlob(snippet).sentiment.polarity
                if score > 0.1:
                    sentiment = "POSITIVE"
                elif score < -0.1:
                    sentiment = "NEGATIVE"
            except Exception:
                pass

        if date_str not in buckets:
            buckets[date_str] = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}
        buckets[date_str][sentiment] += 1

    # Build chart rows sorted by date
    chart = []
    current_totals = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}
    previous_totals = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}

    for i in range(days - 1, -1, -1):
        day    = now - timedelta(days=i)
        label  = day.strftime("%b %d")
        counts = buckets.get(label, {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0})
        total  = sum(counts.values()) or 1
        row = {
            "date": label,
            "Positive": round(counts["POSITIVE"] / total * 100, 1),
            "Negative": round(counts["NEGATIVE"] / total * 100, 1),
            "Neutral":  round(counts["NEUTRAL"]  / total * 100, 1),
            "_total":   sum(counts.values()),
        }
        chart.append(row)

        if day >= mid_cut:
            for k in current_totals:
                current_totals[k] += counts[k]
        else:
            for k in previous_totals:
                previous_totals[k] += counts[k]

    # Calculate deltas
    def pct(n, t): return round(n / t * 100, 1) if t else 0.0
    cur_total  = sum(current_totals.values())  or 1
    prev_total = sum(previous_totals.values()) or 1

    cur_pos  = pct(current_totals["POSITIVE"],  cur_total)
    prev_pos = pct(previous_totals["POSITIVE"], prev_total)
    cur_neg  = pct(current_totals["NEGATIVE"],  cur_total)
    prev_neg = pct(previous_totals["NEGATIVE"], prev_total)
    delta_pos = round(cur_pos - prev_pos, 1)
    delta_neg = round(cur_neg - prev_neg, 1)

    # Generate AI intelligence report
    report_prompt = f"""You are MONOLITH Neural Analyst. Write a concise 2–3 sentence intelligence report (no bullet points, no headers).

Sentiment data for this user's inbox — last {days // 2} days vs previous {days // 2} days:
Current period:  Positive {cur_pos}%, Negative {cur_neg}%, Neutral {round(100 - cur_pos - cur_neg, 1)}%
Previous period: Positive {prev_pos}%, Negative {prev_neg}%, Neutral {round(100 - prev_pos - prev_neg, 1)}%
Positive delta: {delta_pos:+.1f}%  |  Negative delta: {delta_neg:+.1f}%
Total emails analysed: {sum(current_totals.values()) + sum(previous_totals.values())}

Write a sharp, data-driven intelligence report. Sound like a Bloomberg terminal, not a chatbot."""

    report = "Intelligence report unavailable."
    try:
        ai_res  = call_ai(report_prompt)
        report  = ai_res["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.warning(f"Velocity report generation failed: {e}")

    return {
        "chart":    chart,
        "report":   report,
        "current":  {"Positive": cur_pos, "Negative": cur_neg, "Neutral": round(100 - cur_pos - cur_neg, 1)},
        "previous": {"Positive": prev_pos, "Negative": prev_neg, "Neutral": round(100 - prev_pos - prev_neg, 1)},
        "delta":    {"Positive": delta_pos, "Negative": delta_neg},
    }


def classify_email(subject: str, body: str) -> str:
    """
    Keyword-based neural label classifier.
    Checks subject first (higher signal), then body as fallback.
    """
    text = (subject + " " + body[:500]).lower()

    if any(k in text for k in ["asap", "urgent", "immediately", "critical", "emergency", "high priority", "escalat"]):
        return "URGENT"
    if any(k in text for k in ["invoice", "payment", "billing", "charge", "refund", "subscription", "receipt", "transaction"]):
        return "BILLING"
    if any(k in text for k in ["legal", "contract", "amendment", "compliance", "gdpr", "terms", "lawsuit", "attorney"]):
        return "LEGAL"
    if any(k in text for k in ["support", "ticket", "help", "issue", "bug", "error", "broken", "fix", "problem"]):
        return "SUPPORT"
    if any(k in text for k in ["feature", "request", "suggestion", "improve", "enhancement", "roadmap", "product"]):
        return "FEATURE"
    if any(k in text for k in ["report", "analytics", "monthly", "weekly", "summary", "digest", "metrics", "kpi"]):
        return "REPORTING"
    if any(k in text for k in ["audit", "policy", "regulation", "compliance", "data residency", "pipl", "pdpa"]):
        return "COMPLIANCE"
    return "GENERAL"

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
    
    # Get the latest 20 message IDs
    gmail_list_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20"
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

            email_dict = {
                "id": msg_id,
                "user_email": user_email,
                "sender": sender,
                "subject": subject,
                "full_text": clean_body,
                "sentiment": ai_label,
                "confidence": ai_score,
                "label": classify_email(subject, clean_body),
            }
            email_data.append(email_dict)

            # Persist to MongoDB for RAG retrieval
            db.emails.update_one({"id": msg_id}, {"$set": email_dict}, upsert=True)

            # Generate Gemini Embedding and upsert to Pinecone
            try:
                from project.ai.embedding import get_embedding
                from project.db.pinecone_db import index
                if index is not None:
                    embed_text = f"Subject: {subject}\n\n{clean_body[:3000]}"
                    vector = get_embedding(embed_text)
                    index.upsert([{
                        "id": msg_id,
                        "values": vector,
                        "metadata": {"user_email": user_email}
                    }])
            except Exception as e:
                logger.error(f"Pinecone upsert failed for msg {msg_id}: {e}")
    return {
        "status": "success", 
        "count": len(email_data),
        "emails": email_data
    }

# ── RAG: Semantic Vault Search ────────────────────────────────────────────────
@app.get("/api/search/semantic")
async def semantic_search(user_email: str, q: str):
    """
    1. Embeds the user search query using Gemini.
    2. Queries Pinecone for Top 5 closest vector matches (filtered by user).
    3. Fetches the full email document context from MongoDB using those IDs.
    """
    if not q.strip():
        return {"status": "success", "results": []}
    
    from project.ai.embedding import get_embedding
    from project.db.pinecone_db import index
    
    if index is None:
        raise HTTPException(status_code=500, detail="Pinecone database not initialized")
    
    try:
        # 1. Embed query
        query_vector = get_embedding(q)

        # 2. Query Pinecone
        pc_response = index.query(
            vector=query_vector,
            top_k=5,
            include_metadata=True,
            filter={"user_email": {"$eq": user_email}}
        )

        matches = pc_response.get("matches", [])
        if not matches:
            return {"status": "success", "results": []}

        # 3. Fetch from MongoDB and enrich with similarity score
        results = []
        for match in matches:
            msg_id = match["id"]
            score = round(match["score"] * 100, 1)  # percentage
            
            # Fetch from DB
            email_doc = db.emails.find_one({"id": msg_id, "user_email": user_email})
            if email_doc:
                email_doc["_id"] = str(email_doc["_id"])
                email_doc["similarity"] = score
                results.append(email_doc)
        
        # Sort by best match just in case
        results.sort(key=lambda x: x.get("similarity", 0), reverse=True)

        return {"status": "success", "results": results}

    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        raise HTTPException(status_code=500, detail="Neural search provider failed.")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("project.main:app", host="0.0.0.0", port=port)
