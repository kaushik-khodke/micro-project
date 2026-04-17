cd frontend
npm install       # first time only
npm run dev       # starts on http://localhost:3000




cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
