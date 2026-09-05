import type { Metadata } from "next";
import { DM_Sans, Noto_Serif_Devanagari, Oswald } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/settings";

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});

const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const url = siteUrl();
  return {
    metadataBase: new URL(url),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.instituteName}`,
    },
    description: settings.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      title: settings.seoTitle,
      description: settings.seoDescription,
      url,
      siteName: settings.instituteName,
      locale: "hi_IN",
      type: "website",
    },
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body className={`${dm.variable} ${devanagari.variable} ${oswald.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
