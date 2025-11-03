

# Cronograma API

API em **FastAPI** para geração de **cronogramas de estudo** personalizados e exportação em **PDF**, baseada em métricas específicas para residentes de Radiologia (R1–R4).  
Inclui integração com **OpenAI** para processar respostas abertas e ajustar automaticamente as métricas do aluno.

---

## 🔌 Endpoints

### 1. GET /healthz
Verifica se a API está no ar.  
**Response (200):**
```json
{"status": "ok"}
```

### 2. POST /cronograma
Gera um cronograma em Json.

**Payload exemplo:**
```json
{
  "respondent_id": "WxNEXv",
  "nivel": "R1",
  "email": "alexandrehugo@me.com",
  "submitted_at": "2025-08-04 19:53:47",
  "respostas": {
    "Quais os seus objetivos com o curso RadioClub?": [
      "Melhorar interpretação de exames no dia a dia",
      "Complementar minha formação como residente de radiologia",
      "Me atualizar com as inovações e protocolos mais recentes",
      "Participar ativamente da comunidade profissional",
      "Praticar com casos reais e discussões clínicas"
    ],
    "Em qual hospital você faz/fez a residência?": "Mae de Deus",
    "Quais exames de imagem você já tem contato na prática ou vai ter nesse início de R1?": [
      "RX",
      "USG",
      "TC",
      "RM"
    ],
    "Quais exames de imagem sente mais dificuldade no momento?": "Tc /rm",
    "Quais subespecialidades você vai ter mais contato na Residência?": [
      "Neuro",
      "Tórax",
      "Musculoesquelético"
    ],
    "Quanto tempo, por semana, você consegue dedicar aos estudos com o RadioClub?": "Entre 3h e 4h",
    "numero_semanas": 12
  }
}
```
**Response exemplo (200):**

```json
{
  "semanas": 4,
  "itens": [
    {
      "semana": 1,
      "module_name": "Módulo de exemplo",
      "lesson_theme": "Tema da aula",
      "duration_min": 30
    }
  ],
  "resumo": {
    "total_minutos": 360,
    "minutos_por_semana": [90, 90, 90, 90]
  },
  "params": {
    "tempo_min_semana": 60,
    "tempo_max_semana": 120
  }
}

```

### 3. POST /cronograma/pdf
Gera o cronograma em PDF

Payload: igual ao do /cronograma.

Response: arquivo PDF (application/pdf).

O front deve tratar como download ou exibir em um viewer.

O header de resposta já vem com:

```bash
Content-Disposition: attachment; filename="cronograma_<email>.pdf"
```

### Exemplo cURL:

```bash
curl -X POST http://127.0.0.1:8000/cronograma/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "nivel": "R1",
    "email": "teste@radioclub.com",
    "respostas": {
      "Quanto tempo, por semana, você consegue dedicar aos estudos com o RadioClub?": "1h a 2h",
      "numero_semanas": 4
    }
  }' --output cronograma.pdf
```
---

## 📌 Notas para integração
Todos os endpoints aceitam/retornam JSON, exceto /cronograma/pdf que retorna binário (application/pdf).

CORS está liberado (*), permitindo chamadas diretas do browser/app.

O campo respostas deve conter as perguntas exatamente como definidas (ex.: "Quais exames você mais lauda/interpreta e tem contato no R1 atualmente?").
