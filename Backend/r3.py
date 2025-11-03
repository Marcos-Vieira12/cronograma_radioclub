from llm_utils import processar_resposta_aberta

def atualizar_metricas(respostas_aluno, metricas):
    r = respostas_aluno["respostas"]

    # Exames iniciais (fechada)
    q_exames = "Quais exames você tem mais contato hoje na residência e gostaria de aprofundar?"
    if q_exames in r:
        for exame in r[q_exames]:
            if exame == "RX":
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
    q_subs = "Quais subespecialidades você mais tem contato na Residência e gostaria de aprofundar?"
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

    # Perguntas abertas com LLM
    if "Já decidiu qual área quer seguir no R4/Fellow?" in r:
        metricas = processar_resposta_aberta(
            "Já decidiu qual área quer seguir no R4/Fellow?",
            r["Já decidiu qual área quer seguir no R4/Fellow?"],
            metricas
        )

    if "Tem algum exame de imagem ou subespecialidade específica que você quer dominar ou revisar agora no R3? Ou algo que você sente que ficou pra trás do R1/R2?" in r:
        metricas = processar_resposta_aberta(
            "Tem algum exame de imagem ou subespecialidade específica que você quer dominar ou revisar agora no R3? Ou algo que você sente que ficou pra trás do R1/R2?",
            r["Tem algum exame de imagem ou subespecialidade específica que você quer dominar ou revisar agora no R3? Ou algo que você sente que ficou pra trás do R1/R2?"],
            metricas
        )

    return metricas
