# app/routers/cronograma.py
import traceback
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from core import run_cronograma, run_pdf
import os
import json
from core import send_email_with_pdf
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
engine = create_engine(os.getenv("DB_URL"))

router = APIRouter(prefix="/cronograma", tags=["cronograma"])

class FormularioAluno(BaseModel):
    name: Optional[str] = None
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
            "name": form.name,
            "email": form.email,
            "nivel": form.nivel,
            "respostas": json.dumps(form.respostas),
            "cronograma": json.dumps(resultado),
        }

        # 3️⃣ Insere no banco
        with engine.connect() as conn:
            query = text("""
                INSERT INTO cronogramas (name,email, nivel, respostas, cronograma)
                VALUES (:name, :email, :nivel, :respostas, :cronograma)
            """)
            conn.execute(query, dados)
            conn.commit()

        # 4️⃣ Retorna sucesso
        return {"message": "SHOW!! agora nosso time de especialistas vai criar o seu cronograma e em breve te enviaremos por email 😁"}

    except Exception as e:
        tb_str = traceback.format_exc()
        print(tb_str)  # loga no console / Render Logs
        raise HTTPException(
            status_code=400,
            detail=f"Erro interno: {str(e)}\n\nTraceback:\n{tb_str}"
        )
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
@router.post("/email")
def sendEmail(id: str):
    with engine.connect() as conn:
        query = text("""
            SELECT cronograma, email
            FROM cronogramas
            WHERE id = :id
        """)
        result = conn.execute(query, {"id": id}).fetchone()

    if not result:
        raise Exception("Nenhum cronograma encontrado")

    # separa campos do resultado
    cronograma_raw, email = result

    # garante que o cronograma seja um dicionário
    cronograma_json = (
        cronograma_raw if isinstance(cronograma_raw, dict)
        else json.loads(cronograma_raw)
    )

    try:
        pdf_io = run_pdf(cronograma_json)
        send_email_with_pdf(email, pdf_io)
        with engine.begin() as conn:
            update_query = text("""
                UPDATE cronogramas
                SET status = TRUE
                WHERE id = :id
            """)
            conn.execute(update_query, {"id": id})

        return {
            "status": "sucess",
            "message":f"Cronograma enviado com sucesso para {email}."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/getall")
def getall():
    with engine.connect() as conn:
        query = text("""
            SELECT 
                id,
                email,
                nivel,
                respostas,
                cronograma,
                status,
                name
            FROM cronogramas
            ORDER BY name ASC
        """)
        result = conn.execute(query).mappings().fetchall()

    if not result:
        raise HTTPException(status_code=404, detail=f"Nenhum cronograma encontrado")

    cronogramas = []
    for row in result:
        cronogramas.append({
            "id": str(row["id"]),  # UUID -> string
            "email": row["email"],
            "nivel": row["nivel"],
            "respostas": row["respostas"],
            "cronograma": row["cronograma"],
            "status": row["status"],
            "name": row["name"]
        })

    return {
        "status": "success",
        "count": len(cronogramas),
        "data": cronogramas
    }

    