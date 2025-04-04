/**
 * Extracts unique topics from course data
 */
export function extractMedicalTopics(courses: { title: string; description: string; category: string }[]): string[] {
    // Expanded list of medical specialties and common medical terms
    const medicalTerms = [
      // Medical specialties
      "Cardiology",
      "Dermatology",
      "Endocrinology",
      "Gastroenterology",
      "Gynecology",
      "Hematology",
      "Immunology",
      "Nephrology",
      "Neurology",
      "Oncology",
      "Ophthalmology",
      "Orthopedics",
      "Pediatrics",
      "Psychiatry",
      "Pulmonology",
      "Radiology",
      "Rheumatology",
      "Urology",
  
      // Common medical terms
      "Anatomy",
      "Physiology",
      "Pathology",
      "Pharmacology",
      "Surgery",
      "Medicine",
      "Nursing",
      "Healthcare",
      "Clinical",
      "Emergency",
      "Trauma",
      "Diagnosis",
      "Treatment",
      "Therapy",
  
      // Medical procedures
      "MRI",
      "CT Scan",
      "X-Ray",
      "Ultrasound",
      "ECG",
      "EKG",
  
      // Common medical conditions
      "Diabetes",
      "Hypertension",
      "Cancer",
      "Asthma",
      "COVID",
    ]
  
    // If no matches are found, extract topics from categories
    if (courses.length > 0) {
      // Get unique categories from courses
      const categories = [...new Set(courses.map((course) => course.category))]
  
      // Add categories to the list of potential topics
      medicalTerms.push(...categories)
    }
  
    // Extract topics from titles and descriptions
    const topicsFromContent = courses.flatMap((course) => {
      return medicalTerms.filter(
        (term) =>
          course.title.toLowerCase().includes(term.toLowerCase()) ||
          course.description.toLowerCase().includes(term.toLowerCase()),
      )
    })
  
    // If still no topics found, return some default medical topics
    if (topicsFromContent.length === 0) {
      return ["Cardiology", "Emergency Medicine", "Family Medicine", "Internal Medicine", "Pediatrics"]
    }
  
    // Deduplicate and sort
    return [...new Set(topicsFromContent)].sort()
  }
  
  /**
   * Applies topic and price ceiling filters to courses
   */
  interface Course {
    title: string;
    description: string;
    category: string;
    price: number;
  }
  
  export function applyTopicAndPriceFilters(courses: Course[], topicFilter: string, priceCeiling: number): Course[] {
    let filtered = [...courses]
  
    // Apply topic filter
    if (topicFilter !== "all") {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(topicFilter.toLowerCase()) ||
          course.description.toLowerCase().includes(topicFilter.toLowerCase()),
      )
    }
  
    // Apply price ceiling filter
    if (priceCeiling < 1000) {
      filtered = filtered.filter((course) => course.price <= priceCeiling)
    }
  
    return filtered
  }
  
  