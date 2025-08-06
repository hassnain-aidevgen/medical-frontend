// Define types for API response
export interface StudyPlanWeeklyGoal {
  subject: string;
  description: string;
}

export interface StudyPlanResource {
  name: string;
  type?: string;
  description: string;
}

export interface StudyPlanTask {
  testResult: { score: number; correct: number; total: number; };
  _id: any;
  details: string;
  subject: string;
  duration: number;
  activity: string;
  resources?: StudyPlanResource[];
  isReview?: boolean;
}

export interface StudyPlanDay {
  date : string;
  dayOfWeek: string;
  focusAreas: string[];
  tasks: StudyPlanTask[];
}

export interface StudyPlanWeek {
  weekNumber: number;
  theme: string;
  focusAreas: string[];
  weeklyGoals: StudyPlanWeeklyGoal[];
  days: StudyPlanDay[];
}

export interface StudyPlanBook {
  title: string;
  author: string;
  description: string;
  relevantTopics?: string[];
}

export interface StudyPlanVideo {
  title: string;
  platform: string;
  description: string;
  relevantTopics?: string[];
}

export interface StudyPlanQuestionBank {
  title: string;
  description: string;
  relevantTopics?: string[];
}

export interface StudyPlanResources {
  books?: StudyPlanBook[];
  videos?: StudyPlanVideo[];
  questionBanks?: StudyPlanQuestionBank[];
}

export interface StudyPlanTip {
  title: string;
  description: string;
}

export interface StudyPlanExamInfo {
  exam: string;
  targetDate?: string;
  targetScore?: string;
  lastStudyDate?: string;
}

export interface StudyPlanData {
  title: string;
  overview: string;
  examInfo?: StudyPlanExamInfo;
  weeklyPlans: StudyPlanWeek[];
  resources?: StudyPlanResources;
  studyTips?: StudyPlanTip[];
}

export interface StudyPlanMetadata {
  generatedAt: string;
  model: string;
  examName: string;
  duration: string;
}

export interface StudyPlanResponse {
  completionStatus: any;
  planId: null;
  plan: StudyPlanData;
  metadata: StudyPlanMetadata;
}

export interface UserData {
  name: string;
  currentLevel: string;
  targetExam: string;
  examDate: string;
  strongSubjects: string[];
  weakSubjects: string[];
  availableHours: number;
  daysPerWeek: number;
  preferredLearningStyle: string;
  targetScore: string;
  specificGoals: string;
  additionalInfo: string;
  previousScores: string;
}

export interface StudyPlanResultsProps {
  plan: StudyPlanResponse;
  userData: UserData;
  onReset: () => void;
}
// Define types for form data
export interface FormData {
  // Personal details
  name: string
  // email: string
  currentLevel: "beginner" | "intermediate" | "advanced" | "expert"

  // Exam details
  targetExam: string
  examDate: string

  // Subject preferences
  strongSubjects: string[]
  weakSubjects: string[]

  // Study preferences
  availableHours: number
  daysPerWeek: number
  preferredLearningStyle: "visual" | "auditory" | "reading" | "kinesthetic" | "mixed"

  // Goals and objectives
  targetScore: string
  specificGoals: string

  // Additional information
  additionalInfo: string
  previousScores: string

  // Performance data integration
  usePerformanceData: boolean
  weakTopics: string[]
}

// Define types for form errors
export interface FormErrors {
  [key: string]: string
}

// Define type for performance data
export interface TopicMasteryData {
  name: string
  masteryScore: number
  masteryLevel: string
  isQuestPriority?: boolean
}

// Interface for performance data from the database
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

// Study plan response type
// export interface StudyPlanResponse {
//   planId?: string
//   plan: {
//     overview: {
//       examName: string
//       examDate?: string
//       totalWeeks: number
//       hoursPerWeek: number
//       focusAreas: string[]
//     }
//     weeklyPlans: {
//       weekNumber: number
//       theme: string
//       focus: string[]
//       days: {
//         dayOfWeek: string
//         tasks: {
//           subject: string
//           activity: string
//           duration: string
//           resources?: string[]
//         }[]
//       }[]
//     }[]
//     resources: {
//       [subject: string]: {
//         primary: string[]
//         supplementary: string[]
//         practice: string[]
//       }
//     }
//     recommendations: string[]
//   }
// }
