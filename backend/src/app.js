import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// Cross-Origin Resource Sharing
const configuredOrigins = (env.FRONTEND_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Localhost origins
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      // Check configured origins
      if (configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any Vercel deployment URL (*.vercel.app)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'idempotency-key'],
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Root Landing Endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Dumroo Feedback & Telemetry API',
    status: 'online',
    version: '1.0.0',
    healthCheck: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      auth: '/api/auth',
      feedback: '/api/feedback',
    },
    docs: 'https://github.com/keshavagr273/DumrooAI-Assignment',
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'feedback-system-backend',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;

