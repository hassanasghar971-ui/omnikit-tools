import type { Metadata } from "next";
import { H, LegalShell, P } from "@/components/legal";
import { FOUNDER, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy — Zero Data Retention | OmniKit Tools",
  description: "OmniKit Tools processes everything on-device. Read our privacy policy: no accounts, no uploads, no tracking, no data retention.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="2026-01-01">
      <P>
        This Privacy Policy describes how OmniKit Tools (&quot;we&quot;, &quot;our&quot;) handles information when you use
        the website. The short version: <strong className="text-slate-200">your data never leaves your device.</strong>
      </P>
      <H>1. Client-side processing</H>
      <P>
        All tool computation — formatting, conversion, hashing, encryption, image processing — executes inside your
        browser using JavaScript, Web Workers and WebCrypto. Input you type or files you select are processed in local
        memory only and are never transmitted to our servers.
      </P>
      <H>2. What we never collect</H>
      <P>
        We do not require accounts, we do not use login cookies, we do not run analytics fingerprinting, and we do not
        store tool inputs or outputs. LocalStorage is used only for your language preference and recent-tool list, and
        it never leaves your machine.
      </P>
      <H>3. Advertising</H>
      <P>
        Where advertising appears, slots are fixed-dimension containers served by Google AdSense. Ad providers may use
        their own cookies under their respective policies. If you block ads, tools remain fully functional.
      </P>
      <H>4. Contact messages</H>
      <P>
        If you submit the contact form, we receive and store only the name, email, subject and message you provide, for
        the sole purpose of replying. We never sell or share it.
      </P>
      <H>5. Third-party lookups</H>
      <P>
        Optional network tools (e.g. the password breach checker) contact third-party services using privacy-preserving
        methods: the breach checker sends only the first 5 characters of a SHA-1 hash (k-anonymity). No tool transmits
        more than strictly necessary.
      </P>
      <H>6. Contact</H>
      <P>
        Questions about privacy: <a className="text-cyan-300 hover:underline" href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a>.
      </P>
    </LegalShell>
  );
}
