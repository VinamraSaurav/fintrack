import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types/env';

export const loggerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const userId = c.get('userId') ?? 'anonymous';

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      method,
      path,
      status,
      duration,
      userId,
      env: c.env.ENVIRONMENT,
    }),
  );
});
