# core.py
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import os
from typing import Dict, Any
from io import BytesIO
import copy
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
    carga_txt = respostas.get("Quanto tempo, por semana, você consegue dedicar aos estudos com o RadioClub?")
    tempo_min, tempo_max = mapa_carga.get(carga_txt, (90, 180))

    semanas = gerar_cronograma(pesos, tempo_max, numero_semanas, tempo_min)

    itens = []
    minutos_por_semana = []
    total = 0
    for i, semana in enumerate(semanas, start=1):
        soma = sum(a["duration_min"] for a in semana)
        minutos_por_semana.append(soma)
        total += soma
        for aula in semana:
            itens.append({
                "semana": i,
                "module_name": aula["module_name"],
                "lesson_theme": aula["lesson_theme"],
                "duration_min": aula["duration_min"],
            })

    return {
        "semanas": numero_semanas,
        "itens": itens,
        "resumo": {
            "total_minutos": total,
            "minutos_por_semana": minutos_por_semana,
        },
        "params": {"tempo_min_semana": tempo_min, "tempo_max_semana": tempo_max},
    }

def run_pdf(cronograma_json: Dict[str, Any]) -> BytesIO:
    n = cronograma_json.get("semanas", 0)
    semanas = [[] for _ in range(n)]
    for item in cronograma_json.get("itens", []):
        semana_idx = item.get("semana", 0) - 1
        if 0 <= semana_idx < n:
            semanas[semana_idx].append({
                "module_name": item.get("module_name"),
                "lesson_theme": item.get("lesson_theme"),
                "duration_min": item.get("duration_min"),
            })
    return gerar_pdf_bytes(semanas)

def send_email_with_pdf(recipient_email: str, pdf_io: BytesIO):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")

    # Monta o e-mail
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = "Seu Cronograma RadioClub 📘"

    # Corpo do e-mail
    body = MIMEText(
        "Olá!\n\nSegue em anexo o seu cronograma personalizado do RadioClub.\n\nBons estudos! 📚",
        "plain",
        "utf-8"
    )
    msg.attach(body)

    # Anexa o PDF
    pdf_io.seek(0)
    pdf_part = MIMEApplication(pdf_io.read(), _subtype="pdf")
    pdf_part.add_header("Content-Disposition", "attachment", filename="cronograma.pdf")
    msg.attach(pdf_part)

    # Envia via servidor SMTP
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        print(f"✅ E-mail enviado com sucesso para {recipient_email}")
    except Exception as e:
        print("❌ Erro ao enviar e-mail:", e)
        raise