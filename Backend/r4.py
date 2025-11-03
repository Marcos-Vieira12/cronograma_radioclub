from llm_utils import processar_resposta_aberta

def atualizar_metricas(respostas_aluno, metricas):
    r = respostas_aluno["respostas"]

    # Exames iniciais (fechada)
    q_exames = "Quais exames você realiza na sua prática atual e gostaria de revisar ou de se atualizar?"
    if q_exames in r:
        for exame in r[q_exames]:
            if exame == "RX Geral":
                metricas["exame_rx"] += 4
            elif exame == "USG Geral":
                metricas["exame_usg"] += 4
            elif exame == "Densitometria Óssea":
                metricas["exame_densitometria"] += 2
            elif exame == "Mamografia":
                metricas["exame_mamografia"] += 2
            elif exame == "TC":
                metricas["exame_tc"] += 2
            elif exame == "RM":
                metricas["exame_rm"] += 2
            elif exame == "Doppler":
                metricas["exame_doppler"] += 2
            elif exame == "AngioTC / AngioRM":
                metricas["exame_angio"] += 2
            elif exame == "Fluoroscopia":
                metricas["exame_fluoroscopia"] += 2
            elif exame == "Contrastados":
                metricas["exame_contrastados"] += 2
            elif exame == "PET-CT":
                metricas["exame_petct"] += 4
            elif exame == "HSG":
                metricas["exame_hsg"] += 2

    # Subespecialidades (fechada)
    q_subs = "Em quais subespecialidades você tem mais interesse revisar ou se aprofundar agora?"
    if q_subs in r:
        for subesp in r[q_subs]:
            if subesp == "Neuro":
                metricas["subespecialidade_neuro"] += 4
            elif subesp == "Tórax":
                metricas["subespecialidade_torax"] += 4
            elif subesp == "Abdome":
                metricas["subespecialidade_abdome"] += 4
            elif subesp == "Mama":
                metricas["subespecialidade_mama"] += 4
            elif subesp == "Musculoesquelético":
                metricas["subespecialidade_musculoesqueletico"] += 4
            elif subesp == "Cabeça e Pescoço":
                metricas["subespecialidade_cabeca_pescoco"] += 4
            elif subesp == "Pediatria":
                metricas["subespecialidade_pediatria"] += 4
            elif subesp == "Gineco/Obstetrícia":
                metricas["subespecialidade_gineco"] += 4
            elif subesp == "Urologia":
                metricas["subespecialidade_urologia"] += 4
            elif subesp == "Oncologia":
                metricas["subespecialidade_oncologia"] += 4
            elif subesp == "Intervenção":
                metricas["subespecialidade_intervencao"] += 4
            elif subesp == "Cardiovascular":
                metricas["subespecialidade_cardiovascular"] += 4

    # Perguntas abertas com LLM
    if "Há quanto tempo terminou a residência?" in r:
        metricas = processar_resposta_aberta(
            "Há quanto tempo terminou a residência?",
            r["Há quanto tempo terminou a residência?"],
            metricas
        )

    if "No RadioClub, você pretende:" in r:
        metricas = processar_resposta_aberta(
            "No RadioClub, você pretende:",
            r["No RadioClub, você pretende:"],
            metricas
        )

    return metricas
