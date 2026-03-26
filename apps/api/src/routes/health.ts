import { Hono } from 'hono';
import type { AppEnv } from '../types/env';

export const healthRoutes = new Hono<AppEnv>().get('/', (c) => {
  return c.json({
    status: 'ok',
    env: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});
