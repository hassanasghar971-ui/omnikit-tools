import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Health probe. Always returns 200 while the web server is alive —
 * the database is an optional dependency, so a missing/degraded
 * database must never take the site down.
 */
export async function GET() {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: true, db: "unavailable", mode: "static" });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "connected" });
  } catch {
    return Response.json({ ok: true, db: "degraded", mode: "static" });
  }
}
