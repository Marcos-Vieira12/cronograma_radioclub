# app/routers/cronograma.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from core import run_cronograma, run_pdf
import os
import json
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
engine = create_engine(os.getenv("DB_URL"))

router = APIRouter(prefix="/cronograma", tags=["cronograma"])

class FormularioAluno(BaseModel):
    respondent_id: Optional[str] = None
    nivel: str
    email: str
    submitted_at: Optional[str] = None
    respostas: Dict[str, Any]

@router.post("")
def gerar(form: FormularioAluno):
    try:
        # 1️⃣ Gera o cronograma
        resultado = run_cronograma(form.model_dump())

        # 2️⃣ Serializa os campos JSON (respostas e cronograma)
        dados = {
            "email": form.email,
            "nivel": form.nivel,
            "respostas": json.dumps(form.respostas),
            "cronograma": json.dumps(resultado),
        }

        # 3️⃣ Insere no banco
        with engine.connect() as conn:
            query = text("""
                INSERT INTO cronogramas (email, nivel, respostas, cronograma)
                VALUES (:email, :nivel, :respostas, :cronograma)
            """)
            conn.execute(query, dados)
            conn.commit()

        # 4️⃣ Retorna sucesso
        return {"message": "SHOW!! agora nosso time de especialistas vai criar o seu cronograma e em breve te enviaremos por email 😁"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/pdf")
def gerar_pdf(cronograma_json: Dict[str, Any]):
    try:
        pdf_io = run_pdf(cronograma_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    filename = f"cronograma_{cronograma_json.get('email', 'arquivo')}.pdf"
    filename = filename.replace("\n", "_").replace("\r", "_")
    return StreamingResponse(
        pdf_io,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
