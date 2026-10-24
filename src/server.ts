import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { swaggerDocument } from './config/swagger.js';
import { getSwaggerHtml } from './config/swaggerHtml.js';

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// High payload limit for rich canvas & exported meme sync
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// Swagger API Documentation Setup (Vercel & Serverless Compatible)
// -------------------------------------------------------------
const renderSwaggerDocs = (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(getSwaggerHtml());
};

const sendSwaggerJson = (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerDocument);
};

// Swagger UI Routes (with & without trailing slashes)
app.get(['/api-docs', '/api-docs/', '/api/v1/docs', '/api/v1/docs/'], renderSwaggerDocs);

// Raw OpenAPI JSON spec endpoints
app.get(['/api-docs.json', '/api/v1/docs.json'], sendSwaggerJson);

// CDN redirects for any cached or legacy static requests under /api-docs/
app.get(['/api-docs/swagger-ui-bundle.js', '/api/v1/docs/swagger-ui-bundle.js'], (_req: Request, res: Response) => {
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.min.js');
});
app.get(['/api-docs/swagger-ui-standalone-preset.js', '/api/v1/docs/swagger-ui-standalone-preset.js'], (_req: Request, res: Response) => {
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.js');
});
app.get(['/api-docs/swagger-ui.css', '/api/v1/docs/swagger-ui.css'], (_req: Request, res: Response) => {
  res.redirect('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css');
});
app.get(['/api-docs/swagger-ui-init.js', '/api/v1/docs/swagger-ui-init.js'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send('/* Handled by MemeHub CDN Swagger UI */');
});

// Mount API v1 router
app.use('/api/v1', apiRouter);

// Root Welcome Endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'MemeHub Backend API Server',
    version: '1.0.0',
    documentation: '/api-docs',
    apiDocs: '/api/v1/docs',
    status: 'online',
  });
});

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server. Visit /api-docs for API documentation.`,
    },
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal error occurred.',
    },
  });
});

export default app;
