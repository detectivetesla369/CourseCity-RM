-- CourseCity 1.0 PostgreSQL Initialization Script
-- Enables required cryptographic, UUID, and full-text search extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verification notice
DO $$
BEGIN
  RAISE NOTICE 'CourseCity database extensions initialized successfully.';
END $$;
