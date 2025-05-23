import React from "react"
// Types
export interface TestResult {
  userId: string
  questions: {
    questionId: string
    questionText: string
    userAnswer: string
    correctAnswer: string
    timeSpent: number
  }[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
}

export interface StatsData {
  totalTestsTaken: number
  totalQuestionsAttempted: number
  totalQuestionsCorrect: number
  totalQuestionsWrong: number
  avgTimePerTest: number
  totalStudyHours: number
  subjectEfficiency: { subject: string; subsection: string; accuracy: number }[]
}

export interface ComparativeAnalytics {
  userPerformance: {
    subjectPerformance: {
      name: string
      correct: number
      total: number
      percentage: number
    }[]
    subsectionPerformance: {
      name: string
      subject: string
      correct: number
      total: number
      percentage: number
    }[]
    topicPerformance: {
      name: string
      correct: number
      total: number
      percentage: number
    }[]
    overallPercentile: number
    averageTimePerQuestion: number
    totalTestsTaken: number
  }
  globalPerformance: {
    average: {
      score: number
      percentage: number
      totalTests: number
    }
  }
  improvement: {
    percentage: number
    scoreChange: number
    timeEfficiency: number
  } | null
}

export interface SubjectPerformanceData {
  subjectId: string
  subjectName: string
  subsections: {
    subsectionId: string
    subsectionName: string
    performance: {
      correctCount: number
      incorrectCount: number
      totalCount: number
      lastAttempted: string
    }
  }[]
  lastUpdated: string
}

export interface UserPerformanceData {
  userId: string
  subjects: SubjectPerformanceData[]
  lastUpdated: string
}

export interface TopicMasteryMetrics {
  topics: {
    name: string
    attempts: number
    correct: number
    incorrect: number
    averageTime: number
    totalTime: number
    masteryLevel: string
    masteryScore: number
    lastAttemptDate: string | null
    isQuestPriority?: boolean
  }[]
  systems: {
    name: string
    attempts: number
    correct: number
    incorrect: number
    masteryLevel: string
    masteryScore: number
  }[]
  subtopics: {
    name: string
    parentTopic: string
    attempts: number
    correct: number
    incorrect: number
    masteryLevel: string
    masteryScore: number
  }[]
  weakestTopics: {
    name: string
    masteryScore: number
    masteryLevel: string
    isQuestPriority?: boolean
  }[]
  strongestTopics: {
    name: string
    masteryScore: number
    masteryLevel: string
  }[]
  recommendations: {
    topic: string
    masteryLevel: string
    masteryScore: number
    isQuestPriority: boolean
    recommendation: string
  }[]
  overallMastery: {
    averageScore: number
    topicsStarted: number
    topicsAtExpert: number
    topicsNeedingWork: number
  }
}

// Helper functions
import { AlertTriangle, XCircle, Info, CheckCircle2, Award } from "lucide-react" // Import your icon library here

export const getMasteryColor = (level: string): string => {
  switch (level) {
    case "Not Started":
      return "bg-gray-200 text-gray-700"
    case "Beginner":
      return "bg-red-100 text-red-700"
    case "Intermediate":
      return "bg-yellow-100 text-yellow-700"
    case "Advanced":
      return "bg-blue-100 text-blue-700"
    case "Expert":
      return "bg-green-100 text-green-700"
    default:
      return "bg-gray-200 text-gray-700"
  }
}

export const getMasteryIcon = (level: string): React.ReactNode => {
  switch (level) {
    case "Not Started":
      return React.createElement(AlertTriangle, { className: "h-4 w-4" });
    case "Beginner":
      return React.createElement(XCircle, { className: "h-4 w-4" });
    case "Intermediate":
      return React.createElement(Info, { className: "h-4 w-4" });
    case "Advanced":
      return React.createElement(CheckCircle2, { className: "h-4 w-4" });
    case "Expert":
      return React.createElement(Award, { className: "h-4 w-4" });
    default:
      return React.createElement(Info, { className: "h-4 w-4" });
  }
}

// Custom components
export interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: number | string
  subtitle?: string
  color?: "blue" | "green" | "purple" | "amber" | "red" | "indigo"
}

export interface MasteryBadgeProps {
  level: string
}
