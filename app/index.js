import createError from 'http-errors';
import express from 'express';
import appRouter from './routes/api.js';
import compression from 'compression';
import cors from 'cors';

const app = express();
const startApp = async () => {
  app.use(cors());

  app.use(express.json({
    limit: '100mb',
  }));

  // Use compression middleware with options
  app.use(compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // Minimum size in bytes for compression
  }));

  app.use('/', appRouter);
  app.get('/', (req, res) => {
    res.send('AI Agent Travel');
  });

  // app.use((req, res, next) => next(createError(404)));
  app.use((req, res, next) => {
    res.status(404).send('Sorry, can\'t find that!');
  });
};

startApp();
export default app;
