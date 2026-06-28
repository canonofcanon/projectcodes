import { getStore } from '@netlify/blobs';

// Shared key/value store for the registry. One blob per registry key
// (pcr:codes, pcr:clients, …). Values are JSON strings, mirroring the
// client's Store layer exactly, so no data reshaping is needed.

function guard(req) {
  // Optional shared-secret guard. If PCR_KEY is set in the site's
  // environment, the request must send a matching x-pcr-key header.
  // If PCR_KEY is unset, the endpoint is open (rely on Netlify site
  // password protection / obscurity instead).
  const required = process.env.PCR_KEY;
  if (!required) return true;
  return req.headers.get('x-pcr-key') === required;
}

export default async (req) => {
  if (!guard(req)) return new Response('unauthorized', { status: 401 });

  const store = getStore('dreamcoat-pcr');
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const key = url.searchParams.get('key');
    if (key) {
      const value = await store.get(key, { type: 'text' });
      return Response.json({ key, value: value ?? null });
    }
    // No key -> return everything (handy for backups/debugging)
    const { blobs } = await store.list();
    const out = {};
    for (const b of blobs) out[b.key] = await store.get(b.key, { type: 'text' });
    return Response.json(out);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    let body;
    try { body = await req.json(); } catch { return new Response('bad json', { status: 400 }); }
    const { key, value } = body || {};
    if (!key) return new Response('key required', { status: 400 });
    await store.set(key, value == null ? '' : String(value));
    return Response.json({ ok: true });
  }

  return new Response('method not allowed', { status: 405 });
};

export const config = { path: '/api/registry' };
