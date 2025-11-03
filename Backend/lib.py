# lib.py
import json
from typing import Any, Dict, List
from reportlab.lib.pagesizes import A4  # type: ignore
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak  # type: ignore
from reportlab.lib import colors  # type: ignore
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # type: ignore
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from PyPDF2 import PdfReader, PdfWriter
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
JSON_PATH = BASE_DIR / "files" / "catalogo.json"
CAPA_PATH = BASE_DIR / "files" / "capa.pdf"
CONTRACAPA_PATH = BASE_DIR / "files" / "contracapa.pdf"
SLOGAN_PATH = BASE_DIR / "files" / "slogan.png"
# --- Paleta (HEX -> ReportLab) ---
AZUL = colors.HexColor("#2f53ea")
CINZA = colors.HexColor("#d9d9d9")
CINZA_CLARO = colors.HexColor("#f4f4f4")
PRETO = colors.black
BRANCO = colors.white
# --- Registrar fontes Montserrat (Regular/Bold) ---
pdfmetrics.registerFont(TTFont("Montserrat", str(BASE_DIR / "fonts" / "Montserrat-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Bold", str(BASE_DIR / "fonts" / "Montserrat-Bold.ttf")))
FONT_REG = "Montserrat"
FONT_BOLD = "Montserrat-Bold"



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
    miolo_buf = BytesIO()

    # Margens e página
    LATERAL = 12
    RODAPE = 20

    # --- Slogan controlado por largura (percentual da área útil) ---
    WIDTH_RATIO = 0.45  # 45% da largura útil
    try:
        img = ImageReader(str(SLOGAN_PATH))
        iw, ih = img.getSize()
    except Exception:
        iw, ih = (1, 1)

    avail_w_page = A4[0] - 2 * LATERAL
    w = WIDTH_RATIO * avail_w_page
    h = w * (ih / iw)  # altura proporcional

    # Espaçamentos proporcionais ao h efetivo
    space_above = 0.80 * h
    space_below = 1.5 * h
    TOP_MARGIN = int(round(space_above + h + space_below))

    doc = SimpleDocTemplate(
        miolo_buf, pagesize=A4,
        leftMargin=LATERAL, rightMargin=LATERAL,
        topMargin=TOP_MARGIN, bottomMargin=RODAPE
    )

    styles = getSampleStyleSheet()
    body_size = styles["Normal"].fontSize + 1
    body_leading = body_size + 2
    styles["Normal"].fontName = FONT_REG
    styles["Normal"].fontSize = body_size
    styles["Normal"].leading = body_leading

    tema_style = ParagraphStyle(
        "tema", parent=styles["Normal"],
        fontName=FONT_REG,
        fontSize=body_size, leading=body_leading
    )

    # desenha o slogan usando o mesmo WIDTH_RATIO
    def on_page(canvas, doc_):
        try:
            img = ImageReader(str(SLOGAN_PATH))
            iw, ih = img.getSize()

            avail_w = doc_.pagesize[0] - doc_.leftMargin - doc_.rightMargin
            _w = WIDTH_RATIO * avail_w
            _h = _w * (ih / iw)

            _space_above = 0.9 * _h
            x = doc_.leftMargin + (avail_w - _w) / 2.0
            y = doc_.pagesize[1] - (_space_above + _h)

            canvas.drawImage(
                img, x, y, width=_w, height=_h,
                preserveAspectRatio=True, mask='auto'
            )
        except Exception:
            pass

    elementos = []

    for i, semana in enumerate(cronograma, 1):
        data = []
        # 1) Faixa SEMANA X
        data.append([f"SEMANA {i}", "", ""])
        # 2) Cabeçalho (fundo branco, negrito, centralizado)
        data.append(["MÓDULO", "TEMA", "MINUTOS DE AULA"])

        total_semana = 0
        # 3) Aulas
        for aula in semana:
            total_semana += aula["duration_min"]
            data.append([
                Paragraph(aula["module_name"], styles["Normal"]),
                Paragraph(aula["lesson_theme"], tema_style),
                str(aula["duration_min"]),  # string para ALIGN funcionar
            ])

        # 4) Linha TOTAL (apenas na 3ª coluna)
        horas = total_semana // 60
        mins = total_semana % 60
        total_txt = f"TOTAL: ({horas}H{mins:02d})"
        data.append(["", "", total_txt])

        # Larguras (Módulo↑, Minutos↑, Tema↓)
        total_w = doc.pagesize[0] - doc.leftMargin - doc.rightMargin
        cw_mod = 0.32 * total_w
        cw_tema = 0.48 * total_w
        cw_min = 0.20 * total_w

        # Alturas das linhas
        content_h = 36
        total_h = max(18, int(round(content_h * 0.6)))
        row_heights = []
        for r in range(len(data)):
            if r == 0:              row_heights.append(22)       # faixa
            elif r == 1:            row_heights.append(22)       # cabeçalho
            elif r == len(data)-1:  row_heights.append(total_h)  # total 60%
            else:                   row_heights.append(content_h) # conteúdo

        tabela = Table(
            data,
            repeatRows=2,
            colWidths=[cw_mod, cw_tema, cw_min],
            rowHeights=row_heights
        )

        ts = TableStyle([
            # GRID geral cinza e mais espesso
            ("GRID", (0, 0), (-1, -1), 1.0, CINZA),

            # Faixa SEMANA X (col 0 azul; col 1..2 cinza com SPAN)
            ("BACKGROUND", (0, 0), (0, 0), AZUL),
            ("TEXTCOLOR", (0, 0), (0, 0), BRANCO),
            ("FONTNAME", (0, 0), (0, 0), FONT_BOLD),
            ("FONTSIZE", (0, 0), (0, 0), body_size + 2),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),  # CENTRALIZA SEMANA X
            ("VALIGN", (0, 0), (0, 0), "MIDDLE"),

            ("BACKGROUND", (1, 0), (2, 0), CINZA),
            ("LINEBEFORE", (2, 0), (2, 0), 0, BRANCO),
            ("LINEAFTER", (1, 0), (1, 0), 0, BRANCO),
            ("SPAN", (1, 0), (2, 0)),

            # Borda azul ao redor da célula "SEMANA X"
            ("BOX", (0, 0), (0, 0), 1.0, AZUL),

            # Cabeçalho centralizado (fundo branco)
            ("BACKGROUND", (0, 1), (-1, 1), BRANCO),
            ("TEXTCOLOR", (0, 1), (-1, 1), PRETO),
            ("FONTNAME", (0, 1), (-1, 1), FONT_BOLD),
            ("FONTSIZE", (0, 1), (-1, 1), body_size),
            ("ALIGN", (0, 1), (-1, 1), "CENTER"),
            ("VALIGN", (0, 1), (-1, 1), "MIDDLE"),

            # Corpo: módulo/tema à esquerda-baixo; minutos centralizado
            ("VALIGN", (0, 2), (-1, -2), "BOTTOM"),
            ("ALIGN", (0, 2), (1, -2), "LEFT"),
            ("ALIGN", (2, 2), (2, -2), "CENTER"),
            ("VALIGN", (2, 2), (2, -2), "MIDDLE"),

            # Padding menor
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),

            # Linha TOTAL: col 0..1 cinza; col 2 azul/ branco/ bold/ centralizado
            ("BACKGROUND", (0, -1), (1, -1), CINZA),
            ("BACKGROUND", (2, -1), (2, -1), AZUL),
            ("TEXTCOLOR", (2, -1), (2, -1), BRANCO),
            ("FONTNAME", (2, -1), (2, -1), FONT_BOLD),
            ("FONTSIZE", (2, -1), (2, -1), body_size),
            ("ALIGN", (2, -1), (2, -1), "CENTER"),
            ("VALIGN", (2, -1), (2, -1), "MIDDLE"),

            # Borda azul ao redor da célula "TOTAL"
            ("BOX", (2, -1), (2, -1), 1.0, AZUL),
        ])
        tabela.setStyle(ts)

        elementos.append(tabela)
        if i < len(cronograma):
            elementos.append(PageBreak())

    doc.build(elementos, onFirstPage=on_page, onLaterPages=on_page)
    miolo_buf.seek(0)

    # Junta CAPA + MIOLO + CONTRACAPA (usa *PATH já definidos no módulo)
    writer = PdfWriter()
    try:
        r = PdfReader(open(CAPA_PATH, "rb"))
        for p in r.pages:
            writer.add_page(p)
    except Exception:
        pass

    r = PdfReader(miolo_buf)
    for p in r.pages:
        writer.add_page(p)

    try:
        r = PdfReader(open(CONTRACAPA_PATH, "rb"))
        for p in r.pages:
            writer.add_page(p)
    except Exception:
        pass

    out = BytesIO()
    writer.write(out)
    out.seek(0)
    return out

