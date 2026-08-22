import type { MetadataRoute } from "next";
import { TOOLS_EPOCH, unlockedTools } from "@/config/tools-registry";
import { DAY_MS, SITE_URL } from "@/lib/utils";

/**
 * Controlled drip-feed sitemap.
 * Only the currently-unlocked batch of tools (24 + 16/day since epoch)
 * is exposed to crawlers — preventing scaled-content / doorway-page flags.
 *
 * Dates are real: each entry's lastModified is the day it actually
 * unlocked, which keeps the sitemap honest for every search engine.
 *
 * Also pings IndexNow (Bing, Yandex, Naver, Seznam…) whenever fresh
 * pages unlock — so new URLs can be discovered within hours, not weeks.
 */

export const dynamic = "force-dynamic";

const INDEXNOW_KEY = "9f4c2e7a1b8d4f6a3c5e7d9b2a4c6e8f";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

// Throttle: ping at most once per 15 minutes per server instance.
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

  const tools = unlockedTools(now);
  const toolEntries: MetadataRoute.Sitemap = tools.map((tool) => {
    const unlockDay = Math.floor(tool.globalIndex / 16);
    return {
      url: `${SITE_URL}/tools/${tool.slug}`,
      // The real day this tool entered the indexable set.
      lastModified: new Date(TOOLS_EPOCH + unlockDay * DAY_MS),
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  // Notify instant-indexing engines about the freshest pages:
  // the homepage plus the most recently unlocked tools.
  const fresh = tools.slice(-20).map((t) => `${SITE_URL}/tools/${t.slug}`);
  pingIndexNow([SITE_URL, ...fresh]);

  return [...staticPages, ...toolEntries];
}
