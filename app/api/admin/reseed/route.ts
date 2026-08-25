import { reseedProductStore } from '@/db/products';

export async function POST(req: Request) {
  // Guard: only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not allowed', { status: 403 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get('key') || process.env.DEV_RESEED_KEY || 'dev-reseed-key';
  const provided = url.searchParams.get('token') || '';
  if (provided !== key) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await reseedProductStore();
    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response(String(err ?? 'error'), { status: 500 });
  }
}
