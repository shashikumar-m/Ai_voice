@echo off
echo ========================================
echo  AI Voice Notes - Backend Setup
echo ========================================

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo ========================================
echo  Setup complete!
echo  Next steps:
echo  1. Copy .env.example to .env
echo  2. Add your GROQ_API_KEY to .env
echo  3. Run: start.bat
echo ========================================
pause
