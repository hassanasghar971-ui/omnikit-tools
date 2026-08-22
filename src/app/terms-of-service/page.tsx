import type { Metadata } from "next";
import { H, LegalShell, P } from "@/components/legal";
import { FOUNDER, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service | OmniKit Tools",
  description: "Terms of service for OmniKit Tools — free on-device utilities provided as-is with no warranty.",
  alternates: { canonical: `${SITE_URL}/terms-of-service` },
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="2026-01-01">
      <H>1. Acceptance</H>
      <P>
        By using OmniKit Tools you agree to these terms. The service is provided free of charge and is intended for
        lawful, productive use.
      </P>
      <H>2. Free service</H>
      <P>
        All 750 tools are free with no usage limits. The service is monetized exclusively through fixed-size
        advertising placements; no tool is ever paywalled.
      </P>
      <H>3. Acceptable use</H>
      <P>
        You agree not to use the tools for unlawful purposes, to attempt to disrupt the service, or to scrape the
        registry at abusive scale.
      </P>
      <H>4. No warranty</H>
      <P>
        Tools are provided &quot;as is&quot; without warranties of any kind. Always verify critical outputs against an
        independent source before relying on them in production, financial or legal contexts.
      </P>
      <H>5. Liability</H>
      <P>
        To the maximum extent permitted by law, OmniKit Tools and its operator shall not be liable for any direct,
        indirect or consequential damages arising from use of the service.
      </P>
      <H>6. Changes</H>
      <P>We may update these terms at any time; continued use constitutes acceptance.</P>
      <H>7. Contact</H>
      <P>
        <a className="text-cyan-300 hover:underline" href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a> · {FOUNDER.phone1} · {FOUNDER.phone2}
      </P>
    </LegalShell>
  );
}
