import { createMiddleware } from 'hono/factory';
import { verifyToken } from '@clerk/backend';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '@fintrack/shared/schema';
import type { AppEnv } from '../types/env';

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    const userId = payload.sub;
    c.set('userId', userId);

    // Ensure user exists in our DB (upsert on first request)
    const db = drizzle(c.env.DB);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing) {
      await db.insert(users).values({
        id: userId,
        email: (payload as any).email ?? `${userId}@clerk.user`,
        name: (payload as any).name ?? null,
      });
    }

    await next();
  } catch (err: any) {
    if (err.message?.includes('SQLITE')) {
      // DB error during user upsert — don't block auth
      console.error('User upsert failed:', err);
      await next();
      return;
    }
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
