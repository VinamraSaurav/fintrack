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

    const db = drizzle(c.env.DB);

    // Extract claims — Clerk puts custom claims at top level of JWT payload
    const claims = payload as Record<string, any>;
    const email = claims.email || claims.primary_email_address || null;
    const firstName = claims.firstName || claims.first_name || '';
    const lastName = claims.lastName || claims.last_name || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || null;

    const [existing] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing) {
      await db.insert(users).values({
        id: userId,
        email: email ?? `${userId}@clerk.user`,
        name,
      });
    } else if (email && existing.email !== email) {
      // Update if we have a real email that differs from stored
      await db.update(users).set({
        email,
        ...(name && { name }),
        updatedAt: new Date().toISOString(),
      }).where(eq(users.id, userId));
    }

    await next();
  } catch (err: any) {
    if (err.message?.includes('SQLITE')) {
      console.error('User upsert failed:', err);
      await next();
      return;
    }
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
