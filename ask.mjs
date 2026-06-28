// Dreamcoat AI — server proxy for the Project Code Registry.
//
// The browser never sees the Anthropic API key. It lives only in the
// ANTHROPIC_API_KEY environment variable on Netlify. The page posts
// { model, max_tokens, system, messages } to /api/ask, and this function
// forwards that to Anthropic and returns the raw response (which contains
// a `content` array the page knows how to read).

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_CAP = 1500;

export default async (req) => {
  const key = process.env.ANTHROPIC_API_KEY;

  // GET = availability probe. The page calls this on load to decide whether
  // to show the assistant as connected.
  if (req.method === "GET") {
    return Response.json({ enabled: !!key });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  // No key set yet: answer gracefully so the popup shows a friendly notice
  // instead of an error.
  if (!key) {
    return Response.json({
      content: [{
        type: "text",
        text: "Dreamcoat AI isn't connected yet — the ANTHROPIC_API_KEY environment variable isn't set on the server.",
      }],
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const payload = {
    model: body.model || DEFAULT_MODEL,
    max_tokens: Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CAP),
    messages: Array.isArray(body.messages) ? body.messages : [],
  };
  if (body.system) payload.system = body.system;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    return Response.json(data, { status: resp.status });
  } catch (e) {
    return Response.json({
      content: [{
        type: "text",
        text: "Dreamcoat AI is unavailable right now. Please try again in a moment.",
      }],
    }, { status: 502 });
  }
};

export const config = { path: "/api/ask" };
