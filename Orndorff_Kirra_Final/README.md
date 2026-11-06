run the data pipeline (only once):

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python pipeline.py
python analysis.py

run frontend:

cd frontend
npm start
