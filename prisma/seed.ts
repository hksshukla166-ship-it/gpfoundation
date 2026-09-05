import { PrismaClient } from "@prisma/client";
import {
  ADDITIONAL_CLASSES_LABEL,
  COURSE_SEED,
  FALLBACK_FEATURE_BLOCKS,
  FALLBACK_MATERIAL_BLOCKS,
  FALLBACK_PHYSICAL_BLOCKS,
  FALLBACK_TEST_BLOCKS,
  FALLBACK_WHY_BLOCKS,
  FALLBACK_WRITTEN_BLOCKS,
  INTEGRATED_PROGRAM_LABEL,
} from "../src/lib/catalog";

const prisma = new PrismaClient();

const nav = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "COURSES", href: "/courses" },
  { label: "FACULTY", href: "/faculty" },
  { label: "ADMISSION", href: "/admission" },
  { label: "SCHOLARSHIP", href: "/scholarship" },
  { label: "NOTICE", href: "/notice" },
  { label: "GALLERY", href: "/gallery" },
  { label: "CONTACT", href: "/contact" },
];

const settingsCopy = {
  tagline: "गुरु द्रोणाचार्य लक्ष्य उच्च शैक्षणिक संस्थान द्वारा संचालित छत्तीसगढ़ सोसायटी पंजीयन अधिनियम के अधीन पंजीकृत संस्था",
  heroHeading: "गुरु द्रोणाचार्य लक्ष्य उच्च शैक्षणिक संस्थान द्वारा संचालित छत्तीसगढ़ सोसायटी पंजीयन अधिनियम के अधीन पंजीकृत संस्था",
  footerText: "B.Sc. • B.Com. • B.A. • CGPSC • UPSC • Additional Preparation Classes",
  seoTitle: "GP Foundation Kondagaon | B.Sc., B.Com., B.A. with CGPSC & UPSC",
  seoDescription:
    "GP Foundation, Kondagaon offers integrated B.Sc., B.Com. and B.A. programs with CGPSC and UPSC preparation, plus optional additional classes.",
  heroSupporting: "B.Sc. | B.Com. | B.A. | CGPSC | UPSC",
  welcomeBody:
    "GP Foundation, Kondagaon विद्यार्थियों को स्नातक पढ़ाई (B.Sc., B.Com., B.A.) के साथ CGPSC एवं UPSC प्रतियोगी परीक्षाओं की गुणवत्तापूर्ण तैयारी उपलब्ध कराने के उद्देश्य से कार्य करता है।",
  welcomeExtra:
    "मुख्य Admission तीन Integrated Programs के लिए है। अन्य विषय एवं परीक्षाओं की तैयारी विद्यार्थी Additional Classes के रूप में चुन सकते हैं।",
  aboutBody:
    "GP Foundation, Kondagaon का उद्देश्य युवाओं को स्नातक शिक्षा और प्रतियोगी परीक्षाओं के लिए व्यवस्थित, गुणवत्तापूर्ण तैयारी उपलब्ध कराना है।",
  aboutFocus: "B.Sc. / B.Com. / B.A. + CGPSC + UPSC · Additional Classes आवश्यकता अनुसार",
  aboutObjective: "विद्यार्थियों को स्नातक पढ़ाई के साथ सरकारी सेवा के लक्ष्य तक पहुँचने का सही मार्गदर्शन देना।",
  physicalHeading: "नियमित अभ्यास एवं अनुशासन",
  physicalNote: "Additional subject classes and special batches are offered as per student requirement.",
  writtenHeading: "Special Written Preparation",
};

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!username || !passwordHash) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH before seeding. Run: npm run hash-password -- your-password");
  }

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash, displayName: "Administrator" },
  });

  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    update: settingsCopy,
    create: { id: "default", ...settingsCopy },
  });

  const existingDirector = await prisma.directorProfile.count();
  if (existingDirector === 0) {
    await prisma.directorProfile.create({
      data: {
        designation: "Director, GP Foundation, Kondagaon",
        isActive: false,
        displayOrder: 1,
      },
    });
  }

  const existingBanner = await prisma.heroBanner.count();
  if (existingBanner === 0) {
    await prisma.heroBanner.create({
      data: {
        heading: "गुरु द्रोणाचार्य लक्ष्य उच्च शैक्षणिक संस्थान द्वारा संचालित छत्तीसगढ़ सोसायटी पंजीयन अधिनियम के अधीन पंजीकृत संस्था",
        subtitle: "GP FOUNDATION, KONDAGAON",
        supporting: settingsCopy.heroSupporting,
        ctaLabel: "JOIN NOW",
        ctaHref: "/admission",
        isActive: true,
        displayOrder: 1,
      },
    });
  } else {
    await prisma.heroBanner.updateMany({
      where: { archived: false },
      data: { heading: settingsCopy.heroHeading, supporting: settingsCopy.heroSupporting },
    });
  }

  const keepSlugs = COURSE_SEED.map((course) => course.slug);
  await prisma.course.updateMany({
    where: { slug: { notIn: keepSlugs } },
    data: { isActive: false, archived: true, registrationOpen: false, admissionOpen: false },
  });

  for (const [index, course] of COURSE_SEED.entries()) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        name: course.name,
        shortDescription: course.shortDescription,
        fullDescription: course.fullDescription,
        subjects: course.subjects,
        categoryLabel: course.categoryLabel,
        duration: course.duration,
        batchInfo: course.batchInfo,
        registrationOpen: course.registrationOpen,
        admissionOpen: course.admissionOpen,
        isActive: true,
        archived: false,
        displayOrder: index + 1,
      },
      create: {
        ...course,
        displayOrder: index + 1,
      },
    });
  }

  const contentSeed = [
    ...FALLBACK_FEATURE_BLOCKS.map((item) => ({ kind: item.kind, title: item.title, displayOrder: item.displayOrder })),
    ...FALLBACK_WHY_BLOCKS.map((item) => ({ kind: item.kind, title: item.title, displayOrder: item.displayOrder })),
    ...FALLBACK_WRITTEN_BLOCKS.map((item) => ({ kind: item.kind, title: item.title, displayOrder: item.displayOrder })),
    ...FALLBACK_PHYSICAL_BLOCKS.map((item) => ({ kind: item.kind, title: item.title, displayOrder: item.displayOrder })),
    ...FALLBACK_TEST_BLOCKS.map((item) => ({ kind: item.kind, title: item.title, displayOrder: item.displayOrder })),
    ...FALLBACK_MATERIAL_BLOCKS.map((item) => ({ kind: item.kind, title: item.title, displayOrder: item.displayOrder })),
  ];

  await prisma.contentBlock.deleteMany({
    where: { kind: { in: ["FEATURE", "WHY_US", "WRITTEN_SUBJECT", "PHYSICAL_ITEM", "TEST_SERIES", "STUDY_MATERIAL"] } },
  });
  await prisma.contentBlock.createMany({ data: contentSeed });

  if ((await prisma.navLink.count()) === 0) {
    await prisma.navLink.createMany({ data: nav.map((item, i) => ({ ...item, displayOrder: i + 1 })) });
  }

  if ((await prisma.scholarship.count()) === 0) {
    await prisma.scholarship.create({
      data: {
        title: "GP Foundation Scholarship",
        body: "मेधावी एवं योग्य विद्यार्थियों के लिए संस्थान द्वारा निर्धारित नियमों एवं पात्रता के अनुसार Scholarship अवसर उपलब्ध कराया जा सकता है।",
        process: "Registration → Scholarship Test / Eligibility → Result → Scholarship",
        isActive: true,
      },
    });
  }

  console.log(
    `Seed complete. Main programs: ${INTEGRATED_PROGRAM_LABEL}. Additional classes: ${ADDITIONAL_CLASSES_LABEL}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
