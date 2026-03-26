import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
  summaryQuerySchema,
} from '@fintrack/shared/validators';
import type { AppEnv } from '../types/env';
import { ExpenseService } from '../services/expense.service';
import { NormalizationService } from '../services/normalization.service';
import { LogService } from '../services/log.service';

export const expenseRoutes = new Hono<AppEnv>()
  // ─── Create Expense ────────────────────────────────────────────────────
  .post('/', zValidator('json', createExpenseSchema), async (c) => {
    const userId = c.get('userId');
    const input = c.req.valid('json');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new ExpenseService(c.env.DB, normalization);
    const logger = new LogService(c.env.DB);

    const expense = await service.create(userId, input);

    c.executionCtx.waitUntil(
      logger.log(userId, 'expense.created', 'expense', expense.id, {
        totalAmount: expense.totalAmount,
        itemCount: expense.items.length,
      }),
    );

    return c.json({ data: expense }, 201);
  })

  // ─── List Expenses (must be before /:id to avoid conflict) ─────────────
  .get('/summary', zValidator('query', summaryQuerySchema), async (c) => {
    const userId = c.get('userId');
    const query = c.req.valid('query');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new ExpenseService(c.env.DB, normalization);

    const summary = await service.getSummary(
      userId,
      query.period,
      query.from,
      query.to,
      query.category_id,
    );

    return c.json({ data: summary });
  })

  .get('/', zValidator('query', listExpensesSchema), async (c) => {
    const userId = c.get('userId');
    const query = c.req.valid('query');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new ExpenseService(c.env.DB, normalization);

    const result = await service.list(userId, query);

    return c.json(result);
  })

  // ─── Get Single Expense ────────────────────────────────────────────────
  .get('/:id', async (c) => {
    const userId = c.get('userId');
    const expenseId = c.req.param('id');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new ExpenseService(c.env.DB, normalization);

    try {
      const expense = await service.getById(userId, expenseId);
      return c.json({ data: expense });
    } catch (err: any) {
      if (err.message === 'Not Found') {
        return c.json({ error: 'Expense not found' }, 404);
      }
      throw err;
    }
  })

  // ─── Update Expense ────────────────────────────────────────────────────
  .put('/:id', zValidator('json', updateExpenseSchema), async (c) => {
    const userId = c.get('userId');
    const expenseId = c.req.param('id');
    const input = c.req.valid('json');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new ExpenseService(c.env.DB, normalization);
    const logger = new LogService(c.env.DB);

    try {
      const expense = await service.update(userId, expenseId, input);

      c.executionCtx.waitUntil(
        logger.log(userId, 'expense.updated', 'expense', expenseId),
      );

      return c.json({ data: expense });
    } catch (err: any) {
      if (err.message === 'Not Found') {
        return c.json({ error: 'Expense not found' }, 404);
      }
      throw err;
    }
  })

  // ─── Delete Expense ────────────────────────────────────────────────────
  .delete('/:id', async (c) => {
    const userId = c.get('userId');
    const expenseId = c.req.param('id');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new ExpenseService(c.env.DB, normalization);
    const logger = new LogService(c.env.DB);

    try {
      await service.delete(userId, expenseId);

      c.executionCtx.waitUntil(
        logger.log(userId, 'expense.deleted', 'expense', expenseId),
      );

      return c.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Not Found') {
        return c.json({ error: 'Expense not found' }, 404);
      }
      throw err;
    }
  });
