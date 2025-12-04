# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.cronograma import router as cronograma_router

app = FastAPI(title="RadioClub Cronograma API", version="1.0.0")

# CORS (ajusta origens conforme teu sistema)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou a origem do sistema da empresa
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Healthcheck simples
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Rotas do cronograma
app.include_router(cronograma_router)
