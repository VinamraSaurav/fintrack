import { drizzle } from 'drizzle-orm/d1';
import { users } from '@fintrack/shared/schema';
import { InsightService } from './insight.service';
import type { Bindings } from '../types/env';

export class ReminderService {
  private db;
  private insightService;

  constructor(private env: Bindings) {
    this.db = drizzle(env.DB);
    this.insightService = new InsightService(env.DB);
  }

  async processMonthlyReminders(): Promise<void> {
    const allUsers = await this.db.select().from(users);

    for (const user of allUsers) {
      try {
        const summary = await this.insightService.getMonthlySummary(user.id);
        await this.sendReminderEmail(user.email, user.name ?? 'User', summary);
      } catch (err) {
        console.error(`Failed to send reminder to ${user.email}:`, err);
      }
    }
  }

  private async sendReminderEmail(
    email: string,
    name: string,
    summary: Awaited<ReturnType<InsightService['getMonthlySummary']>>,
  ): Promise<void> {
    if (!this.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set, skipping email');
      return;
    }

    const changeDirection = summary.changePercent >= 0 ? 'up' : 'down';
    const changeAbs = Math.abs(summary.changePercent);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FinVerse <noreply@fintrack.app>',
        to: [email],
        subject: `Your Monthly FinVerse Summary`,
        html: `
          <h2>Hi ${name},</h2>
          <p>Here's your monthly spending summary:</p>
          <ul>
            <li><strong>This month:</strong> ₹${summary.currentMonth.total.toLocaleString()} (${summary.currentMonth.count} expenses)</li>
            <li><strong>Last month:</strong> ₹${summary.previousMonth.total.toLocaleString()} (${summary.previousMonth.count} expenses)</li>
            <li><strong>Change:</strong> ${changeDirection} ${changeAbs}%</li>
            <li><strong>Top category:</strong> ${summary.currentMonth.topCategory}</li>
          </ul>
          <p>Log in to FinVerse for detailed insights.</p>
        `,
      }),
    });
  }
}
