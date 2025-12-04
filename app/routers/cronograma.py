# app/routers/cronograma.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional

from core import run_cronograma, run_pdf

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
        return run_cronograma(form.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/pdf")
def gerar_pdf(form: FormularioAluno):
    try:
        pdf_io = run_pdf(form.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    filename = f'cronograma_{form.email}.pdf'.replace("\n", "_").replace("\r", "_")
    return StreamingResponse(
        pdf_io,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
