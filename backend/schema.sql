-- Mini Postman Database Schema
-- SQLite Database

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Requests table for storing saved requests
CREATE TABLE IF NOT EXISTS api_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  headers TEXT,  -- JSON string
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Index for faster queries on user requests
CREATE INDEX IF NOT EXISTS idx_user_requests ON api_requests(user_id);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);