import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '../types/env';
import { BudgetService } from '../services/budget.service';

const createBudgetSchema = z.object({
  category_id: z.string().optional(),
  monthly_limit: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$|^recurring$/),
});

const progressQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const budgetRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const userId = c.get('userId');
    const service = new BudgetService(c.env.DB);
    const budgets = await service.list(userId);
    return c.json({ data: budgets });
  })

  .post('/', zValidator('json', createBudgetSchema), async (c) => {
    const userId = c.get('userId');
    const input = c.req.valid('json');
    const service = new BudgetService(c.env.DB);
    const budget = await service.create(userId, input);
    return c.json({ data: budget }, 201);
  })

  .get('/progress', zValidator('query', progressQuerySchema), async (c) => {
    const userId = c.get('userId');
    const { month } = c.req.valid('query');
    const service = new BudgetService(c.env.DB);
    const progress = await service.getProgress(userId, month);
    return c.json({ data: progress });
  })

  .delete('/:id', async (c) => {
    const userId = c.get('userId');
    const budgetId = c.req.param('id');
    const service = new BudgetService(c.env.DB);
    try {
      await service.delete(userId, budgetId);
      return c.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Not Found') return c.json({ error: 'Budget not found' }, 404);
      throw err;
    }
  });
