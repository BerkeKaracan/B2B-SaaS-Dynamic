FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    FORWARDED_ALLOW_IPS=* \
    WEB_CONCURRENCY=1

WORKDIR /app

RUN addgroup --system appgroup && adduser --system --group appuser

COPY --from=builder /build/wheels /wheels
COPY --from=builder /build/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

# Default 1 worker for small instances (Render / small ECS). Raise WEB_CONCURRENCY when memory allows.
CMD ["sh", "-c", "gunicorn main:app --workers ${WEB_CONCURRENCY:-1} --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120"]