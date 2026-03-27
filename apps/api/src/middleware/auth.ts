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
      const email = (payload as any).email ?? `${userId}@clerk.user`;
      const firstName = (payload as any).firstName ?? '';
      const lastName = (payload as any).lastName ?? '';
      const name = [firstName, lastName].filter(Boolean).join(' ') || null;

      await db.insert(users).values({ id: userId, email, name });
    } else {
      // Update email/name if JWT has newer data
      const email = (payload as any).email;
      const firstName = (payload as any).firstName ?? '';
      const lastName = (payload as any).lastName ?? '';
      const name = [firstName, lastName].filter(Boolean).join(' ') || null;

      if (email && email !== `${userId}@clerk.user`) {
        await db.update(users).set({
          email,
          name,
          updatedAt: new Date().toISOString(),
        }).where(eq(users.id, userId));
      }
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
