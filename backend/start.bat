@echo off
echo Starting CCTV Quotation Backend...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies if needed
echo Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop
echo.

REM Start the server
python main.py
