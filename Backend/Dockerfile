FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Dependências do sistema (se precisar de algo como libpq-dev, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar deps Python
COPY Backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY Backend /app

# Expor porta do FastAPI
EXPOSE 8000

# Comando de start
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
