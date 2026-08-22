import type { Metadata } from "next";
import { H, LegalShell, P } from "@/components/legal";
import { FOUNDER, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Disclaimer | OmniKit Tools",
  description: "Disclaimer for OmniKit Tools: on-device utilities are provided for convenience and must be independently verified.",
  alternates: { canonical: `${SITE_URL}/disclaimer` },
};

export default function DisclaimerPage() {
  return (
    <LegalShell title="Disclaimer" updated="2026-01-01">
      <H>General information</H>
      <P>
        All tools on OmniKit Tools are provided for convenience and general informational purposes only. They execute
        entirely in your browser; outputs reflect the algorithms implemented in the client bundle and the data you
        provide.
      </P>
      <H>Financial and legal decisions</H>
      <P>
        Financial calculators, tax estimators and similar utilities produce estimates, not professional advice. Consult
        a qualified professional before making financial, legal or tax decisions.
      </P>
      <H>Security utilities</H>
      <P>
        Security tools (hashes, encryption, password checks) implement standard algorithms using your browser&apos;s
        WebCrypto engine. For production systems, always combine multiple layers of security and independent audits.
      </P>
      <H>External services</H>
      <P>
        Some network tools optionally contact third-party services; availability and accuracy of those services are
        outside our control.
      </P>
      <H>Contact</H>
      <P>
        <a className="text-cyan-300 hover:underline" href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a> · {FOUNDER.phone1}
      </P>
    </LegalShell>
  );
}
