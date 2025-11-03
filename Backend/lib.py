# lib.py
import json
from typing import Any, Dict, List
from reportlab.lib.pagesizes import A4  # type: ignore
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak  # type: ignore
from reportlab.lib import colors  # type: ignore
from reportlab.lib.styles import getSampleStyleSheet  # type: ignore
from io import BytesIO
from pathlib import Path

# ==== Imports do teu projeto ====
from metricas_base import METRICAS
from common import configurar_metricas_comuns
from r1 import atualizar_metricas as atualizar_metricas_r1
from r2 import atualizar_metricas as atualizar_metricas_r2
from r3 import atualizar_metricas as atualizar_metricas_r3
from r4 import atualizar_metricas as atualizar_metricas_r4

# Base do projeto (lib.py está na raiz neste layout)
BASE_DIR = Path(__file__).resolve().parent
JSON_PATH = BASE_DIR / "json" / "catalogo.json"

# -------------------- Utilitários --------------------
def carregar_catalogo(path: Path = JSON_PATH):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def calcular_pesos_aulas(catalogo, metricas_aluno):
    subespecialidades = [m for m in metricas_aluno if m.startswith("subespecialidade_")]
    exames = [m for m in metricas_aluno if m.startswith("exame_")]

    foco_subesp = metricas_aluno.get("foco_subespecialidade", 0)
    foco_exames = metricas_aluno.get("foco_exames", 0)

    resultado = []
    for aula in catalogo:
        score = 0.0
        metrics_aula = aula.get("metrics", {})

        subesp_especifica_validada = any(
            k.startswith("subespecialidade_")
            and k != "subespecialidade_geral"
            and metricas_aluno.get(k, 0) > 0
            for k in metrics_aula
        )

        for metrica, valor_aula in metrics_aula.items():
            valor_aluno = metricas_aluno.get(metrica, 0)

            if metrica == "subespecialidade_geral" and subesp_especifica_validada:
                score += -0.2
                continue

            if metrica in subespecialidades:
                valor_aluno *= (1 + foco_subesp)
            elif metrica in exames:
                valor_aluno *= (1 + foco_exames)

            score += float(valor_aula) * float(valor_aluno)

        resultado.append({
            "module_name": aula["module_name"],
            "lesson_theme": aula["lesson_theme"],
            "duration_min": int(aula["duration_min"]),
            "peso": round(score, 4),
        })
    return resultado

def gerar_cronograma(
    pesos_aulas: List[Dict[str, Any]],
    tempo_max_semana: int,
    numero_semanas: int,
    tempo_min_semana: int = 0,
    frac_limite_max: float = 0.90,
    peso_min_intermediario: float = 3.5,
):
    aulas_ordenadas = sorted(pesos_aulas, key=lambda x: x["peso"], reverse=True)
    cronograma: List[List[Dict[str, Any]]] = [[] for _ in range(numero_semanas)]
    limite_90 = tempo_max_semana * frac_limite_max

    for semana_idx in range(numero_semanas):
        if not aulas_ordenadas:
            break

        total_semana = 0

        while aulas_ordenadas:
            if total_semana >= limite_90:
                break

            if total_semana < tempo_min_semana:
                def cabe(a):
                    return a["duration_min"] + total_semana <= tempo_max_semana
            else:
                def cabe(a):
                    return (
                        a["peso"] >= peso_min_intermediario
                        and a["duration_min"] + total_semana <= tempo_max_semana
                    )

            candidato = next((a for a in aulas_ordenadas if cabe(a)), None)
            if candidato is None:
                break

            cronograma[semana_idx].append(candidato)
            total_semana += candidato["duration_min"]
            aulas_ordenadas.remove(candidato)

    return cronograma

def gerar_pdf_bytes(cronograma: List[List[Dict[str, Any]]]) -> BytesIO:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elementos = []

    for i, semana in enumerate(cronograma, 1):
        elementos.append(Paragraph(f"Semana {i}", styles["Heading2"]))
        data = [["#", "Módulo", "Tema", "Minutos"]]
        total_semana = 0
        for idx, aula in enumerate(semana, 1):
            data.append([idx, aula["module_name"], aula["lesson_theme"], aula["duration_min"]])
            total_semana += aula["duration_min"]

        tabela = Table(data, repeatRows=1)
        tabela.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        elementos.append(tabela)
        elementos.append(Spacer(1, 24))
        elementos.append(Paragraph(f"Tempo total da semana: {total_semana} minutos", styles["Normal"]))

        if i < len(cronograma):
            elementos.append(PageBreak())

    doc.build(elementos)
    buf.seek(0)
    return buf
