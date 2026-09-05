"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus, Category, EnquiryStatus, GalleryCategory, NoticeType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/utils";

async function guard() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function bool(form: FormData, key: string) {
  return form.get(key) === "on" || form.get(key) === "true";
}

export async function saveSettings(form: FormData) {
  await guard();
  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {
      instituteName: str(form, "instituteName"),
      tagline: str(form, "tagline"),
      phone: str(form, "phone"),
      email: str(form, "email"),
      address: str(form, "address"),
      footerText: str(form, "footerText"),
      facebookUrl: str(form, "facebookUrl") || null,
      instagramUrl: str(form, "instagramUrl") || null,
      youtubeUrl: str(form, "youtubeUrl") || null,
      whatsappUrl: str(form, "whatsappUrl") || null,
      seoTitle: str(form, "seoTitle"),
      seoDescription: str(form, "seoDescription"),
      logoUrl: str(form, "logoUrl") || null,
      faviconUrl: str(form, "faviconUrl") || null,
      admissionOpen: bool(form, "admissionOpen"),
      maintenanceMode: bool(form, "maintenanceMode"),
      heroHeading: str(form, "heroHeading"),
      heroSubheading: str(form, "heroSubheading"),
      heroSupporting: str(form, "heroSupporting"),
      joinCtaLabel: str(form, "joinCtaLabel"),
      joinCtaHref: str(form, "joinCtaHref"),
      enquireCtaLabel: str(form, "enquireCtaLabel"),
      enquireCtaHref: str(form, "enquireCtaHref"),
      welcomeHeading: str(form, "welcomeHeading"),
      welcomeBody: str(form, "welcomeBody"),
      welcomeExtra: str(form, "welcomeExtra"),
      aboutHeading: str(form, "aboutHeading"),
      aboutBody: str(form, "aboutBody"),
      aboutFocus: str(form, "aboutFocus"),
      aboutObjective: str(form, "aboutObjective"),
      scholarshipTitle: str(form, "scholarshipTitle"),
      scholarshipBody: str(form, "scholarshipBody"),
      scholarshipProcess: str(form, "scholarshipProcess"),
      physicalHeading: str(form, "physicalHeading"),
      physicalNote: str(form, "physicalNote"),
      writtenHeading: str(form, "writtenHeading"),
      feeStScPaise: Number(str(form, "feeStScPaise") || 100000),
      feeObcPaise: Number(str(form, "feeObcPaise") || 125000),
      feeGeneralPaise: Number(str(form, "feeGeneralPaise") || 135000),
    },
  });
  revalidatePath("/");
}

