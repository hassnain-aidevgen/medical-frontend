// User type
export interface User {
    _id: string
    username: string
    email: string
    profilePicture?: string
    score?: number
    rank?: number
    totalTime?: number
    quizzesTaken?: number
    lastActive?: string
    createdAt: string
    updatedAt: string
  }
  
  // Badge type
  export interface Badge {
    _id: string
    name: string
    description: string
    icon: string
    representation: "emoji" | "icon" | "image"
    criteria: string
    type: "achievement" | "rank" | "special" | "improvement"
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  
  // UserBadge type
  export interface UserBadge {
    _id: string
    userId: string | User
    badgeId: string | Badge
    awardedAt: string
    awardedBy: "system" | "admin"
    awardReason?: string
    createdAt: string
    updatedAt: string
  }
  
  // User with badges
  export interface UserWithBadges extends User {
    badges: Badge[]
    badgesEarned: number
  }
  
  // Badge assignment form data
  export interface BadgeAssignmentFormData {
    userId: string
    badgeId: string
    awardReason?: string
  }
  
  // API response type
  export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    count?: number
    pagination?: {
      total: number
      page: number
      pages: number
      limit: number
    }
  }
  
  