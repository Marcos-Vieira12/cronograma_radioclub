from llm_utils import processar_resposta_aberta

def atualizar_metricas(respostas_aluno, metricas):

    r = respostas_aluno["respostas"]

    # Exames iniciais (fechada)
    if "Quais exames de imagem você já tem contato na prática ou vai ter nesse início de R1?" in r:
        for exame in r["Quais exames de imagem você já tem contato na prática ou vai ter nesse início de R1?"]:
            if exame == "RX":
                metricas["exame_rx"] += 4
            elif exame == "USG":
                metricas["exame_usg"] += 4
            elif exame == "Densitometria":
                metricas["exame_densitometria"] += 2
            elif exame == "Mamografia":
                metricas["exame_mamografia"] += 2
            elif exame == "TC":
                metricas["exame_tc"] += 2
            elif exame == "RM":
                metricas["exame_rm"] += 2

    # Subespecialidades (fechada)
    if "Quais subespecialidades você vai ter mais contato na Residência?" in r:
        for subesp in r["Quais subespecialidades você vai ter mais contato na Residência?"]:
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
    if "Quais exames de imagem sente mais dificuldade no momento?" in r:
        metricas = processar_resposta_aberta(
            "Quais exames de imagem sente mais dificuldade no momento?",
            r["Quais exames de imagem sente mais dificuldade no momento?"],
            metricas
        )

    if "Quais temas você está vendo ou vai ver no primeiro ano de Residência?" in r:
        metricas = processar_resposta_aberta(
            "Quais temas você está vendo ou vai ver no primeiro ano de Residência?",
            r["Quais temas você está vendo ou vai ver no primeiro ano de Residência?"],
            metricas
        )

    return metricas
