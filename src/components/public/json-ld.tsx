type Settings = {
  instituteName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  seoTitle: string;
  seoDescription: string;
};

export function JsonLd({ settings }: { settings: Settings }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: settings.instituteName,
    description: settings.seoDescription,
    slogan: settings.tagline,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: "Kondagaon",
      addressRegion: "Chhattisgarh",
      addressCountry: "IN",
    },
    areaServed: "Kondagaon",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
