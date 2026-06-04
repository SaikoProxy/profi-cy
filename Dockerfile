FROM python:3.11-slim

# cache-bust: 2026-06-04-v3
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Unir las partes de la DB en proficy.sqlite
RUN echo "Uniendo partes de la DB..." && \
    cat db/proficy.part00 \
        db/proficy.part01 \
        db/proficy.part02 \
        db/proficy.part03 \
        db/proficy.part04 \
        db/proficy.part05 \
        > db/proficy.sqlite && \
    DB_SIZE=$(stat -c%s db/proficy.sqlite) && \
    echo "DB ensamblada: ${DB_SIZE} bytes" && \
    if [ "$DB_SIZE" -lt 400000000 ]; then \
        echo "ERROR: DB demasiado pequeña (${DB_SIZE} bytes)"; \
        exit 1; \
    fi && \
    rm db/proficy.part0*

ENV PORT=5050

EXPOSE 5050

CMD ["python", "api/server.py"]
