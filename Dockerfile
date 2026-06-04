FROM python:3.11-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Capa 1: dependencias Python (raramente cambia)
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Capa 2: partes de la DB (nunca cambian) → se cachea sola
COPY db/proficy.part00 db/proficy.part01 db/proficy.part02 \
     db/proficy.part03 db/proficy.part04 db/proficy.part05 ./db/
RUN echo "Ensamblando DB..." && \
    cat db/proficy.part00 db/proficy.part01 db/proficy.part02 \
        db/proficy.part03 db/proficy.part04 db/proficy.part05 \
        > db/proficy.sqlite && \
    DB_SIZE=$(stat -c%s db/proficy.sqlite) && \
    echo "DB ensamblada: ${DB_SIZE} bytes" && \
    if [ "$DB_SIZE" -lt 400000000 ]; then \
        echo "ERROR: DB muy pequeña (${DB_SIZE} bytes)"; exit 1; \
    fi && \
    rm db/proficy.part0*

# Capa 3: código API (cambia frecuentemente → invalida solo esta capa)
COPY api/ ./api/

# Capa 4: React build y assets
COPY build/ ./build/
COPY public/ ./public/
COPY corpus_extra/ ./corpus_extra/

ENV PORT=5050

EXPOSE 5050

CMD ["python", "api/server.py"]
