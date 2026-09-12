FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app
COPY alembic/ ./alembic
COPY alembic.ini ./alembic.ini
COPY .env.example ./\.env.example

# Run the API as an unprivileged user.
RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin dacexy && chown -R dacexy:dacexy /app
USER dacexy

ENV PYTHONUNBUFFERED=1
ENV AUTO_CREATE_DB=false
ENV DATABASE_URL=postgresql://user:pass@db:5432/dacexy

CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
