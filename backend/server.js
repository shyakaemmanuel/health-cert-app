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

const frontendUrls = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_DEV || 'http://localhost:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || frontendUrls.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS origin denied: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.originalUrl} origin=${req.headers.origin || 'none'}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('[API] request body:', {
        ...req.body,
        password: req.body?.password ? '***' : undefined,
      });
    }
  }
  next();
});

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests' } });
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many auth attempts' } });
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const START_PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = (port, attempt = 0) => {
  const server = app.listen(port, () => console.log(`Server running on port ${port}`));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 5) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying port ${nextPort} instead...`);
      startServer(nextPort, attempt + 1);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
};

startServer(START_PORT);
