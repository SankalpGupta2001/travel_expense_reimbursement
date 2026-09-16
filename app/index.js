import express from 'express';
import compression from 'compression';
import cors from 'cors';

import appRouter from './routes/api.js';
import authRouter from './routes/auth.routes.js';
import travelRequestRouter from './routes/travel-request.routes.js';
import approvalRouter from './routes/approval.routes.js';
import financeRouter from './routes/finance.routes.js';
import payoutRouter from './routes/payout.routes.js';

const app = express();

const startApp = async () => {
  app.use(
    cors()
  );

  app.use(
    express.json({
      limit: '100mb',
    })
  );

  app.use(
    compression({
      level: 6,
      threshold: 1024,
    })
  );

  app.use(
    '/',
    authRouter
  );

app.use(
  '/',
  travelRequestRouter
);

app.use(
    '/',
    approvalRouter
  );

  app.use(
    '/',
    financeRouter
  );

  app.use(
    '/',
    payoutRouter
  );

  app.use(
    '/',
    appRouter
  );

  app.get(
    '/',
    (req, res) => {
      res.send(
        'AI Agent Travel'
      );
    }
  );

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  app.use((error, req, res, next) => {
    console.error('API error:', error);

    if (res.headersSent) {
      return next(error);
    }

    const statusCode =
      Number(error.statusCode || error.status) || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  });
};

startApp();

export default app;