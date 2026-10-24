FROM python:3.12-slim-trixie
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng ffmpeg \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir pykakasi==2.3.0
WORKDIR /app
COPY server.py .
USER nobody
EXPOSE 3010
CMD ["python", "server.py"]
