// src/lib/courses.ts

/**
 * ✅ DB-driven approach (Option C)
 * This file now supports grouping DB courses by category.
 * We keep the old COURSE_GROUPS + findCourseBySlug as a legacy fallback
 * so existing working features don’t break during transition.
 */

export type CourseCard = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  shortDescription: string | null;
};

export type CourseGroup = {
  title: string;
  courses: CourseCard[];
};

/** Group DB courses by category in a stable order */
export function groupCoursesByCategory(courses: CourseCard[]): CourseGroup[] {
  const map = new Map<string, CourseCard[]>();

  for (const c of courses) {
    const key = (c.category || "Other").trim() || "Other";
    const arr = map.get(key) ?? [];
    arr.push(c);
    map.set(key, arr);
  }

  // Sort categories A→Z, and courses A→Z within category
  const groups: CourseGroup[] = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, list]) => ({
      title,
      courses: list.sort((x, y) => x.title.localeCompare(y.title)),
    }));

  return groups;
}

// URL-safe slug for routes like /courses/software-testing-manual-qa
export function toCourseSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ------------------------------------------------------------------ */
/* LEGACY FALLBACK (safe to keep during transition)                     */
/* ------------------------------------------------------------------ */

// Keep keys stable and send readable values to backend
export const COURSE_GROUPS: Array<{ title: string; courses: string[] }> = [
  {
    title: "Vocational Training / Professional Certificate Courses",
    courses: [
      "Artificial Intelligence Fundamentals",
      "AWS Cloud Fundamentals",
      "Business Analyst (BA)",
      "Cybersecurity Fundamentals",
      "Data Analytics",
      "Healthcare Support Worker (HCSW)",
      "Health & Social Care",
      "IELTS Preparation",
      "Software Testing (Automation)",
      "Software Testing (Manual QA)",
    ],
  },
  {
    title: "Level 3 – University Entry Courses",
    courses: [
      "Accountancy",
      "Business Management",
      "Business Studies",
      "Employability and Workplace Skills",
      "Engineering",
      "Health & Social Care",
      "Information Technology",
      "People and Organisations",
    ],
  },
  {
    title: "Level 4 & 5 – University First and Second Year Courses",
    courses: [
      "Accounting and Business",
      "Business Management",
      "Cyber Security",
      "Entrepreneurship and Management",
      "Health & Social Care Management",
      "Human Resource Management",
      "IT and Computing",
      "IT and E-commerce",
      "IT and Networking",
      "IT and Web Design",
      "Law",
      "Leadership and Teamwork",
      "Logistics and Supply Chain Management",
      "Psychology",
      "Sales and Marketing",
      "Tourism and Hospitality Management",
    ],
  },
  {
    title: "Level 7 Diploma – Masters / LLM / MBA Advanced Entry",
    courses: [
      "Human Resource Management",
      "International Business Law leading to LLM",
      "Organisational Psychology and Business",
      "Project Management",
      "Strategic Management and Leadership",
      "Strategic Sales Management",
    ],
  },
];

// Reverse lookup: slug -> course name + group title (legacy)
export function findCourseBySlug(slug: string) {
  for (const group of COURSE_GROUPS) {
    for (const course of group.courses) {
      if (toCourseSlug(course) === slug) {
        return { courseName: course, groupTitle: group.title };
      }
    }
  }
  return null;
}
