#!/bin/bash
set -e

# Wait for Postgres to accept connections.
until pg_isready -h db -p 5432 -U postgres >/dev/null 2>&1; do
  echo "Waiting for database..."
  sleep 1
done

# Ensure pgvector exists (idempotent — safe to run every boot).
PGPASSWORD=postgres psql -h db -U postgres -d SkillHub \
  -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null

# Apply migrations.
npx prisma migrate deploy

exec "$@"
