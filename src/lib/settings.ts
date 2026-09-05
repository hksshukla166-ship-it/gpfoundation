import { prisma } from "./prisma";
import type { WebsiteSettings } from "@prisma/client";

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function isNeonConfigured() {
  const url = process.env.DATABASE_URL || "";
  return Boolean(url) && url.includes("neon.tech") && !url.includes("ep-xxxx") && !url.includes("USER:PASSWORD");
}

export const DEFAULT_SETTINGS: WebsiteSettings = {
  id: "default",
  instituteName: "GP FOUNDATION, KONDAGAON",
  tagline: "आपका लक्ष्य, हमारी जिम्मेदारी।",
  phone: "+91-81030 68959",
  email: "foundationgp350@gmail.com",
  address: "Kanya Shala Road, Indian Gas Agency के सामने, Deepak Complex, Kondagaon, Chhattisgarh",
  footerText: "B.Sc. • B.Com. • B.A. • CGPSC • UPSC • Additional Preparation Classes",
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  whatsappUrl: null,
  seoTitle: "GP Foundation Kondagaon | B.Sc., B.Com., B.A. with CGPSC & UPSC",
  seoDescription:
    "GP Foundation, Kondagaon offers integrated B.Sc., B.Com. and B.A. programs with CGPSC and UPSC preparation, plus optional additional classes.",
  logoUrl: null,
  faviconUrl: null,
  defaultImageUrl: null,
  admissionOpen: true,
  maintenanceMode: false,
  heroHeading: "अपने लक्ष्य को बनाइए अपनी पहचान",
  heroSubheading: "GP FOUNDATION, KONDAGAON",
  heroSupporting: "B.Sc. | B.Com. | B.A. | CGPSC | UPSC",
  joinCtaLabel: "JOIN NOW",
  joinCtaHref: "/admission",
  enquireCtaLabel: "ENQUIRE NOW",
  enquireCtaHref: "/contact",
  welcomeHeading: "Welcome to GP Foundation, Kondagaon",
  welcomeBody:
    "GP Foundation, Kondagaon विद्यार्थियों को स्नातक पढ़ाई (B.Sc., B.Com., B.A.) के साथ CGPSC एवं UPSC प्रतियोगी परीक्षाओं की गुणवत्तापूर्ण तैयारी उपलब्ध कराने के उद्देश्य से कार्य करता है।",
  welcomeExtra: "मुख्य Admission तीन Integrated Programs के लिए है। अन्य विषय एवं परीक्षाओं की तैयारी विद्यार्थी Additional Classes के रूप में चुन सकते हैं।",
  aboutHeading: "हमारे बारे में",
  aboutBody:
    "GP Foundation, Kondagaon का उद्देश्य युवाओं को स्नातक शिक्षा और प्रतियोगी परीक्षाओं के लिए व्यवस्थित, गुणवत्तापूर्ण तैयारी उपलब्ध कराना है।",
  aboutFocus: "B.Sc. / B.Com. / B.A. + CGPSC + UPSC · Additional Classes आवश्यकता अनुसार",
  aboutObjective: "विद्यार्थियों को स्नातक पढ़ाई के साथ सरकारी सेवा के लक्ष्य तक पहुँचने का सही मार्गदर्शन देना।",
  scholarshipTitle: "GP Foundation Scholarship",
  scholarshipBody:
    "मेधावी एवं योग्य विद्यार्थियों के लिए संस्थान द्वारा निर्धारित नियमों एवं पात्रता के अनुसार Scholarship अवसर उपलब्ध कराया जा सकता है।",
  scholarshipProcess: "Registration → Scholarship Test / Eligibility → Result → Scholarship",
  physicalHeading: "नियमित अभ्यास एवं अनुशासन",
  physicalNote: "Additional subject classes and special batches are offered as per student requirement.",
  writtenHeading: "Special Written Preparation",
  feeStScPaise: 100000,
  feeObcPaise: 125000,
  feeGeneralPaise: 135000,
  updatedAt: new Date(),
};

export async function getSettings(): Promise<WebsiteSettings> {
  if (!isNeonConfigured()) return DEFAULT_SETTINGS;
  try {
    const existing = await prisma.websiteSettings.findUnique({ where: { id: "default" } });
    if (existing) return existing;
    return prisma.websiteSettings.create({ data: { id: "default" } });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function safeDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isNeonConfigured()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
