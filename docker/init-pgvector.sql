-- Enables the pgvector extension on first DB init.
-- This file is mounted into Postgres at /docker-entrypoint-initdb.d/ and runs
-- only the first time the data volume is empty.
CREATE EXTENSION IF NOT EXISTS vector;
