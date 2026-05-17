require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const certificateRoutes = require('./routes/certificates');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

if (!process.env.JWT_SECRET) {
  console.error('[SERVER] Missing JWT_SECRET environment variable');
  process.exit(1);
}

// ===== CORS CONFIGURATION =====
// Log environment setup
console.log('[SERVER] Environment:', { NODE_ENV, PORT, LOG_LEVEL });
console.log('[SERVER] Frontend URL:', process.env.FRONTEND_URL);
console.log('[SERVER] Frontend URL Dev:', process.env.FRONTEND_URL_DEV);

const frontendUrls = NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [process.env.FRONTEND_URL, process.env.FRONTEND_URL_DEV || 'http://localhost:5173'].filter(Boolean);

console.log('[CORS] Allowed origins:', frontendUrls);

const allowNoOrigin = NODE_ENV !== 'production';

if (NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('[SERVER] Missing FRONTEND_URL environment variable in production');
  process.exit(1);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      if (allowNoOrigin) {
        return callback(null, true);
      }
      console.warn('[CORS] Missing origin denied in production');
      return callback(new Error('CORS origin denied: missing origin'));
    }

    if (frontendUrls.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origin denied: ${origin}`);
    callback(new Error(`CORS origin denied: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400, // 24 hours
};

// ===== SECURITY MIDDLEWARE =====
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  if (LOG_LEVEL === 'debug') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
      origin: req.headers.origin || 'none',
      userAgent: req.headers['user-agent']?.substring(0, 50),
    });
  }
  
  // Log request body (mask sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && LOG_LEVEL === 'debug') {
    console.log('[BODY]', {
      ...req.body,
      password: req.body?.password ? '***' : undefined,
      password_hash: req.body?.password_hash ? '***' : undefined,
    });
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    console.log(`[${res.statusCode}] ${req.method} ${req.originalUrl} (${duration}ms)`);
    return originalSend.call(this, data);
  };
  
  next();
});

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many auth attempts, please try again in 15 minutes' },
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Don't leak error details in production
  const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(err.status || 500).json({ error: message });
});

// ===== START SERVER =====
const START_PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = (port, attempt = 0) => {
  const server = app.listen(port, () => {
    console.log(`[SERVER] Running on port ${port}`);
    console.log(`[SERVER] Health check: http://localhost:${port}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 5) {
      const nextPort = port + 1;
      console.warn(`[SERVER] Port ${port} is in use, trying ${nextPort}...`);
      startServer(nextPort, attempt + 1);
    } else {
      console.error('[SERVER] Failed to start:', err);
      process.exit(1);
    }
  });
};

startServer(START_PORT);
