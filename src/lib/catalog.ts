import type { ContentBlock, ContentKind, Course, NavLink } from "@prisma/client";

export const INTEGRATED_PROGRAM_LABEL = "Integrated Program";
export const ADDITIONAL_CLASSES_LABEL = "Additional Classes";

export const ADDITIONAL_PREPARATION_OPTIONS = [
  { id: "cgpsc", label: "CGPSC" },
  { id: "upsc", label: "UPSC" },
  { id: "neet", label: "NEET" },
  { id: "jee", label: "JEE" },
  { id: "school-board", label: "School/Board Preparation" },
  { id: "commerce-foundation", label: "Commerce Foundation" },
  { id: "arts-foundation", label: "Arts Foundation" },
] as const;

export type AdditionalPreparationId = (typeof ADDITIONAL_PREPARATION_OPTIONS)[number]["id"];

export const ADDITIONAL_PREPARATION_IDS = ADDITIONAL_PREPARATION_OPTIONS.map((item) => item.id) as [
  AdditionalPreparationId,
  ...AdditionalPreparationId[],
];

export const EXAM_CENTERS = [
  { id: "BIJAPUR", label: "Bijapur (बीजापुर)" },
  { id: "DANTEWADA", label: "Dantewada (दंतेवाड़ा)" },
  { id: "KONDAGAON", label: "Kondagaon (कोण्डागांव)" },
  { id: "NARAYANPUR", label: "Narayanpur (नारायणपुर)" },
  { id: "BASTAR", label: "Bastar (बस्तर)" },
  { id: "KANKER", label: "Kanker (कांकेर)" },
] as const;

export type ExamCenterId = (typeof EXAM_CENTERS)[number]["id"];

export const EXAM_CENTER_IDS = EXAM_CENTERS.map((item) => item.id) as [ExamCenterId, ...ExamCenterId[]];

export function examCenterLabel(id: string) {
  return EXAM_CENTERS.find((item) => item.id === id)?.label ?? id;
}

export const FALLBACK_NAV: NavLink[] = [
  { id: "home", label: "HOME", href: "/", isActive: true, displayOrder: 1 },
  { id: "about", label: "ABOUT", href: "/about", isActive: true, displayOrder: 2 },
  { id: "courses", label: "COURSES", href: "/courses", isActive: true, displayOrder: 3 },
  { id: "faculty", label: "FACULTY", href: "/faculty", isActive: true, displayOrder: 4 },
  { id: "admission", label: "ADMISSION", href: "/admission", isActive: true, displayOrder: 5 },
  { id: "scholarship", label: "SCHOLARSHIP", href: "/scholarship", isActive: true, displayOrder: 6 },
  { id: "notice", label: "NOTICE", href: "/notice", isActive: true, displayOrder: 7 },
  { id: "gallery", label: "GALLERY", href: "/gallery", isActive: true, displayOrder: 8 },
  { id: "contact", label: "CONTACT", href: "/contact", isActive: true, displayOrder: 9 },
];

export type CourseSeed = Pick<Course, "name" | "slug" | "shortDescription" | "fullDescription" | "categoryLabel"> & {
  subjects: string[];
  registrationOpen: boolean;
  admissionOpen: boolean;
  duration: string;
  batchInfo: string;
};

