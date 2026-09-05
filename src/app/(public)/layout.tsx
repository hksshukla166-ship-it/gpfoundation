import { getSettings, safeDb } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { Maintenance } from "@/components/public/maintenance";
import { JsonLd } from "@/components/public/json-ld";
import { FALLBACK_NAV } from "@/lib/catalog";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav] = await Promise.all([
    getSettings(),
    safeDb(
      () => prisma.navLink.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
      FALLBACK_NAV,
    ),
  ]);

  if (settings.maintenanceMode) {
    return <Maintenance settings={settings} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd settings={settings} />
      <PublicHeader settings={settings} nav={nav} />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} />
    </div>
  );
}
