import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { createCategorySchema } from '@fintrack/shared/validators';
import type { AppEnv } from '../types/env';
import { CategoryService } from '../services/category.service';

const subcategorySchema = z.object({ name: z.string().min(1).max(100) });

export const categoryRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const userId = c.get('userId');
    const service = new CategoryService(c.env.DB);
    const categories = await service.list(userId);
    return c.json({ data: categories });
  })

  .post('/', zValidator('json', createCategorySchema), async (c) => {
    const userId = c.get('userId');
    const input = c.req.valid('json');
    const service = new CategoryService(c.env.DB);
    const category = await service.create(userId, input);
    return c.json({ data: category }, 201);
  })

  .put('/:id', zValidator('json', createCategorySchema.partial()), async (c) => {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');
    const input = c.req.valid('json');
    const service = new CategoryService(c.env.DB);
    try {
      const category = await service.update(userId, categoryId, input);
      return c.json({ data: category });
    } catch (err: any) {
      if (err.message === 'Not Found') return c.json({ error: 'Category not found' }, 404);
      if (err.message.includes('default')) return c.json({ error: err.message }, 403);
      throw err;
    }
  })

  .delete('/:id', async (c) => {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');
    const force = c.req.query('force') === 'true';
    const service = new CategoryService(c.env.DB);
    try {
      await service.delete(userId, categoryId, force);
      return c.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Not Found') return c.json({ error: 'Category not found' }, 404);
      if (err.message.includes('default')) return c.json({ error: err.message }, 403);
      if (err.message.startsWith('LINKED:')) {
        return c.json({ error: err.message.replace('LINKED:', ''), requireConfirm: true }, 409);
      }
      throw err;
    }
  })

  // ─── Subcategories ──────────────────────────────────────────────────────────

  .post('/:id/subcategories', zValidator('json', subcategorySchema), async (c) => {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');
    const { name } = c.req.valid('json');
    const service = new CategoryService(c.env.DB);
    const sub = await service.createSubcategory(userId, categoryId, name);
    return c.json({ data: sub }, 201);
  })

  .put('/subcategories/:subId', zValidator('json', subcategorySchema), async (c) => {
    const userId = c.get('userId');
    const subId = c.req.param('subId');
    const { name } = c.req.valid('json');
    const service = new CategoryService(c.env.DB);
    try {
      await service.updateSubcategory(userId, subId, name);
      return c.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Not Found') return c.json({ error: 'Subcategory not found' }, 404);
      throw err;
    }
  })

  .delete('/subcategories/:subId', async (c) => {
    const userId = c.get('userId');
    const subId = c.req.param('subId');
    const force = c.req.query('force') === 'true';
    const service = new CategoryService(c.env.DB);
    try {
      await service.deleteSubcategory(userId, subId, force);
      return c.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Not Found') return c.json({ error: 'Subcategory not found' }, 404);
      if (err.message.startsWith('LINKED:')) {
        return c.json({ error: err.message.replace('LINKED:', ''), requireConfirm: true }, 409);
      }
      throw err;
    }
  });