export const COURSE_SEED: CourseSeed[] = [
  {
    name: "B.Sc. + CGPSC + UPSC",
    slug: "bsc-cgpsc-upsc",
    shortDescription: "B.Sc. की स्नातक पढ़ाई के साथ CGPSC एवं UPSC प्रतियोगी परीक्षाओं की तैयारी।",
    fullDescription:
      "GP Foundation का मुख्य Integrated Program: B.Sc. स्नातक पढ़ाई के साथ CGPSC एवं UPSC की व्यवस्थित तैयारी। ऑनलाइन आवेदन में विद्यार्थियों का Registration/Admission मुख्य रूप से इसी कार्यक्रम के अंतर्गत किया जाता है।",
    subjects: ["B.Sc. Graduation Subjects", "CGPSC Preparation", "UPSC Preparation", "General Studies", "Current Affairs", "Optional / Additional Classes as required"],
    categoryLabel: INTEGRATED_PROGRAM_LABEL,
    registrationOpen: true,
    admissionOpen: true,
    duration: "Graduation duration with concurrent CGPSC & UPSC preparation",
    batchInfo: "New batches as per admission schedule",
  },
  {
    name: "B.Com. + CGPSC + UPSC",
    slug: "bcom-cgpsc-upsc",
    shortDescription: "B.Com. की स्नातक पढ़ाई के साथ CGPSC एवं UPSC प्रतियोगी परीक्षाओं की तैयारी।",
    fullDescription:
      "GP Foundation का मुख्य Integrated Program: B.Com. स्नातक पढ़ाई के साथ CGPSC एवं UPSC की व्यवस्थित तैयारी। ऑनलाइन आवेदन में विद्यार्थियों का Registration/Admission मुख्य रूप से इसी कार्यक्रम के अंतर्गत किया जाता है।",
    subjects: ["B.Com. Graduation Subjects", "CGPSC Preparation", "UPSC Preparation", "General Studies", "Current Affairs", "Optional / Additional Classes as required"],
    categoryLabel: INTEGRATED_PROGRAM_LABEL,
    registrationOpen: true,
    admissionOpen: true,
    duration: "Graduation duration with concurrent CGPSC & UPSC preparation",
    batchInfo: "New batches as per admission schedule",
  },
  {
    name: "B.A. + CGPSC + UPSC",
    slug: "ba-cgpsc-upsc",
    shortDescription: "B.A. की स्नातक पढ़ाई के साथ CGPSC एवं UPSC प्रतियोगी परीक्षाओं की तैयारी।",
    fullDescription:
      "GP Foundation का मुख्य Integrated Program: B.A. स्नातक पढ़ाई के साथ CGPSC एवं UPSC की व्यवस्थित तैयारी। ऑनलाइन आवेदन में विद्यार्थियों का Registration/Admission मुख्य रूप से इसी कार्यक्रम के अंतर्गत किया जाता है।",
    subjects: ["B.A. Graduation Subjects", "CGPSC Preparation", "UPSC Preparation", "General Studies", "Current Affairs", "Optional / Additional Classes as required"],
    categoryLabel: INTEGRATED_PROGRAM_LABEL,
    registrationOpen: true,
    admissionOpen: true,
    duration: "Graduation duration with concurrent CGPSC & UPSC preparation",
    batchInfo: "New batches as per admission schedule",
  },
  {
    name: "CGPSC Preparation",
    slug: "cgpsc-preparation",
    shortDescription: "CGPSC की अतिरिक्त तैयारी — मुख्य Admission Program नहीं, आवश्यकता अनुसार चयन।",
    fullDescription:
      "यह कक्षा मुख्य Registration/Admission Program नहीं है। विद्यार्थी अपनी Requirement / Additional Classes के अनुसार CGPSC तैयारी का चयन कर सकते हैं।",
    subjects: ["CGPSC Prelims", "CGPSC Mains", "Chhattisgarh GK", "General Studies", "Current Affairs"],
    categoryLabel: ADDITIONAL_CLASSES_LABEL,
    registrationOpen: false,
    admissionOpen: false,
    duration: "As per student requirement",
    batchInfo: "Select as additional class during main program registration",
  },
  {
    name: "UPSC Preparation",
    slug: "upsc-preparation",
    shortDescription: "UPSC की अतिरिक्त तैयारी — मुख्य Admission Program नहीं, आवश्यकता अनुसार चयन।",
    fullDescription:
      "यह कक्षा मुख्य Registration/Admission Program नहीं है। विद्यार्थी अपनी Requirement / Additional Classes के अनुसार UPSC तैयारी का चयन कर सकते हैं।",
    subjects: ["UPSC Prelims", "UPSC Mains", "CSAT", "General Studies", "Current Affairs"],
    categoryLabel: ADDITIONAL_CLASSES_LABEL,
    registrationOpen: false,
    admissionOpen: false,
    duration: "As per student requirement",
    batchInfo: "Select as additional class during main program registration",
  },
  {
    name: "School/Board Preparation",
    slug: "school-board-preparation",
    shortDescription: "School/Board परीक्षाओं की अतिरिक्त तैयारी एवं विशेष कक्षाएँ।",
    fullDescription:
      "यह कक्षा मुख्य Registration/Admission Program नहीं है। विद्यार्थी School/Board Preparation को Additional Classes के रूप में चुन सकते हैं।",
    subjects: ["Board Exam Subjects", "Regular Practice", "Doubt Clearing", "Test Series"],
    categoryLabel: ADDITIONAL_CLASSES_LABEL,
    registrationOpen: false,
    admissionOpen: false,
    duration: "As per student requirement",
    batchInfo: "Select as additional class during main program registration",
  },
  {
    name: "NEET Preparation",
    slug: "neet-preparation",
    shortDescription: "NEET की अतिरिक्त तैयारी — मुख्य Admission Program नहीं।",
    fullDescription:
      "यह कक्षा मुख्य Registration/Admission Program नहीं है। विद्यार्थी अपनी आवश्यकता के अनुसार NEET तैयारी का चयन कर सकते हैं।",
    subjects: ["Physics", "Chemistry", "Biology", "NEET Practice Tests"],
    categoryLabel: ADDITIONAL_CLASSES_LABEL,
    registrationOpen: false,
    admissionOpen: false,
    duration: "As per student requirement",
    batchInfo: "Select as additional class during main program registration",
  },
  {
    name: "JEE Preparation",
    slug: "jee-preparation",
    shortDescription: "JEE की अतिरिक्त तैयारी — मुख्य Admission Program नहीं।",
    fullDescription:
      "यह कक्षा मुख्य Registration/Admission Program नहीं है। विद्यार्थी अपनी आवश्यकता के अनुसार JEE तैयारी का चयन कर सकते हैं।",
    subjects: ["Physics", "Chemistry", "Mathematics", "JEE Practice Tests"],
    categoryLabel: ADDITIONAL_CLASSES_LABEL,
    registrationOpen: false,
    admissionOpen: false,
    duration: "As per student requirement",
    batchInfo: "Select as additional class during main program registration",
  },
  {
    name: "Commerce Foundation",
    slug: "commerce-foundation",
    shortDescription: "Commerce Foundation — अतिरिक्त विषय आधारित तैयारी एवं विशेष कक्षाएँ।",
    fullDescription:
      "यह कक्षा मुख्य Registration/Admission Program नहीं है। विद्यार्थी Commerce Foundation को Additional Classes के रूप में चुन सकते हैं।",
    subjects: ["Accountancy", "Business Studies", "Economics", "Foundation Practice"],
    categoryLabel: ADDITIONAL_CLASSES_LABEL,
    registrationOpen: false,
    admissionOpen: false,
    duration: "As per student requirement",
    batchInfo: "Select as additional class during main program registration",
  },
  {
    name: "Arts Foundation",
    slug: "arts-foundation",
    shortDescription: "Arts Foundation — अतिरिक्त विषय आधारित तैयारी एवं विशेष कक्षाएँ।",
    fullDescription:
      "यह कक्षा मुख्य Registration/Admission Program नहीं है। विद्यार्थी Arts Foundation को Additional Classes के रूप में चुन सकते हैं।",
    subjects: ["History", "Political Science", "Geography", "Foundation Practice"],
    categoryLabel: ADDITIONAL_CLASSES_LABEL,
    registrationOpen: false,
    admissionOpen: false,
    duration: "As per student requirement",
    batchInfo: "Select as additional class during main program registration",
  },
];

