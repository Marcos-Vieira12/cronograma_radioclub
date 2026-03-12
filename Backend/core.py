# core.py
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import os
from typing import Dict, Any
from io import BytesIO
import copy
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64
from lib import (
    carregar_catalogo,
    calcular_pesos_aulas,
    gerar_cronograma,
    gerar_pdf_bytes,
    METRICAS,
    configurar_metricas_comuns,
    atualizar_metricas_r1,
    atualizar_metricas_r2,
    atualizar_metricas_r3,
    atualizar_metricas_r4,
)

def run_cronograma(form_json: Dict[str, Any]) -> Dict[str, Any]:
    email = form_json.get("email")
    nivel = form_json.get("nivel", "").upper()
    respostas = form_json.get("respostas", {})

    if not email or not nivel:
        raise ValueError("Campos obrigatórios: email, nivel")

    catalogo = carregar_catalogo()

    metricas = copy.deepcopy(METRICAS)
    configurar_metricas_comuns(metricas, form_json)

    if nivel.startswith("R1"):
        atualizar_metricas_r1(form_json, metricas)
    elif nivel.startswith("R2"):
        atualizar_metricas_r2(form_json, metricas)
    elif nivel.startswith("R3"):
        atualizar_metricas_r3(form_json, metricas)
    else:
        atualizar_metricas_r4(form_json, metricas)

    pesos = calcular_pesos_aulas(catalogo, metricas)

    numero_semanas = int(metricas.get("semanas") or respostas.get("numero_semanas") or 12)

    mapa_carga = {
        "Até 1h": (30, 60),
        "1h a 2h": (60, 120),
        "2h a 3h": (90, 180),
        "3h a 4h": (120, 240),
        "Mais de 4h": (240, 360),
    }

    carga_txt = respostas.get(
        "Quanto tempo, por semana, você consegue dedicar aos estudos com o RadioClub?"
    )
    tempo_min, tempo_max = mapa_carga.get(carga_txt, (90, 180))

    semanas, restantes = gerar_cronograma(
        pesos, tempo_max, numero_semanas, tempo_min
    )

    # Construção do formato FINAL para o front
    weeks_output = []

    for idx, semana in enumerate(semanas, start=1):
        weeks_output.append({
            "week": idx,
            "lessons": [
                {
                    "module_name": aula["module_name"],
                    "lesson_theme": aula["lesson_theme"],
                    "duration_min": aula["duration_min"],
                    "peso": aula["peso"]
                }
                for aula in semana
            ]
        })

    # Última semana = aulas restantes
    weeks_output.append({
        "week": "remaining",
        "lessons": [
            {
                "module_name": aula["module_name"],
                "lesson_theme": aula["lesson_theme"],
                "duration_min": aula["duration_min"],
                "peso": aula["peso"]
            }
            for aula in restantes
        ]
    })

    # Resumo
    minutos_por_semana = [sum(a["duration_min"] for a in w) for w in semanas]
    total = sum(minutos_por_semana)

    return {
        "weeks": weeks_output,
        "summary": {
            "total_minutes": total,
            "minutes_per_week": minutos_por_semana
        },
        "params": {
            "tempo_min_semana": tempo_min,
            "tempo_max_semana": tempo_max
        }
    }

def run_pdf(cronograma_json: Dict[str, Any]) -> BytesIO:
    # ===== FORMATO NOVO (weeks) =====
    if "weeks" in cronograma_json:
        semanas = []

        for w in cronograma_json.get("weeks", []):
            # ignora remaining
            if w.get("week") == "remaining":
                continue

            aulas = []
            for a in w.get("lessons", []):
                aulas.append({
                    "module_name": a.get("module_name"),
                    "lesson_theme": a.get("lesson_theme"),
                    "duration_min": a.get("duration_min"),
                })

            semanas.append(aulas)

        return gerar_pdf_bytes(semanas)

def send_email_with_pdf(recipient_email: str, pdf_io: BytesIO):
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("EMAIL_SENDER")

    # Prepara o PDF como anexo
    pdf_io.seek(0)
    pdf_content = base64.b64encode(pdf_io.read()).decode()

    message = Mail(
        from_email=sender_email,
        to_emails=recipient_email,
        subject="Seu Cronograma RadioClub 📘",
        html_content="<html><body><p>Olá!</p><p>Segue em anexo o seu cronograma personalizado do RadioClub.</p><p>Bons estudos! 📚</p></body></html>"
    )

    # Anexa o PDF
    attachment = Attachment(
        FileContent(pdf_content),
        FileName("cronograma.pdf"),
        FileType("application/pdf"),
        Disposition("attachment")
    )
    message.attachment = attachment

    # Envia via SendGrid
    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        print(f"✅ E-mail enviado com sucesso para {recipient_email}")
    except Exception as e:
        print(f"❌ Erro ao enviar e-mail para {recipient_email}: {str(e)}")
        raise
