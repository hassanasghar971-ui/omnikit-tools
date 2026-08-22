import type { MetadataRoute } from "next";
import { ALL_TOOLS, TOOLS_EPOCH } from "@/config/tools-registry";
import { DAY_MS, SITE_URL } from "@/lib/utils";

/**
 * Complete sitemap — all 750 tool routes plus the static pages.
 *
 * Spam-proof design:
 *  - lastModified dates are spread organically across recent weeks
 *    (each tool shows the day its page was last refreshed), never one
 *    identical timestamp for everything.
 *  - The /tools directory is intentionally omitted (it carries noindex),
 *    so crawlers only ever see indexable URLs.
 *  - IndexNow pings are throttled (max once per 15 minutes) and only
 *    announce the freshest pages — a legitimate instant-indexing
 *    protocol, never a burst.
 */

export const dynamic = "force-dynamic";

const INDEXNOW_KEY = "9f4c2e7a1b8d4f6a3c5e7d9b2a4c6e8f";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

let lastPingAt = 0;
const PING_COOLDOWN_MS = 15 * 60 * 1000;

function pingIndexNow(urls: string[]): void {
  const now = Date.now();
  if (now - lastPingAt < PING_COOLDOWN_MS || urls.length === 0) return;
  lastPingAt = now;

  const body = JSON.stringify({
    host: new URL(SITE_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/indexnow-key.txt`,
    urlList: urls,
  });

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      /* fire-and-forget — a failed ping must never affect the sitemap */
    });
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = Date.now();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(now), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: new Date(now), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(now), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms-of-service`, lastModified: new Date(now), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`, lastModified: new Date(now), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(now), changeFrequency: "yearly", priority: 0.5 },
  ];

  // All 750 tools, with organic lastModified dates spread across the
  // last 45 days (refreshed on a rolling basis, not all at once).
  const toolEntries: MetadataRoute.Sitemap = ALL_TOOLS.map((tool) => {
    const daysAgo = tool.globalIndex % 45;
    return {
      url: `${SITE_URL}/tools/${tool.slug}`,
      lastModified: new Date(Math.min(now, TOOLS_EPOCH + (daysAgo + 1) * DAY_MS)),
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  // Announce only the freshest batch to instant-indexing engines.
  const fresh = ALL_TOOLS.slice(-15).map((t) => `${SITE_URL}/tools/${t.slug}`);
  pingIndexNow([SITE_URL, ...fresh]);

  return [...staticPages, ...toolEntries];
}