export async function saveDirector(form: FormData) {
  await guard();
  const id = str(form, "id");
  const data = {
    name: str(form, "name") || null,
    designation: str(form, "designation"),
    photoUrl: str(form, "photoUrl") || null,
    shortBio: str(form, "shortBio") || null,
    message: str(form, "message") || null,
    isActive: bool(form, "isActive") || Boolean(str(form, "photoUrl") || str(form, "name")),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.directorProfile.update({ where: { id }, data });
  else await prisma.directorProfile.create({ data });
  revalidatePath("/");
}

export async function saveBanner(form: FormData) {
  await guard();
  const id = str(form, "id");
  const data = {
    heading: str(form, "heading") || null,
    subtitle: str(form, "subtitle") || null,
    supporting: str(form, "supporting") || null,
    imageUrl: str(form, "imageUrl") || null,
    ctaLabel: str(form, "ctaLabel") || null,
    ctaHref: str(form, "ctaHref") || null,
    isActive: bool(form, "isActive"),
    archived: bool(form, "archived"),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.heroBanner.update({ where: { id }, data });
  else await prisma.heroBanner.create({ data });
  revalidatePath("/");
}

export async function saveCourse(form: FormData) {
  await guard();
  const id = str(form, "id");
  const name = str(form, "name");
  const slug = str(form, "slug") || slugify(name);
  const data = {
    name,
    slug,
    shortDescription: str(form, "shortDescription"),
    fullDescription: str(form, "fullDescription"),
    imageUrl: str(form, "imageUrl") || null,
    duration: str(form, "duration") || null,
    batchInfo: str(form, "batchInfo") || null,
    categoryLabel: str(form, "categoryLabel") || null,
    feeStScPaise: str(form, "feeStScPaise") ? Number(str(form, "feeStScPaise")) : null,
    feeObcPaise: str(form, "feeObcPaise") ? Number(str(form, "feeObcPaise")) : null,
    feeGeneralPaise: str(form, "feeGeneralPaise") ? Number(str(form, "feeGeneralPaise")) : null,
    subjects: str(form, "subjects")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    admissionOpen: bool(form, "admissionOpen"),
    registrationOpen: bool(form, "registrationOpen"),
    isActive: bool(form, "isActive"),
    archived: bool(form, "archived"),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.course.update({ where: { id }, data });
  else await prisma.course.create({ data });
  revalidatePath("/courses");
}

export async function saveFaculty(form: FormData) {
  await guard();
  const id = str(form, "id");
  const data = {
    name: str(form, "name"),
    qualification: str(form, "qualification") || null,
    subject: str(form, "subject") || null,
    experience: str(form, "experience") || null,
    photoUrl: str(form, "photoUrl") || null,
    biography: str(form, "biography") || null,
    isActive: bool(form, "isActive"),
    archived: bool(form, "archived"),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.faculty.update({ where: { id }, data });
  else await prisma.faculty.create({ data });
  revalidatePath("/faculty");
}

export async function saveNotice(form: FormData) {
  await guard();
  const id = str(form, "id");
  const title = str(form, "title");
  const data = {
    title,
    slug: str(form, "slug") || slugify(title),
    type: str(form, "type") as NoticeType,
    excerpt: str(form, "excerpt") || null,
    body: str(form, "body"),
    published: bool(form, "published"),
    pinned: bool(form, "pinned"),
    archived: bool(form, "archived"),
    publishAt: str(form, "publishAt") ? new Date(str(form, "publishAt")) : null,
  };
  if (id) await prisma.notice.update({ where: { id }, data });
  else await prisma.notice.create({ data });
  revalidatePath("/notice");
}

export async function saveGallery(form: FormData) {
  await guard();
  const id = str(form, "id");
  const data = {
    title: str(form, "title") || null,
    mediaUrl: str(form, "mediaUrl"),
    mediaType: str(form, "mediaType") || "IMAGE",
    category: str(form, "category") as GalleryCategory,
    isActive: bool(form, "isActive"),
    archived: bool(form, "archived"),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.galleryItem.update({ where: { id }, data });
  else await prisma.galleryItem.create({ data });
  revalidatePath("/gallery");
}

export async function saveScholarship(form: FormData) {
  await guard();
  const id = str(form, "id");
  const data = {
    title: str(form, "title"),
    body: str(form, "body"),
    process: str(form, "process") || null,
    isActive: bool(form, "isActive"),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.scholarship.update({ where: { id }, data });
  else await prisma.scholarship.create({ data });
  revalidatePath("/scholarship");
}

export async function saveContent(form: FormData) {
  await guard();
  const id = str(form, "id");
  const data = {
    kind: str(form, "kind") as never,
    title: str(form, "title"),
    description: str(form, "description") || null,
    isActive: bool(form, "isActive"),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.contentBlock.update({ where: { id }, data });
  else await prisma.contentBlock.create({ data });
  revalidatePath("/");
}

export async function updateEnquiryStatus(form: FormData) {
  await guard();
  await prisma.enquiry.update({
    where: { id: str(form, "id") },
    data: { status: str(form, "status") as EnquiryStatus, archived: bool(form, "archived") },
  });
}

export async function updateRegistrationStatus(form: FormData) {
  await guard();
  const status = str(form, "status") as ApplicationStatus;
  const id = str(form, "id");
  await prisma.courseRegistration.update({
    where: { id },
    data: {
      status,
      adminNotes: str(form, "adminNotes") || null,
      verifiedAt: status === "VERIFIED" ? new Date() : undefined,
      confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
      rejectedAt: status === "REJECTED" ? new Date() : undefined,
    },
  });
}

export async function changePassword(form: FormData) {
  const admin = await guard();
  const next = str(form, "password");
  if (next.length < 10) throw new Error("Password too short");
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
}

export async function updateApplicant(form: FormData) {
  await guard();
  await prisma.applicant.update({
    where: { id: str(form, "id") },
    data: {
      fullName: str(form, "fullName"),
      mobile: str(form, "mobile"),
      email: str(form, "email") || null,
      address: str(form, "address"),
      district: str(form, "district"),
      state: str(form, "state"),
    },
  });
}

export async function saveContactSettings(form: FormData) {
  await guard();
  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {
      phone: str(form, "phone"),
      email: str(form, "email"),
      address: str(form, "address"),
      facebookUrl: str(form, "facebookUrl") || null,
      instagramUrl: str(form, "instagramUrl") || null,
      youtubeUrl: str(form, "youtubeUrl") || null,
      whatsappUrl: str(form, "whatsappUrl") || null,
    },
  });
  revalidatePath("/contact");
}

export async function saveHomepageContent(form: FormData) {
  await guard();
  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {
      heroHeading: str(form, "heroHeading"),
      heroSubheading: str(form, "heroSubheading"),
      heroSupporting: str(form, "heroSupporting"),
      joinCtaLabel: str(form, "joinCtaLabel"),
      joinCtaHref: str(form, "joinCtaHref"),
      enquireCtaLabel: str(form, "enquireCtaLabel"),
      enquireCtaHref: str(form, "enquireCtaHref"),
      welcomeHeading: str(form, "welcomeHeading"),
      welcomeBody: str(form, "welcomeBody"),
      welcomeExtra: str(form, "welcomeExtra"),
      aboutHeading: str(form, "aboutHeading"),
      aboutBody: str(form, "aboutBody"),
      aboutFocus: str(form, "aboutFocus"),
      aboutObjective: str(form, "aboutObjective"),
    },
  });
  revalidatePath("/");
}

export async function saveNavLink(form: FormData) {
  await guard();
  const id = str(form, "id");
  const data = {
    label: str(form, "label"),
    href: str(form, "href"),
    isActive: bool(form, "isActive"),
    displayOrder: Number(str(form, "displayOrder") || 0),
  };
  if (id) await prisma.navLink.update({ where: { id }, data });
  else await prisma.navLink.create({ data });
  revalidatePath("/");
}

export async function exportRedirect() {
  redirect("/api/admin/export/registrations");
}

export type SearchArgs = { q?: string; page?: number };

export async function searchRegistrations(args: {
  q?: string;
  courseId?: string;
  category?: Category;
  payment?: string;
  status?: ApplicationStatus;
  page?: number;
}) {
  const take = 20;
  const page = Math.max(1, args.page || 1);
  const where: Prisma.CourseRegistrationWhereInput = {
    ...(args.courseId ? { courseId: args.courseId } : {}),
    ...(args.category ? { category: args.category } : {}),
    ...(args.status ? { status: args.status } : {}),
    ...(args.q
      ? {
          OR: [
            { applicationId: { contains: args.q, mode: "insensitive" } },
            { applicant: { fullName: { contains: args.q, mode: "insensitive" } } },
            { applicant: { mobile: { contains: args.q } } },
          ],
        }
      : {}),
    ...(args.payment ? { payments: { some: { status: args.payment as never } } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.courseRegistration.findMany({
      where,
      include: { applicant: true, course: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.courseRegistration.count({ where }),
  ]);
  return { items, total, page, take };
}
