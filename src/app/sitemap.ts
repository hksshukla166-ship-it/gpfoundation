import { getSettings, siteUrl, safeDb } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const settingsUrl = siteUrl();
  const [courses, notices] = await Promise.all([
    safeDb(() => prisma.course.findMany({ where: { isActive: true, archived: false }, select: { slug: true, updatedAt: true } }), []),
    safeDb(() => prisma.notice.findMany({ where: { published: true, archived: false }, select: { slug: true, updatedAt: true } }), []),
  ]);
  await getSettings();
  const staticPaths = ["", "/about", "/courses", "/admission", "/scholarship", "/faculty", "/notice", "/gallery", "/contact"];
  return [
    ...staticPaths.map((path) => ({ url: `${settingsUrl}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...courses.map((c) => ({ url: `${settingsUrl}/courses/${c.slug}`, lastModified: c.updatedAt })),
    ...notices.map((n) => ({ url: `${settingsUrl}/notice/${n.slug}`, lastModified: n.updatedAt })),
  ];
}
