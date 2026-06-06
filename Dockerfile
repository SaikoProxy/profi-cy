FROM python:3.11-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Capa 1: dependencias Python
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# La DB (proficy.sqlite) ya NO va en la imagen: vive en el Railway Volume (/app/db)

# Capa 2: codigo API
COPY api/ ./api/

# Capa 3: React build y assets
COPY build/ ./build/
COPY public/ ./public/
COPY corpus_extra/ ./corpus_extra/

ENV PORT=5050
EXPOSE 5050
CMD ["python", "api/server.py"]