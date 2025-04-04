// Extend the existing Course type to include rating and reviewCount
export interface Course {
    _id: string
    title: string
    description: string
    price: number
    category: string
    level: "Beginner" | "Intermediate" | "Advanced"
    source: string
    thumbnail?: string
    instructor: string
    reviewCount: number // Added reviewCount property
    instructorBio?: string
    duration: string
    enrollments: number
    objectives?: string[]
    prerequisites?: string[]
    modules?: {
      title: string
      lessons: string[]
    }[]
    rating?: number // New field for course rating
    reviewCount?: number // New field for number of reviews
  }
  
  