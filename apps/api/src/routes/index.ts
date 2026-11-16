import { Router } from 'express';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    data: { status: 'ok' },
    meta: { timestamp: new Date().toISOString() },
  });
});
