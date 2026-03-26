import type { ErrorHandler } from 'hono';
import type { AppEnv } from '../types/env';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get('requestId') ?? 'unknown';

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      error: err.message,
      stack: err.stack,
    }),
  );

  if (err.message === 'Not Found') {
    return c.json({ error: 'Not Found' }, 404);
  }

  return c.json(
    {
      error: 'Internal Server Error',
      requestId,
    },
    500,
  );
};
