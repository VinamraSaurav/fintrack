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
        await this.sendEmail(user.email, user.name ?? 'User', summary);
      } catch (err) {
        console.error(`Failed to send reminder to ${user.email}:`, err);
      }
    }
  }

  private async sendEmail(
    email: string,
    name: string,
    summary: Awaited<ReturnType<InsightService['getMonthlySummary']>>,
  ): Promise<void> {
    const changeDirection = summary.changePercent >= 0 ? 'up' : 'down';
    const changeAbs = Math.abs(summary.changePercent);

    const subject = 'Your Monthly FinVerse Summary';
    const html = `
      <h2>Hi ${name},</h2>
      <p>Here's your monthly spending summary:</p>
      <ul>
        <li><strong>This month:</strong> ₹${summary.currentMonth.total.toLocaleString()} (${summary.currentMonth.count} expenses)</li>
        <li><strong>Last month:</strong> ₹${summary.previousMonth.total.toLocaleString()} (${summary.previousMonth.count} expenses)</li>
        <li><strong>Change:</strong> ${changeDirection} ${changeAbs}%</li>
        <li><strong>Top category:</strong> ${summary.currentMonth.topCategory}</li>
      </ul>
      <p>Log in to FinVerse for detailed insights.</p>
    `;

    // Try Brevo first (allows sending from personal email), fall back to Resend
    if (this.env.BREVO_API_KEY) {
      await this.sendViaBrevo(email, name, subject, html);
    } else if (this.env.RESEND_API_KEY) {
      await this.sendViaResend(email, subject, html);
    } else {
      console.warn('No email API key configured, skipping email');
    }
  }

  private async sendViaBrevo(to: string, toName: string, subject: string, html: string) {
    const fromEmail = this.env.EMAIL_FROM ?? 'vinamrasaurav1715@gmail.com';
    const fromName = 'FinVerse';

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });
  }

  private async sendViaResend(to: string, subject: string, html: string) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FinVerse <onboarding@resend.dev>',
        to: [to],
        subject,
        htmlContent: html,
      }),
    });
  }
}
