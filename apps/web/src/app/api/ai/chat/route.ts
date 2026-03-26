import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { auth } from '@clerk/nextjs/server';

const API_BASE = process.env.API_URL ?? 'http://localhost:8787';

async function fetchFromAPI(path: string, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { messages } = await req.json();

  // Get Clerk session token to call our backend
  // Note: In production, use a service-to-service token
  const token = req.headers.get('Authorization')?.slice(7) ?? '';

  const [summary, recent] = await Promise.all([
    fetchFromAPI('/api/insights/summary', token),
    fetchFromAPI('/api/expenses?limit=20', token),
  ]);

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: `You are FinVerse AI, a personal finance assistant. Answer questions about the user's spending based on this data:

Monthly Summary: ${JSON.stringify(summary?.data ?? {})}
Recent Expenses: ${JSON.stringify(recent?.data ?? [])}

Today's date: ${new Date().toISOString().split('T')[0]}
Currency: INR

Be concise. Use actual numbers from the data. Format currency amounts with the Indian Rupee symbol. If you cannot answer from the data provided, say so.`,
    messages,
  });

  return result.toDataStreamResponse();
}
