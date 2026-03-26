import { drizzle } from 'drizzle-orm/d1';
import { logs } from '@fintrack/shared/schema';
import { generateId } from '../utils/id';

export class LogService {
  private db;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async log(
    userId: string | null,
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.insert(logs).values({
        id: generateId(),
        userId,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    } catch (err) {
      // Fire-and-forget — don't let logging failures break the request
      console.error('Failed to write audit log:', err);
    }
  }
}
