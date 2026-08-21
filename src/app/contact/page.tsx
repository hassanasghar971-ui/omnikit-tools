import type { Metadata } from "next";
import { ContactForm, H, LegalShell, P } from "@/components/legal";
import { FOUNDER, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Hassan Asghar — OmniKit Tools",
  description: "Contact the founder of OmniKit Tools: email hassanasghar7868686@gmail.com or WhatsApp +92 345 1098607.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <LegalShell title="Contact" updated="2026-01-01">
      <H>Reach the founder directly</H>
      <ul className="space-y-2">
        <li>📧 Email: <a className="text-cyan-300 hover:underline" href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a></li>
        <li>📱 Phone: {FOUNDER.phone1}</li>
        <li>📱 Phone / WhatsApp: {FOUNDER.phone2}</li>
        <li>💬 WhatsApp: <a className="text-cyan-300 hover:underline" href={`https://wa.me/${FOUNDER.whatsapp}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></li>
      </ul>
      <H>Or send a message</H>
      <P>Your message is stored only for the purpose of replying and is never shared.</P>
      <div className="pt-2">
        <ContactForm />
      </div>
    </LegalShell>
  );
}
