import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types/env';
import { authMiddleware } from './middleware/auth';
import { loggerMiddleware } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './routes/health';
import { expenseRoutes } from './routes/expenses';
import { categoryRoutes } from './routes/categories';
import { searchRoutes } from './routes/search';
import { insightRoutes } from './routes/insights';
import { budgetRoutes } from './routes/budgets';
import { incomeRoutes } from './routes/incomes';

const app = new Hono<AppEnv>();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use('*', (c, next) => {
  const corsMiddleware = cors({
    origin: [c.env.CORS_ORIGIN, 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

app.use('*', loggerMiddleware);
app.onError(errorHandler);

// ─── Public Routes ───────────────────────────────────────────────────────────

app.route('/health', healthRoutes);

// ─── Protected Routes ────────────────────────────────────────────────────────

app.use('/api/*', authMiddleware);
app.route('/api/expenses', expenseRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/insights', insightRoutes);
app.route('/api/budgets', budgetRoutes);
app.route('/api/incomes', incomeRoutes);

// ─── 404 Fallback ────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// ─── Export ──────────────────────────────────────────────────────────────────

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: AppEnv['Bindings'], ctx: ExecutionContext) {
    const { ReminderService } = await import('./services/reminder.service');
    const service = new ReminderService(env);
    ctx.waitUntil(service.processMonthlyReminders());
  },
};
