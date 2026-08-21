import type { Metadata } from "next";
import { ContactForm, H, LegalShell, P } from "@/components/legal";
import { FOUNDER, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About OmniKit Tools — Founder, Vision & Architecture",
  description: "OmniKit Tools: 750 free on-device utilities built by Hassan Asghar to scale to 10M+ monthly users with zero server hosting costs and absolute privacy.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <LegalShell title="About OmniKit Tools" updated="2026-01-01">
      <H>Our vision</H>
      <P>
        OmniKit Tools is built to be the ultimate digital toolkit of the internet — 750 dedicated utilities across 12
        categories, every single one executing entirely inside your browser. There is no server farm, no upload queue,
        and no data warehouse behind OmniKit: the architecture is deliberately client-native, which is why it scales to
        tens of millions of monthly sessions with zero hosting costs and zero privacy trade-offs.
      </P>
      <H>Founder</H>
      <P>
        OmniKit Tools was founded and is operated by <strong className="text-slate-200">Hassan Asghar</strong>. Every
        tool, every line of the engine, and the entire product direction is driven with a single obsession: fast,
        private, genuinely useful software.
      </P>
      <ul className="space-y-1 text-slate-400">
        <li>📧 Email: <a className="text-cyan-300 hover:underline" href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a></li>
        <li>📱 Phone / WhatsApp: {FOUNDER.phone1} · {FOUNDER.phone2}</li>
      </ul>
      <H>How it works</H>
      <P>
        Heavy computations run inside Web Workers and WebAssembly modules on your device; cryptographic operations use
        your browser&apos;s native WebCrypto engine; large libraries such as the PDF engine are dynamically imported so
        the base application bundle stays under 50KB. A service worker caches the app shell, making the complete
        registry executable offline — airplane mode is a first-class supported environment.
      </P>
      <H>Our commitments</H>
      <P>
        Enterprise-grade client isolation. 100% on-device privacy. Zero data retention. Deterministic state
        self-healing. Strict hydration safety. No accounts, no cookies, no analytics fingerprinting — ever.
      </P>
      <H>Talk to us</H>
      <P>Ideas, partnerships, press, or bug reports — the inbox is always open.</P>
      <div className="pt-2">
        <ContactForm />
      </div>
    </LegalShell>
  );
}
