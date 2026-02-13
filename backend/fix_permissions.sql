-- Fix PostgreSQL 18 permissions for user
-- Run this as the postgres superuser:
-- psql -U postgres -d interviewmaster -f fix_permissions.sql

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "user";

-- Success message
\echo 'Permissions granted successfully!'
\echo 'You can now run: alembic upgrade head'
