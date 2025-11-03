from typing import Dict, Any, List

def _to_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x).strip() for x in value]
    return [p.strip() for p in str(value).split(",") if p.strip()]

def configurar_metricas_comuns(metricas: Dict[str, float], respostas_aluno: Dict[str, Any]) -> None:
    r = respostas_aluno.get("respostas", {})
    nivel = respostas_aluno.get("nivel")

    num_semanas = r.get("numero_semanas")
    if isinstance(num_semanas, (int, float)) and num_semanas > 0:
        metricas["semanas"] = int(num_semanas)

    # Peso base por nível
    if nivel == "R1":
        metricas["fundamentos_basicos"] += 2.0
        #metricas["conteudo_intermediario"] += 1.0
        metricas["conteudo_avancado"] -=2.0
    elif nivel == "R2":
        #metricas["fundamentos_basicos"] += 1.0
        metricas["conteudo_intermediario"] += 2.0
        #metricas["conteudo_avancado"] += 1.0
    elif nivel == "R3":
        metricas["fundamentos_basicos"] -= 2.0
        #metricas["conteudo_intermediario"] += 0.0
        metricas["conteudo_avancado"] += 2.0
    elif nivel == "R4 / medico radiologista":
        metricas["fundamentos_basicos"] -= 2.0
        #metricas["conteudo_intermediario"] +=0.0
        metricas["conteudo_avancado"] += 2.0

    # Objetivos (comum a todos os níveis)
    objetivos = _to_list(r.get("Quais os seus objetivos com o curso RadioClub?"))

    if "Aprofundar conhecimentos na minha subespecialidade atual" in objetivos:
        metricas["foco_subespecialidade"] += 0.5
    if "Me atualizar com as inovações e protocolos mais recentes" in objetivos:
        metricas["exame_petct"] += 6
    if "Praticar com casos reais e discussões clínicas" in objetivos:
        metricas["discussoes_ao_vivo"] += 4

    # Carga horária
    if "Quanto tempo, por semana, você consegue dedicar aos estudos com o RadioClub?" in r:
        tempo = r["Quanto tempo, por semana, você consegue dedicar aos estudos com o RadioClub?"]
        if tempo == "Até 1h":
            metricas["carga_horaria_min"] = 30
            metricas["carga_horaria_max"] = 60
        elif tempo == "1h a 2h":
            metricas["carga_horaria_min"] = 60
            metricas["carga_horaria_max"] = 120
        elif tempo == "2h a 3h":
            metricas["carga_horaria_min"] = 120
            metricas["carga_horaria_max"] = 180
        elif tempo == "3h a 4h":
            metricas["carga_horaria_min"] = 180
            metricas["carga_horaria_max"] = 240
        elif tempo == "Mais de 4h":
            metricas["carga_horaria_min"] = 240
            metricas["carga_horaria_max"] = 360

    # Temas extras
    temas_extras = _to_list(r.get("temas_extras"))
    if "Inglês médico" in temas_extras:
        metricas["subespecialidade_ingles"] += 4
    if "Como montar sua workstation" in temas_extras:
        metricas["subespecialidade_workstation"] += 4
    if "Finanças médicas" in temas_extras:
        metricas["subespecialidade_financas"] += 4
    if "Trabalhos científicos" in temas_extras:
        metricas["subespecialidade_pesquisa"] += 4
    if "Inteligência artificial" in temas_extras:
        metricas["subespecialidade_inteligencia_artificial"] += 4
    # "Revalidação de diploma" e "Prefiro focar no conteúdo técnico" -> sem impacto
