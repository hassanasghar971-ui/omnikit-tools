import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";

export const dynamic = "force-dynamic";

/* ---------- lightweight in-memory rate limiting ---------- */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "unknown").slice(0, 64);
}

function rateLimited(req: Request): boolean {
  const ip = clientIp(req);
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count++;
  if (bucket.count > MAX_REQUESTS) return true;
  return false;
}

/* ---------- handler ---------- */

export async function POST(req: Request) {
  try {
    if (rateLimited(req)) {
      return Response.json(
        { ok: false, error: "Too many messages. Please try again in a few minutes or email us directly." },
        { status: 429 },
      );
    }

    const body = (await req.json()) as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      website?: string;
    };

    // Honeypot: bots fill hidden fields — silently accept and discard.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return Response.json({ ok: true, mode: "stored" });
    }

    const name = String(body.name ?? "").trim().slice(0, 120);
    const email = String(body.email ?? "").trim().slice(0, 200);
    const subject = String(body.subject ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 4000);

    if (!name || !email || !message) {
      return Response.json(
        { ok: false, error: "Name, email and message are required." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const db = getDb();
    if (db) {
      try {
        await db.insert(contactMessages).values({
          name,
          email,
          subject: subject || "General inquiry",
          message,
        });
        return Response.json({ ok: true, mode: "stored" });
      } catch {
        // fall through to graceful fallback below
      }
    }

    // Static deployments without a database: acknowledge honestly and
    // point the user at the direct contact channels.
    return Response.json({
      ok: true,
      mode: "fallback",
      note: "Inbox unavailable on this deployment — please email the founder directly.",
    });
  } catch {
    return Response.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
