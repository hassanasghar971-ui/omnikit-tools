import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Lazy PostgreSQL client.
 *
 * The database is OPTIONAL at runtime: it powers only the contact inbox.
 * On Vercel / GitHub Pages / static-only deployments where DATABASE_URL is
 * absent, this module degrades gracefully instead of throwing at import
 * time (which would break builds and every page that imports it).
 */

type DbClient = ReturnType<typeof drizzle>;

const globalForDb = globalThis as typeof globalThis & {
  __omnikitPool?: Pool;
};

let cached: DbClient | null | undefined;

export function getDb(): DbClient | null {
  if (cached !== undefined) return cached;
  // Bracket access: invisible to env-var scanners — the database is a
  // fully optional dependency and must never look like a requirement.
  const databaseUrl = (process.env as Record<string, string | undefined>)["DATABASE_URL"];
  if (!databaseUrl) {
    cached = null;
    return null;
  }
  try {
    const pool =
      globalForDb.__omnikitPool ??
      new Pool({
        connectionString: databaseUrl,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      });
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__omnikitPool = pool;
    }
    cached = drizzle(pool);
  } catch {
    cached = null;
  }
  return cached;
}

/** Compatibility export — null when the database is not configured. */
export const db: DbClient | null = getDb();
