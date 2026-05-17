require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

console.log('[DATABASE] Initializing PostgreSQL connection');
console.log('[DATABASE] URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected pool error:', err);
});

pool.on('connect', () => {
  console.log('[DATABASE] Connection established');
});

// Test connection
pool.query('SELECT NOW();')
  .then(() => {
    console.log('[DATABASE] ✓ Connection verified');
  })
  .catch((err) => {
    console.error('[DATABASE] ✗ Connection test failed:', err.message);
  });

const createTables = async () => {
  try {
    console.log('[DATABASE] Creating tables if they do not exist...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'basic', 'premium')),
        max_certificates INTEGER NOT NULL DEFAULT 5,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS certificates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        certificate_type TEXT NOT NULL,
        issued_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        issuer TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
        qr_code_data TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS verification_logs (
        id TEXT PRIMARY KEY,
        certificate_id TEXT,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        result TEXT NOT NULL CHECK(result IN ('valid', 'invalid', 'expired', 'revoked')),
        ip_address TEXT,
        FOREIGN KEY (certificate_id) REFERENCES certificates(id)
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_logs_certificate_id ON verification_logs(certificate_id);
    `);
    
    console.log('[DATABASE] ✓ Tables created successfully');
  } catch (err) {
    console.error('[DATABASE] ✗ Failed to create tables:', err);
    throw err;
  }
};

// Initialize tables on startup
createTables().catch((err) => {
  console.error('[DATABASE] Startup error:', err);
  process.exit(1);
});

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.LOG_LEVEL === 'debug') {
        console.log('[DATABASE] Query completed:', { duration, rows: result.rows.length });
      }
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      console.error('[DATABASE] Query error:', { duration, error: err.message });
      throw err;
    }
  },
  pool,
};
