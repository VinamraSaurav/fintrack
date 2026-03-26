import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '../types/env';
import { SearchService } from '../services/search.service';
import { NormalizationService } from '../services/normalization.service';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

const suggestQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().positive().max(10).optional().default(5),
});

export const searchRoutes = new Hono<AppEnv>()
  .get('/', zValidator('query', searchQuerySchema), async (c) => {
    const userId = c.get('userId');
    const { q, limit } = c.req.valid('query');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new SearchService(c.env.DB, normalization);

    const results = await service.searchExpenses(userId, q, limit);
    return c.json({ data: results });
  })

  .get('/items', zValidator('query', searchQuerySchema), async (c) => {
    const userId = c.get('userId');
    const { q } = c.req.valid('query');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new SearchService(c.env.DB, normalization);

    const results = await service.searchByProduct(userId, q);
    return c.json({ data: results });
  })

  .get('/suggest', zValidator('query', suggestQuerySchema), async (c) => {
    const { q, limit } = c.req.valid('query');

    const normalization = new NormalizationService(c.env.DB, c.env.VECTORIZE, c.env.AI);
    const service = new SearchService(c.env.DB, normalization);

    const suggestions = await service.suggest(q, limit);
    return c.json({ data: suggestions });
  });
