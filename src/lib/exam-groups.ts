export const COURSE_TYPES = [
  { id: "CRASH_COURSE", label: "Crash Course" },
  { id: "REGULAR_COURSE", label: "Regular Course" },
] as const;

export type CourseTypeId = (typeof COURSE_TYPES)[number]["id"];

export const COURSE_TYPE_IDS = COURSE_TYPES.map((item) => item.id) as [CourseTypeId, ...CourseTypeId[]];

export const EXAMINATION_GROUPS = [
  {
    id: "BIOLOGY",
    label: "Biology Group",
    exams: [
      { id: "NEET", label: "NEET" },
      { id: "BSC_NURSING", label: "B.Sc. Nursing" },
      { id: "PPHT", label: "PPHT" },
    ],
  },
  {
    id: "MATHEMATICS",
    label: "Mathematics Group",
    exams: [
      { id: "JEE", label: "JEE" },
      { id: "PPHT", label: "PPHT" },
      { id: "PET", label: "PET" },
    ],
  },
  {
    id: "AGRICULTURE",
    label: "Agriculture Group",
    exams: [{ id: "PAT", label: "PAT" }],
  },
] as const;

export type ExaminationGroupId = (typeof EXAMINATION_GROUPS)[number]["id"];

export const EXAMINATION_GROUP_IDS = EXAMINATION_GROUPS.map((item) => item.id) as [
  ExaminationGroupId,
  ...ExaminationGroupId[],
];

export const EDUCATION_MEDIUMS = [
  { id: "HINDI", label: "Hindi" },
  { id: "ENGLISH", label: "English" },
] as const;

export type EducationMediumId = (typeof EDUCATION_MEDIUMS)[number]["id"];

export const EDUCATION_MEDIUM_IDS = EDUCATION_MEDIUMS.map((item) => item.id) as [
  EducationMediumId,
  ...EducationMediumId[],
];

export const FEE_REFUND_NOTICE_HI =
  "महत्वपूर्ण सूचना: यदि कोई विद्यार्थी कक्षा 12वीं की बोर्ड परीक्षा में अनुत्तीर्ण होता है, तो रजिस्ट्रेशन फीस वापसी हेतु परीक्षा परिणाम घोषित होने की तिथि से 8 दिवस के अंदर संस्था से संपर्क कर निर्धारित प्रक्रिया के अनुसार आवेदन प्रस्तुत करना अनिवार्य होगा। फीस वापसी के लिए रजिस्ट्रेशन रसीद प्रस्तुत करना आवश्यक है।";

export function courseTypeLabel(id: string | null | undefined) {
  return COURSE_TYPES.find((item) => item.id === id)?.label ?? (id || "—");
}

export function examinationGroupLabel(id: string | null | undefined) {
  return EXAMINATION_GROUPS.find((item) => item.id === id)?.label ?? (id || "—");
}

export type ExamOption = { id: string; label: string };

export function examsForGroup(groupId: string | null | undefined): ExamOption[] {
  const group = EXAMINATION_GROUPS.find((item) => item.id === groupId);
  return group ? [...group.exams] : [];
}

export function allExams(): ExamOption[] {
  return EXAMINATION_GROUPS.flatMap((item) => [...item.exams]);
}

export function examinationLabel(groupId: string | null | undefined, examId: string | null | undefined) {
  if (!examId) return "—";
  return examsForGroup(groupId).find((item) => item.id === examId)?.label ?? examId;
}

export function isExamInGroup(groupId: string, examId: string) {
  return examsForGroup(groupId).some((item) => item.id === examId);
}

export function educationMediumLabel(id: string | null | undefined) {
  return EDUCATION_MEDIUMS.find((item) => item.id === id)?.label ?? (id || "—");
}
