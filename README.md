# ◆ OmniKit Tools

**750 free online tools — 100% on-device. Zero servers. Zero uploads. Zero data retention.**

Built by **Hassan Asghar** · hassanasghar7868686@gmail.com · +92 345 1098607 · +92 349 7726469

---

## Architecture at a glance

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 |
| Speed | Web Workers (hashing/analysis) + dynamic imports (`jspdf`, `qrcode`) + sub-50KB base bundle |
| Offline | Service worker (`/sw.js`) — network-first navigation, cache-first static, offline fallback page |
| PWA | `manifest.webmanifest`, installable, maskable icon |
| SEO | Per-tool meta/canonical/OG, `WebApplication` + `FAQPage` + `BreadcrumbList` JSON-LD (no fabricated ratings), honest-date drip-feed sitemap, IndexNow instant-indexing pings (Bing/Yandex/Naver/Seznam) |
| Monetization | Fixed-dimension AdSense slots (CLS = 0), max 3 per page |
| Security | Strict CSP (no `unsafe-eval`), security headers, honeypot + rate-limited contact API, self-healing error boundaries |
| i18n | 26 locales: EN · ZH-CN · ZH-TW · ES · AR (RTL) · FR · BN · PT · RU · JA · DE · JV · KO · VI · IT · TR · FA (RTL) · TA · PL · UK · RO · NL · HU · EL · SV · TH — Urdu & Hindi excluded by policy |
| Database | PostgreSQL via Drizzle — **optional**, only the contact inbox uses it |

## Registry

`src/config/tool-lists.ts` holds all **750 tools** across 12 categories. `src/config/tools-registry.ts`
asserts uniqueness and total count at build time and computes the drip-feed unlock schedule:
**24 tools indexable on day one, +16 per day** until the full registry is exposed — preventing
Google "scaled content abuse" flags.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — everything works without it
npx drizzle-kit push         # optional — only if DATABASE_URL is set
npm run dev
```

## Deploy to Vercel (recommended) — zero configuration

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import the GitHub repo** (framework auto-detected).
3. Click **Deploy**. That's it — no environment variables required.

### About Vercel's "Environment Variables detected" panel

If Vercel's dashboard lists detected variables, it is a **suggestion, not an error** —
the build and the site run perfectly with all of them unset:

| Variable | Required? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | No (ads only) | Your AdSense publisher ID `ca-pub-…` |
| `NEXT_PUBLIC_AD_SLOT` | No (ads only) | The AdSense ad unit ID |

Until the AdSense pair is set, elegant fixed-size placeholder slots render
(CLS remains 0). Everything else is automatic:

- **Canonical URL / sitemap / OG tags** — auto-derived from Vercel's built-in
  `VERCEL_URL` system variable on every deployment (preview and production).
  Optionally set `NEXT_PUBLIC_SITE_URL` when using a custom domain.
- **Database** — optional. Without `DATABASE_URL` the contact form degrades
  gracefully and `/api/health` stays green in static mode. For the inbox,
  add a free Neon or Vercel Postgres database and set `DATABASE_URL`.
- **Sitemap drip-feed** — scheduled automatically (24 tools on day one,
  +16/day until all 750 are indexable).

### Vercel troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails with a package error | Delete `package-lock.json` from the repo and re-deploy, or set the install command to `npm install --no-package-lock` |
| "Node.js version not supported" | Project → Settings → Node.js Version → **22.x** (or 20.9+) |
| Site loads but ads don't show | Add both `NEXT_PUBLIC_ADSENSE_CLIENT` and `NEXT_PUBLIC_AD_SLOT`, redeploy, wait for AdSense approval |
| Contact form says "inbox unavailable" | Set `DATABASE_URL` and run `npx drizzle-kit push` once against that database |
| Old URL "refuses to connect" | Preview URLs expire — use the latest deployment URL from Vercel's dashboard |

## AdSense setup

- Ad slots use rigid pre-allocated dimensions (`.ad-slot`), so **CLS is always 0** and
  Google AdSense policy approval is instant.
- Until `NEXT_PUBLIC_ADSENSE_CLIENT` + `NEXT_PUBLIC_AD_SLOT` are set, branded fixed-size
  placeholders render — deploy them as-is.

## Validation

```bash
npx next typegen && npx tsc --noEmit && npm run build
```
