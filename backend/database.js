const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'health_cert.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    certificate_type TEXT NOT NULL,
    issued_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    issuer TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
    qr_code_data TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'basic', 'premium')),
    max_certificates INTEGER NOT NULL DEFAULT 5,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS verification_logs (
    id TEXT PRIMARY KEY,
    certificate_id TEXT,
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    result TEXT NOT NULL CHECK(result IN ('valid', 'invalid', 'expired', 'revoked')),
    ip_address TEXT,
    FOREIGN KEY (certificate_id) REFERENCES certificates(id)
  );
`);

module.exports = db;
