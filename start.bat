@echo off
echo Starting MONOLITH Engine...

start "Backend" cmd /k "cd /d C:\Users\grajk\OneDrive\Desktop\sentimental_rework && .\venv\Scripts\python.exe -m uvicorn project.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3

start "Dashboard" cmd /k "cd /d C:\Users\grajk\OneDrive\Desktop\sentimental_rework\monolith && npm run dev"

start "Landing" cmd /k "cd /d C:\Users\grajk\OneDrive\Desktop\sentimental_rework\starting_page && npm run dev"

echo All services starting...
echo Backend:   http://localhost:8000/health
echo Dashboard: http://localhost:5173
echo Landing:   http://localhost:3000
pause
