// Server-side proxy for the "Ask Claude" tab so the API key never
// touches the browser. Set ANTHROPIC_API_KEY in the site's environment
// to enable it; leave it unset and the Ask tab hides itself automatically.

export default async (req) => {
  const key = process.env.ANTHROPIC_API_KEY;

  // Capability probe used by the client on load.
  if (req.method === 'GET') return Response.json({ enabled: !!key });

  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!key) return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });

  const body = await req.text(); // {model, max_tokens, system, messages}
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body
  });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { 'content-type': 'application/json' } });
};

export const config = { path: '/api/ask' };
