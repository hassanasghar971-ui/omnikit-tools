import type { MetadataRoute } from "next";
import { unlockedTools } from "@/config/tools-registry";
import { SITE_URL } from "@/lib/utils";

/**
 * Controlled drip-feed sitemap.
 * Only the currently-unlocked batch of tools (24 + 16/day since epoch)
 * is exposed to crawlers — preventing scaled-content / doorway-page flags.
 */
export const dynamic = "force-dynamic";

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

  const toolEntries: MetadataRoute.Sitemap = unlockedTools(now).map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: new Date(now - (tool.globalIndex % 7) * 86_400_000),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...toolEntries];
}
