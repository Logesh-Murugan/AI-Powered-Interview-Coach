-- Setup script for InterviewMaster AI database
-- Run this with: psql -U postgres -f setup_postgres.sql

-- Create database
CREATE DATABASE interviewmaster;

-- Create user
CREATE USER "user" WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO "user";

-- Connect to the database
\c interviewmaster

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO "user";

-- Display success message
\echo 'Database setup complete!'
\echo 'Connection string: postgresql://user:password@localhost:5432/interviewmaster'
