# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.cronograma import router as cronograma_router
import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
engine = create_engine(os.getenv("DB_URL"))


app = FastAPI(title="RadioClub Cronograma API", version="1.0.0")

# CORS (ajusta origens conforme teu sistema)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou a origem do sistema da empresa
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/testdb")
def test_db_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT NOW();"))
            timestamp = result.scalar()  # pega o resultado da query
            return {"status": "ok", "connected": True, "timestamp": str(timestamp)}
    except Exception as e:
        return {"status": "error", "connected": False, "error": str(e)}

# Healthcheck simples
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Rotas do cronograma
app.include_router(cronograma_router)
