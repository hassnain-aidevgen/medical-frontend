
  export interface UserWithBadges extends User {
    badges?: UserBadge[]
  }
  

  // User type
export interface User {
    _id: string
    userId: string
    name: string
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
    imageUrl?: string
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
    user?: UserRef[]
  }
  
  // User with badges
  export interface UserWithBadges extends User {
    badges?: UserBadge[]
    badgesEarned: number
    recentBadges: Badge[];
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
  

// Reference types for populated fields
export interface UserRef {
  _id: string
  name?: string
  profilePicture?: string
}

export interface BadgeRef {
  _id: string
  name: string
}

// Badge stats types
export interface BadgeStats {
  recentAwards?: UserBadge[]
  awardsByBadge?: BadgeAwardCount[]
  totalAwards?: number
}

export interface BadgeAwardCount {
  badgeId: string
  name: string
  count: number
}

// Dashboard stats types
export interface DashboardStats {
  totalUsers: number
  activeBadges: number
  badgesAwarded: number
  engagementRate: number
  recentActivity: RecentActivity[]
  topBadges: TopBadge[]
  topUsers: TopUser[]
}

export interface RecentActivity {
  id: string
  user: string
  userId: string
  profilePicture?: string
  action: string
  time: string
  badgeId?: string
  badgeName?: string
}

export interface TopBadge {
  id: string
  name: string
  awarded: number
  icon: string
  representation: string
}

export interface TopUser {
  id: string
  name: string
  username: string
  profilePicture?: string
  badges: number
  score: number
}

