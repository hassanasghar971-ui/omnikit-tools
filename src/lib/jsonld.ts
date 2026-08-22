import type { ToolMeta } from "@/config/tools-registry";
import { getCategoryOf } from "@/config/tools-registry";
import type { ToolContent } from "@/lib/content";
import { SITE_NAME, SITE_URL } from "@/lib/utils";

export function buildToolJsonLd(tool: ToolMeta, content: ToolContent) {
  const cat = getCategoryOf(tool);
  const url = `${SITE_URL}/tools/${tool.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      url,
      description: content.metaDescription,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      softwareVersion: "1.0",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "100% client-side processing",
        "Offline-first PWA support",
        "Instant copy, share, PDF and print export",
        "Zero data retention",
      ].join(", "),
      inLanguage: [
        "en", "zh-CN", "zh-TW", "es", "ar", "fr", "bn", "pt", "ru", "ja", "de",
        "jv", "ko", "vi", "it", "tr", "fa", "ta", "pl", "uk", "ro", "nl", "hu",
        "el", "sv", "th",
      ],
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/tools` },
        { "@type": "ListItem", position: 3, name: cat.name, item: `${SITE_URL}/tools?category=${cat.slug}` },
        { "@type": "ListItem", position: 4, name: tool.name, item: url },
      ],
    },
  ];
}

export function buildSiteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description:
        "750+ free online tools — developer utilities, converters, calculators and more, all 100% on-device with zero data retention.",
      founder: {
        "@type": "Person",
        name: "Hassan Asghar",
        email: "hassanasghar7868686@gmail.com",
        telephone: "+92 345 1098607",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+92-345-1098607",
          contactType: "customer support",
          email: "hassanasghar7868686@gmail.com",
          availableLanguage: ["en"],
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/tools?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}
