# MONOLITH — Engine Status Log

## Critical Fixes Applied

### Fix 1 — Health Check 500 Error
- Problem: /health endpoint crashing with Internal Server Error
- Cause: NameError — `index` variable not imported from pinecone_db
- Fix: Safe health check using localized imports + try-except blocks
- Result: API always responds even if a database is temporarily down

### Fix 2 — MongoDB SSL Handshake Failure  
- Problem: Backend crashing on startup
- Cause: Windows certificate verification failing (tlsv1 alert internal error)
- Fix: Explicit certifi CA bundle + tlsAllowInvalidCertificates fallback
- Result: Stable MongoDB Atlas connection on Windows

### Fix 3 — Pinecone Library Rename
- Problem: ImportError preventing backend startup
- Cause: pinecone-client renamed to pinecone officially
- Fix: Clean reinstall of modern library + updated import structure
- Result: Pinecone initializes cleanly on startup

### Fix 4 — CORS Connectivity Blocks
- Problem: Landing page (5174) blocked from calling backend
- Cause: CORS whitelist only included Dashboard (5174)
- Fix: Expanded whitelist to ports 5174, 5174, 3000
- Result: All frontends communicate with backend

### Fix 5 — Directory & Environment Mismatch
- Problem: venv\Scripts\activate failing in PowerShell
- Cause: Commands run from /project subfolder, venv is in root
- Fix: Standardized all execution from root using direct Python path
- Command: .\venv\Scripts\python.exe -m uvicorn project.main:app --reload
- Result: Backend starts reliably every time

## Current Status
- Backend:      http://localhost:8000  ✅ ONLINE
- Dashboard:    http://localhost:5174  ✅ ONLINE  
- Landing Page: http://localhost:3000  ✅ ONLINE
- MongoDB:      Connected ✅
- Pinecone:     Initialized ✅
- Gemini AI:    Connected (gemini-2.0-flash) ✅

## How To Run (Every Time)

### Terminal 1 — Backend
```powershell
cd C:\Users\grajk\OneDrive\Desktop\sentimental_rework
.\venv\Scripts\python.exe -m uvicorn project.main:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2 — Dashboard
```powershell
cd C:\Users\grajk\OneDrive\Desktop\sentimental_rework\monolith
npm run dev
```

### Terminal 3 — Landing Page
```powershell
cd C:\Users\grajk\OneDrive\Desktop\sentimental_rework\starting_page
npm run dev
```

### Verify
- http://localhost:8000/health → {"status":"ok"}
- http://localhost:5174 → Dashboard (ENGINE ONLINE)
- http://localhost:3000 → Landing Page
