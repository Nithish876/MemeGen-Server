import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/index.js';
import { swaggerDocument } from './config/swagger.js';

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
// Swagger API Documentation Setup
// -------------------------------------------------------------
const swaggerOptions = {
  customSiteTitle: 'MemeHub REST API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #071330; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info { margin: 24px 0; }
    .swagger-ui .info .title { color: #0284c7; }
    .swagger-ui .btn.authorize { background-color: #0284c7; color: #fff; border-color: #0284c7; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
  },
};

// Serve Swagger UI at both /api-docs and /api/v1/docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Raw OpenAPI JSON spec endpoint
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
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
