import type { Course } from "@/types"

/**
 * Filters courses based on exam tags
 * @param courses - Array of courses to filter
 * @param examName - Name of the exam to filter by
 * @returns Array of courses that match the exam tag
 */
export function filterCoursesByExam(courses: Course[], examName: string): Course[] {
  if (!examName || !courses?.length) return []

  // Normalize exam name for case-insensitive comparison
  const normalizedExamName = examName.toLowerCase()

  // First try exact matches
  const exactMatches = courses.filter((course) => {
    // Check if course has examTags property and if it includes the target exam
    if (course.examTags && Array.isArray(course.examTags)) {
      return course.examTags.some((tag) => tag.toLowerCase() === normalizedExamName)
    }

    // Check for exact matches in title or description
    return (
      course.title.toLowerCase().includes(normalizedExamName) ||
      course.description.toLowerCase().includes(normalizedExamName)
    )
  })

  // If we have enough exact matches, return them
  if (exactMatches.length >= 3) {
    return exactMatches
  }

  // Otherwise, be more lenient with matching
  // For medical exams, look for related terms
  const relatedTerms = getRelatedTerms(examName)

  return courses.filter((course) => {
    // First check exact matches
    if (course.examTags && Array.isArray(course.examTags)) {
      if (course.examTags.some((tag) => tag.toLowerCase() === normalizedExamName)) {
        return true
      }
    }

    if (
      course.title.toLowerCase().includes(normalizedExamName) ||
      course.description.toLowerCase().includes(normalizedExamName)
    ) {
      return true
    }

    // Then check for related terms
    return relatedTerms.some(
      (term) => course.title.toLowerCase().includes(term) || course.description.toLowerCase().includes(term),
    )
  })
}

/**
 * Gets a list of all available exam tracks from course data
 * @param courses - Array of all courses
 * @returns Array of unique exam names
 */
export function getAvailableExamTracks(courses: Course[]): string[] {
  if (!courses?.length) return []

  // Common medical exams to look for if not explicitly tagged
  const commonExams = [
    "USMLE",
    "ENARE",
    "MCAT",
    "NCLEX",
    "PANCE",
    "NAPLEX",
    "COMLEX",
    "ABIM",
    "ABFM",
    "Step 1",
    "Step 2",
    "Step 3",
  ]

  // Extract exam tags from courses
  const examTags = courses.reduce<string[]>((tags, course) => {
    if (course.examTags && Array.isArray(course.examTags)) {
      return [...tags, ...course.examTags]
    }
    return tags
  }, [])

  // If no explicit tags found, infer from course content
  if (examTags.length === 0) {
    return commonExams.filter((exam) =>
      courses.some((course) => course.title.includes(exam) || course.description.includes(exam)),
    )
  }

  // Return unique exam tags
  return [...new Set(examTags)]
}

/**
 * Determines if a course is relevant for a specific exam
 * @param course - Course to check
 * @param examName - Name of the exam
 * @returns Boolean indicating if course is relevant
 */
export function isCourseRelevantForExam(course: Course, examName: string): boolean {
  if (!course || !examName) return false

  const normalizedExamName = examName.toLowerCase()

  // Check explicit tags first
  if (course.examTags && Array.isArray(course.examTags)) {
    if (course.examTags.some((tag) => tag.toLowerCase() === normalizedExamName)) {
      return true
    }
  }

  // Check title and description
  return (
    course.title.toLowerCase().includes(normalizedExamName) ||
    course.description.toLowerCase().includes(normalizedExamName)
  )
}

// Add examTags to Course type
declare module "@/types" {
  interface Course {
    examTags?: string[]
  }
}

/**
 * Gets related terms for a medical exam to improve matching
 */
function getRelatedTerms(examName: string): string[] {
  const examMap: Record<string, string[]> = {
    usmle: ["medical licensing", "step 1", "step 2", "step 3", "medical exam", "clinical", "physician"],
    enare: ["residency", "medical residency", "specialty", "clinical"],
    mcat: ["medical college", "admission test", "premedical", "med school"],
    nclex: ["nursing", "registered nurse", "nurse practitioner"],
    comlex: ["osteopathic", "osteopathy", "do exam"],
    pance: ["physician assistant", "pa certification"],
    naplex: ["pharmacy", "pharmacist", "pharmaceutical"],
  }

  const normalizedExam = examName.toLowerCase()
  return examMap[normalizedExam] || []
}

