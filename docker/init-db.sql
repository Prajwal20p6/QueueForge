-- ──────────────────────────────────────────────────────────────────────────────
-- Database Initial Seeding and Permissions Setup
-- ──────────────────────────────────────────────────────────────────────────────

-- Create secondary test database inside the same cluster if it does not exist
SELECT 'CREATE DATABASE queueforge_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'queueforge_test')\gexec

-- Grant all privileges to postgres superuser
GRANT ALL PRIVILEGES ON DATABASE queueforge TO postgres;
GRANT ALL PRIVILEGES ON DATABASE queueforge_test TO postgres;
