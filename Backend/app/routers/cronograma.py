# app/routers/cronograma.py
import traceback
from fastapi import APIRouter, HTTPException, Depends, Body
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

from app.security import get_current_user  # 👈 ADICIONA

engine = create_engine(
    os.getenv("DB_URL"),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

router = APIRouter(prefix="/cronograma", tags=["cronograma"])

class FormularioAluno(BaseModel):
    name: Optional[str] = None
    nivel: str
    email: str
    submitted_at: Optional[str] = None
    respostas: Dict[str, Any]

# ✅ PÚBLICA (sem token)
@router.post("")
def gerar(form: FormularioAluno):
    try:
        resultado = run_cronograma(form.model_dump())

        dados = {
            "name": form.name,
            "email": form.email,
            "nivel": form.nivel,
            "respostas": json.dumps(form.respostas),
            "cronograma": json.dumps(resultado),
        }

        with engine.connect() as conn:
            query = text("""
                INSERT INTO cronogramas (name,email, nivel, respostas, cronograma)
                VALUES (:name, :email, :nivel, :respostas, :cronograma)
            """)
            conn.execute(query, dados)
            conn.commit()

        return {"message": "SHOW!! agora nosso time de especialistas vai criar o seu cronograma e em breve te enviaremos por email 😁"}

    except Exception as e:
        tb_str = traceback.format_exc()
        print(tb_str)
        raise HTTPException(
            status_code=400,
            detail=f"Erro interno: {str(e)}\n\nTraceback:\n{tb_str}"
        )

# 🔒 PROTEGIDA (com token)
@router.post("/pdf")
def gerar_pdf(cronograma_json: Dict[str, Any], user=Depends(get_current_user)):
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

# 🔒 PROTEGIDA
@router.post("/email")
def sendEmail(id: str, user=Depends(get_current_user)):
    with engine.connect() as conn:
        query = text("""
            SELECT cronograma, email
            FROM cronogramas
            WHERE id = :id
        """)
        result = conn.execute(query, {"id": id}).fetchone()

    if not result:
        raise Exception("Nenhum cronograma encontrado")

    cronograma_raw, email = result

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
            "message": f"Cronograma enviado com sucesso para {email}."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 🔒 PROTEGIDA
@router.post("/getall")
def getall(user=Depends(get_current_user)):
    with engine.connect() as conn:
        query = text("""
            SELECT 
                id,
                email,
                nivel,
                respostas,
                cronograma,
                status,
                name,
                modifier
            FROM cronogramas
            ORDER BY name ASC
        """)
        result = conn.execute(query).mappings().fetchall()

    if not result:
        raise HTTPException(status_code=404, detail=f"Nenhum cronograma encontrado")

    cronogramas = []
    for row in result:
        cronogramas.append({
            "id": str(row["id"]),
            "email": row["email"],
            "nivel": row["nivel"],
            "respostas": row["respostas"],
            "cronograma": row["cronograma"],
            "status": row["status"],
            "name": row["name"],
            "modifier": row["modifier"]
        })

    return {"status": "success", "count": len(cronogramas), "data": cronogramas}


@router.post("/update")
def update_cronograma(
    id: str,
    cronograma_json: Dict[str, Any] = Body(...),
    user=Depends(get_current_user),
):
    try:
        # validação mínima (pra evitar salvar lixo)
        if not isinstance(cronograma_json, dict) or "weeks" not in cronograma_json:
            raise HTTPException(status_code=400, detail="Payload inválido: esperado um objeto com 'weeks'.")

        # opcional: garantir que weeks é lista
        if not isinstance(cronograma_json.get("weeks"), list):
            raise HTTPException(status_code=400, detail="Payload inválido: 'weeks' precisa ser uma lista.")

        cronograma_str = json.dumps(cronograma_json, ensure_ascii=False)

        # tenta extrair um identificador do usuário (depende do seu get_current_user)
        modifier = None
        try:
            if isinstance(user, dict):
                modifier = user.get("email") or user.get("username") or user.get("name")
            else:
                modifier = getattr(user, "email", None) or getattr(user, "username", None) or getattr(user, "name", None)
        except Exception:
            modifier = None

        with engine.begin() as conn:
            query = text("""
                UPDATE cronogramas
                SET cronograma = :cronograma
                {modifier_clause}
                WHERE id = :id
            """.format(
                modifier_clause=", modifier = :modifier" if modifier else ""
            ))

            params = {"id": id, "cronograma": cronograma_str}
            if modifier:
                params["modifier"] = modifier

            result = conn.execute(query, params)

            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Cronograma não encontrado para atualizar.")

        return {"status": "success", "message": "Cronograma atualizado com sucesso."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
# 🔒 PROTEGIDA
@router.post("/remove")
def remove_cronograma(id: str, user=Depends(get_current_user)):
    try:
        with engine.begin() as conn:
            backup_query = text("""
                INSERT INTO backup (
                    id,
                    email,
                    nivel,
                    respostas,
                    cronograma,
                    status,
                    name,
                    modifier
                )
                SELECT
                    id,
                    email,
                    nivel,
                    respostas,
                    cronograma,
                    status,
                    name,
                    modifier
                FROM cronogramas
                WHERE id = :id
            """)
            backup_result = conn.execute(backup_query, {"id": id})

            if backup_result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Cronograma não encontrado")

            delete_query = text("""
                DELETE FROM cronogramas
                WHERE id = :id
            """)
            conn.execute(delete_query, {"id": id})

        return {"status": "success", "message": "Cronograma removido com sucesso (backup realizado)."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
