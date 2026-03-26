import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '../types/env';
import { IncomeService } from '../services/income.service';

const createIncomeSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  income_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().max(100).optional(),
  is_recurring: z.boolean().optional(),
  note: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
});

const listQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const incomeRoutes = new Hono<AppEnv>()
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const userId = c.get('userId');
    const { from, to } = c.req.valid('query');
    const service = new IncomeService(c.env.DB);
    const incomes = await service.list(userId, from, to);
    return c.json({ data: incomes });
  })

  .post('/', zValidator('json', createIncomeSchema), async (c) => {
    const userId = c.get('userId');
    const input = c.req.valid('json');
    const service = new IncomeService(c.env.DB);
    const income = await service.create(userId, input);
    return c.json({ data: income }, 201);
  })

  .delete('/:id', async (c) => {
    const userId = c.get('userId');
    const incomeId = c.req.param('id');
    const service = new IncomeService(c.env.DB);
    try {
      await service.delete(userId, incomeId);
      return c.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Not Found') return c.json({ error: 'Income not found' }, 404);
      throw err;
    }
  });
