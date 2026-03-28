import { auth } from '@clerk/nextjs/server';

const API_BASE = process.env.API_URL ?? 'http://localhost:8787';

export async function GET(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return Response.json({ error: 'Query is required' }, { status: 400 });
  }

  const token = await getToken();
  const upstream = await fetch(`${API_BASE}/api/search/normalize?${new URLSearchParams({ q })}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });

  const body = await upstream.json().catch(() => ({ error: 'Request failed' }));
  return Response.json(body, { status: upstream.status });
}
