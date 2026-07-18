import { contact, contactLinks, site } from "@/lib/site";

function getInternationalPhone(value: string | null) {
  if (!value || /^https?:\/\//i.test(value)) return null;

  const digits = value.replace(/\D/g, "");
  const international = /^8\d{10}$/.test(digits)
    ? `7${digits.slice(1)}`
    : digits;

  return international ? `+${international}` : null;
}

export function buildHomeStructuredData(locale: "en" | "ru") {
  const isRussian = locale === "ru";
  const pageUrl = isRussian ? `${site.url}/ru` : site.url;
  const phone = getInternationalPhone(contact.whatsapp);
  const organizationId = `${site.url}/#organization`;
  const websiteId = `${site.url}/#website`;
  const serviceId = `${pageUrl}/#ai-systems-service`;
  const contactPoint = phone
    ? {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "sales",
        availableLanguage: ["English", "Russian"],
        ...(contactLinks.whatsapp ? { url: contactLinks.whatsapp } : {}),
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: site.name,
        url: site.url,
        logo: `${site.url}/icon.svg`,
        description: isRussian
          ? "Selena Systems проектирует и внедряет AI-системы для продаж, операций, знаний, контента и автоматизации бизнеса."
          : "Selena Systems designs and builds AI systems for sales, operations, knowledge, content and business automation.",
        ...(contactPoint ? { contactPoint } : {}),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: site.url,
        name: site.name,
        inLanguage: ["en", "ru"],
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Service",
        "@id": serviceId,
        url: pageUrl,
        name: isRussian
          ? "Внедрение AI-систем для бизнеса"
          : "AI systems implementation for growing businesses",
        serviceType: [
          "AI systems audit",
          "Business process automation",
          "AI workflow implementation",
        ],
        provider: { "@id": organizationId },
        areaServed: "Worldwide",
        inLanguage: locale,
        offers: {
          "@type": "OfferCatalog",
          name: isRussian ? "Форматы работы" : "Engagement options",
          itemListElement: [
            {
              "@type": "Offer",
              name: "AI Audit",
              price: "500",
              priceCurrency: "USD",
              url: isRussian ? `${site.url}/contact` : `${site.url}/en/contact`,
            },
            {
              "@type": "Offer",
              name: "AI Systems Sprint",
              price: "4000",
              priceCurrency: "USD",
              url: isRussian ? `${site.url}/contact` : `${site.url}/en/contact`,
            },
            {
              "@type": "Offer",
              name: "AI Business OS",
              priceSpecification: {
                "@type": "PriceSpecification",
                minPrice: "10000",
                priceCurrency: "USD",
              },
              url: isRussian ? `${site.url}/contact` : `${site.url}/en/contact`,
            },
          ],
        },
      },
    ],
  };
}