const FALLBACK_FEATURES = [
  "अनुभवी एवं योग्य शिक्षक",
  "B.Sc. / B.Com. / B.A. Integrated Programs",
  "CGPSC एवं UPSC की समन्वित तैयारी",
  "विषयवार कक्षाएँ",
  "नियमित Test Series",
  "Mock Test",
  "Study Material",
  "Doubt Clearing Session",
  "Additional Classes आवश्यकता अनुसार",
  "नियमित विद्यार्थी मूल्यांकन",
  "Career Guidance",
];
const FALLBACK_WHY = [
  "तीन मुख्य Integrated Programs पर केंद्रित Admission",
  "स्नातक पढ़ाई + प्रतियोगी परीक्षा तैयारी",
  "अनुभवी एवं योग्य शिक्षक",
  "नियमित Test Series",
  "Mock Test",
  "Study Material",
  "Doubt Clearing",
  "Additional Preparation / Classes का विकल्प",
  "Career Guidance",
  "नियमित Performance Analysis",
  "अनुशासित एवं सकारात्मक वातावरण",
];
const FALLBACK_WRITTEN = [
  "General Studies",
  "CGPSC",
  "UPSC",
  "Current Affairs",
  "Mathematics",
  "Reasoning",
  "Hindi",
  "English",
  "Chhattisgarh GK",
  "Graduation Subjects",
];
const FALLBACK_PHYSICAL = ["Regular Practice", "Discipline & Routine", "Progress Monitoring", "Career Counselling"];
const FALLBACK_TESTS = ["Weekly Test", "Subject-wise Test", "Full-length Mock Test", "Previous Year Questions", "Practice Sets", "Performance Analysis", "नियमित मूल्यांकन"];
const FALLBACK_MATERIALS = ["Notes", "Practice Sets", "Previous Year Questions", "Mock Tests", "Current Affairs Material", "Graduation Support Material"];

