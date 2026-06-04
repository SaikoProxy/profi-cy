FROM python:3.11-slim

# Instalar git y git-lfs para descargar la DB
RUN apt-get update && apt-get install -y git git-lfs curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Si la DB es un puntero LFS (archivo pequeño), descargarla
RUN if [ $(stat -c%s db/proficy.sqlite 2>/dev/null || echo 0) -lt 1000 ]; then \
      echo "DB parece puntero LFS, intentando descargar..."; \
      git lfs pull 2>/dev/null || echo "LFS pull falló, continuando"; \
    else \
      echo "DB OK: $(stat -c%s db/proficy.sqlite) bytes"; \
    fi

ENV PORT=5050

EXPOSE 5050

CMD ["python", "api/server.py"]
