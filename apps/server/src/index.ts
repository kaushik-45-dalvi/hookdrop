import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { apiRouter, webhookRouter } from './routes';
import { setupWebSocket } from './websocket';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = new Set([
  FRONTEND_URL,
  'http://localhost:3000',
  'https://hookdropp.vercel.app',
  'https://hookdrop-iota.vercel.app',
]);

// Trust proxy (for proper IP detection behind Nginx/load balancers)
app.set('trust proxy', 1);

// CORS for API routes — restricted to frontend origin
app.use('/api', cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.has(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:')
    ) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

// CORS for webhook routes — open to all origins (webhooks come from external services)
app.use('/h', cors({ origin: '*' }));

// Body parsing — raw text first to preserve original body
app.use('/h', express.raw({ type: '*/*', limit: '1mb' }));
app.use('/h', (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.body = req.body.toString('utf-8');
  }
  next();
});

// JSON and URL-encoded for API routes
app.use('/api', express.json({ limit: '1mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '1mb' }));

// Size limit error handler
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large (max 1MB)' });
    return;
  }
  next(err);
});

// Routes
app.use('/api', apiRouter);
app.use('/h', webhookRouter);

// Redirect root to frontend
app.get('/', (req, res) => {
  try {
    const host = req.headers.host || '';
    const frontendUrlParsed = new URL(FRONTEND_URL);
    if (host.toLowerCase() === frontendUrlParsed.host.toLowerCase()) {
      res.status(200).send('HookDropp Backend API is running. If you meant to view the frontend, please ensure your custom domain (hookdropp.vercel.app) is mapped to your frontend Next.js "web" project on Vercel, not the backend "hookdrop" project.');
      return;
    }
  } catch (e) {
    console.error('Error parsing FRONTEND_URL:', e);
  }
  res.redirect(FRONTEND_URL);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║   🪝  HookDropp Server                ║
  ║                                       ║
  ║   API:  http://localhost:${PORT}        ║
  ║   WS:   ws://localhost:${PORT}/ws/:slug ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