function blocks(kind: ContentKind, titles: string[]): ContentBlock[] {
  const now = new Date();
  return titles.map((title, i) => ({
    id: `${kind}-${i}`,
    kind,
    title,
    description: null,
    icon: null,
    isActive: true,
    displayOrder: i + 1,
    createdAt: now,
    updatedAt: now,
  }));
}

export function isMainAdmissionProgram(course: Pick<Course, "categoryLabel" | "registrationOpen">) {
  return course.categoryLabel === INTEGRATED_PROGRAM_LABEL && course.registrationOpen;
}

export function mainAdmissionCourses<T extends Pick<Course, "categoryLabel" | "registrationOpen">>(courses: T[]) {
  return courses.filter(isMainAdmissionProgram);
}

export function additionalClassCourses<T extends Pick<Course, "categoryLabel">>(courses: T[]) {
  return courses.filter((course) => course.categoryLabel !== INTEGRATED_PROGRAM_LABEL);
}

export function additionalPreparationLabel(id: string) {
  return ADDITIONAL_PREPARATION_OPTIONS.find((item) => item.id === id)?.label ?? id;
}

export function fallbackCourses(): Course[] {
  const now = new Date();
  return COURSE_SEED.map((course, i) => ({
    id: course.slug,
    name: course.name,
    slug: course.slug,
    shortDescription: course.shortDescription,
    fullDescription: course.fullDescription,
    subjects: course.subjects,
    categoryLabel: course.categoryLabel,
    imageUrl: null,
    duration: course.duration,
    batchInfo: course.batchInfo,
    feeStScPaise: null,
    feeObcPaise: null,
    feeGeneralPaise: null,
    admissionOpen: course.admissionOpen,
    registrationOpen: course.registrationOpen,
    isActive: true,
    archived: false,
    displayOrder: i + 1,
    createdAt: now,
    updatedAt: now,
  }));
}

export const FALLBACK_FEATURE_BLOCKS = blocks("FEATURE", FALLBACK_FEATURES);
export const FALLBACK_WHY_BLOCKS = blocks("WHY_US", FALLBACK_WHY);
export const FALLBACK_WRITTEN_BLOCKS = blocks("WRITTEN_SUBJECT", FALLBACK_WRITTEN);
export const FALLBACK_PHYSICAL_BLOCKS = blocks("PHYSICAL_ITEM", FALLBACK_PHYSICAL);
export const FALLBACK_TEST_BLOCKS = blocks("TEST_SERIES", FALLBACK_TESTS);
export const FALLBACK_MATERIAL_BLOCKS = blocks("STUDY_MATERIAL", FALLBACK_MATERIALS);
