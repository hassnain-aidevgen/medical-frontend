// Define the study plan data structure types
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
  subject: string;
  duration: number;
  activity: string;
  resources?: StudyPlanResource[];
  isReview?: boolean;
}

export interface StudyPlanDay {
  dayOfWeek: string;
  focusAreas?: string[];
  tasks: StudyPlanTask[];
}

export interface StudyPlanWeek {
  weekNumber: number;
  theme: string;
  focusAreas?: string[];
  weeklyGoals?: StudyPlanWeeklyGoal[];
  days?: StudyPlanDay[];
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
  plan: StudyPlanData;
  metadata: StudyPlanMetadata;
}

// Define user data structure
export interface UserData {
  name: string;
  email: string;
  currentLevel: string;
  targetExam: string;
  examDate: string;
  strongSubjects: string[];
  weakSubjects: string[];
  availableHours: number;
  daysPerWeek: number;
  preferredTimeOfDay: string;
  preferredLearningStyle: string;
  targetScore: string;
  specificGoals: string;
  additionalInfo: string;
  previousScores: string;
}
