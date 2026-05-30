/**
 * Waitlist signup — forwards to a webhook you configure (zero extra npm deps).
 *
 * Required env (production):
 *   WAITLIST_WEBHOOK_URL — HTTPS endpoint that accepts POST JSON, e.g.:
 *     • Zapier / Make / n8n catch hook
 *     • Slack incoming webhook (map fields in your automation)
 *     • Airtable automation webhook
 *     • Formspree-style form endpoint
 *
 * Payload shape:
 *   { email: string, source: string, timestamp: string, name?: string }
 *
 * If WAITLIST_WEBHOOK_URL is unset, GET returns { configured: false } and POST
 * returns 503 so the UI shows “Waitlist opening soon” without breaking the site.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isConfigured() {
  return Boolean(process.env.WAITLIST_WEBHOOK_URL?.trim());
}

export async function GET() {
  return Response.json({ configured: isConfigured() });
}

export async function POST(request: Request) {
  let body: { email?: string; name?: string; source?: string };
  try {
    body = (await request.json()) as { email?: string; name?: string; source?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const source = body.source?.trim() || "unknown";
  const name = body.name?.trim();

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (name && name.length < 2) {
    return Response.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  const webhook = process.env.WAITLIST_WEBHOOK_URL?.trim();
  if (!webhook) {
    return Response.json({ ok: false, unavailable: true }, { status: 503 });
  }

  const payload = {
    email,
    source,
    timestamp: new Date().toISOString(),
    ...(name ? { name } : {}),
  };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 409) {
      return Response.json({ ok: true, email });
    }

    return Response.json({ error: "Could not join waitlist right now" }, { status: 502 });
  } catch {
    return Response.json({ error: "Could not join waitlist right now" }, { status: 502 });
  }
}
