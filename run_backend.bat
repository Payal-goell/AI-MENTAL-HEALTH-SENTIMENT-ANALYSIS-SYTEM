@echo off
title MindCare AI - Backend Server
color 0A

echo.
echo ============================================
echo    MindCare AI - Backend Server
echo ============================================
echo.

cd /d "%~dp0backend"

if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate

echo [INFO] Installing dependencies...
pip install -r requirements.txt -q

echo [INFO] Starting FastAPI server...
echo [INFO] API docs: http://localhost:8000/docs
echo [INFO] Backend: http://localhost:8000
echo.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
