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

RUN groupadd --system appgroup \
    && useradd --system --gid appgroup --home-dir /tmp --shell /usr/sbin/nologin appuser

ENV HOME=/tmp

COPY --from=builder /build/wheels /wheels
COPY --from=builder /build/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY --chown=appuser:appgroup . .

# Belt-and-suspenders: never ship a local .env into the runtime image.
# An empty SUPABASE_JWT_SECRET in a baked .env can confuse Settings; Cloud Run
# injects real secrets via process environment at runtime.
RUN find /app -maxdepth 1 -type f \( -name '.env' -o -name '.env.*' \) \
      ! -name '.env.example' -delete 2>/dev/null || true

USER appuser

# Cloud Run injects PORT; local default 8080.
EXPOSE 8080

# Default 1 worker for small instances. Raise WEB_CONCURRENCY when memory allows.
CMD ["sh", "-c", "gunicorn main:app --workers ${WEB_CONCURRENCY:-1} --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8080} --timeout 120"]