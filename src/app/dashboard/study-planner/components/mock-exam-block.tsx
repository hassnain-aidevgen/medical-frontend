"use client"

import axios, { type AxiosError } from "axios"
import {
  AlertCircle,
  Award,
  BarChart,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  HelpCircle,
  Sparkles,
  X,
  XCircle,
} from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface MockExamBlockProps {
  weekNumber: number
  weekTheme: string
  focusAreas: string[]
  dayOfWeek: string
  examNumber: number
}

interface Question {
  _id: string
  question: string
  options: string[]
  specialty: string
  topic: string
  system: string
  exam_type?: string
  difficulty?: "easy" | "medium" | "hard"
  subject?: string
  subsection?: string
}

interface QuestionAnalytics {
  totalAttempts: number
  avgResponseTime: number
  correctPercentage: number
}

interface AnswerResult {
  isCorrect: boolean
  correctAnswer: string
  explanation: string
}

interface SubmitAnswerResponse {
  success: boolean
  isCorrect: boolean
  correctAnswer: string
  explanation: string
  sessionComplete: boolean
  flashcardCreated?: boolean
  flashcardCategory?: string
  metrics?: {
    totalCorrect: number
    totalQuestions: number
    averageTimePerQuestion: number
  }
}

export const MockExamBlock: React.FC<MockExamBlockProps> = ({ weekNumber, weekTheme, focusAreas, examNumber }) => {
  const [showExam, setShowExam] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [examCompleted, setExamCompleted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [timeStarted, setTimeStarted] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState({
    correct: 0,
    total: 0,
    percentage: 0,
    timeSpent: 0,
  })

  // Analytics states
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // AI Explanation states
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isLoadingAiExplanation, setIsLoadingAiExplanation] = useState(false)
  const [aiExplanationError, setAiExplanationError] = useState<string | null>(null)

  // UI states
  const [isExplanationVisible, setIsExplanationVisible] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [flashcardCreated, setFlashcardCreated] = useState<boolean>(false)
  const [flashcardCategory, setFlashcardCategory] = useState<string | null>(null)

  // Calculate duration based on week number (more advanced weeks get longer exams)
  const duration = Math.min(30 + weekNumber * 5, 60)

  // Generate a name for the exam based on the week theme
  const examName = `Mini Assessment ${examNumber}: ${weekTheme}`

  // Select topics to cover (use focus areas or generate based on week)
  const topicsCovered = focusAreas.slice(0, Math.min(3, focusAreas.length))

  // Calculate a score range based on the week number
  const minScore = Math.max(60, 65 + weekNumber * 2)
  const maxScore = Math.min(95, minScore + 15)

  // Update elapsed time every second
  useEffect(() => {
    if (!answerResult && !examCompleted && showExam) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - timeStarted) / 1000))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeStarted, answerResult, examCompleted, showExam])

  // Fetch questions from API
const fetchQuestions = async () => {
  setIsLoading(true);
  try {
    // Step 1: Get subject IDs from names
    const subjectNames = focusAreas.join(",");
    const idsResponse = await axios.get("https://medical-backend-3eek.onrender.com/api/test/subjects/get-ids", {
      params: { names: subjectNames }
    });
    
    if (!idsResponse.data.success || idsResponse.data.subjectIds.length === 0) {
      throw new Error("Failed to map subject names to IDs");
    }
    
    // Step 2: Use the IDs to fetch questions
    const subjects = idsResponse.data.subjectIds.join(",");
    const count = Math.min(5 + Math.floor(weekNumber / 2), 10);
    
    console.log("params in question fetch", {
      subjects,
      count,
      exam_type: "ALL_USMLE_TYPES",
    });
    
    const response = await axios.get("https://medical-backend-3eek.onrender.com/api/test/take-test/questions", {
      params: {
        subjects,
        count,
        exam_type: "ALL_USMLE_TYPES",
      },
    });
    
    setQuestions(response.data);
    console.log(`Fetched ${response.data.length} questions`);
  } catch (error) {
    console.error("Error fetching questions:", error);
    toast.error("Failed to load questions. Please try again.", {
      duration: 3000,
      position: "top-center",
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleStartExam = async () => {
    await fetchQuestions()
    setShowExam(true)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setExamCompleted(false)
    setTimeStarted(Date.now())
    setElapsedTime(0)
  }

  const handleCloseExam = () => {
    setShowExam(false)
  }

  const handleSelectAnswer = (answerText: string) => {
    setSelectedAnswer(answerText)
  }

  const fetchQuestionAnalytics = async (questionId: string) => {
    setIsLoadingAnalytics(true)
    setAnalyticsError(null)

    try {
      // Check if this is a recommended question (starts with 'rec-' or 'rec_')
      if (questionId.startsWith("rec-") || questionId.startsWith("rec_")) {
        // Provide default analytics for recommended questions
        setTimeout(() => {
          setQuestionAnalytics({
            totalAttempts: 1,
            avgResponseTime: 30,
            correctPercentage: 50,
          })
          setIsLoadingAnalytics(false)
        }, 500) // Small delay to simulate loading
        return
      }

      // Question analytics API call - use the same domain as other API calls
      const response = await axios.get(
        `https://medical-backend-3eek.onrender.com/api/test/take-test/question-analytics/${questionId}`,
      )
      setQuestionAnalytics(response.data)
    } catch (error) {
      console.error("Error fetching question analytics:", error)

      // Set default analytics data even when there's an error
      setQuestionAnalytics({
        totalAttempts: 3,
        avgResponseTime: 35,
        correctPercentage: 70,
      })

      setAnalyticsError("Failed to load question analytics")
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

 const fetchAiExplanation = async (questionId: string, userAnswer: string | null, correctAnswer: string) => {
        setIsLoadingAiExplanation(true);
        setAiExplanationError(null);
        setAiExplanation(null); // Clear previous explanation

        try {
            // In this file, currentQuestion is derived from the 'questions' state
            const currentQuestion = questions[currentQuestionIndex];
            const safeOptions = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];

            const response = await axios.post(`https://medical-backend-3eek.onrender.com/api/ai-explain/ai-explain`, {
                question: currentQuestion.question,
                options: safeOptions,
                correctAnswer: correctAnswer, // Pass the correct answer from the submission logic
                userAnswer: userAnswer || "No answer provided",
            });

            if (response.data.explanation) {
                setAiExplanation(response.data.explanation);
            } else {
                throw new Error("Received an empty explanation from the server.");
            }

        } catch (error) {
            console.error("Error fetching AI explanation:", error);
            let errorMessage = "Failed to load AI explanation. The service may be temporarily unavailable.";
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            setAiExplanationError(errorMessage);
            setAiExplanation(errorMessage); // Display error in the explanation box
        } finally {
            setIsLoadingAiExplanation(false);
        }
    };

 const submitAnswer = async () => {
    if (!selectedAnswer) {
      toast.error("Please select an answer before submitting", {
        duration: 2000,
        position: "top-center",
        icon: "⚠️",
      })
      return
    }

    setIsSubmitting(true)
    const timeSpent = Math.floor((Date.now() - timeStarted) / 1000)

    try {
      const currentQuestion = questions[currentQuestionIndex]

      // This is a simulated response for the mock exam.
      const isCorrect = selectedAnswer === currentQuestion.options[0]; // Example: correct answer is always the first option for this mock
      const correctAnswer = currentQuestion.options[0];

      const mockResponse: SubmitAnswerResponse = {
        success: true,
        isCorrect: isCorrect,
        correctAnswer: correctAnswer,
        explanation: `This is an explanation for the question about ${currentQuestion.topic || currentQuestion.specialty}.`,
        sessionComplete: currentQuestionIndex === questions.length - 1,
        flashcardCreated: !isCorrect,
        flashcardCategory: "Mistakes",
      }

      setAnswerResult({
        isCorrect: mockResponse.isCorrect,
        correctAnswer: mockResponse.correctAnswer,
        explanation: mockResponse.explanation,
      })

      if (mockResponse.flashcardCreated) {
        setFlashcardCreated(true)
        setFlashcardCategory(mockResponse.flashcardCategory || "Mistakes")
      } else {
        setFlashcardCreated(false)
      }

      // Fetch analytics and AI explanation
      fetchQuestionAnalytics(currentQuestion._id)
      // FIX: Pass all three required arguments: questionId, selectedAnswer, and correctAnswer
      fetchAiExplanation(currentQuestion._id, selectedAnswer, mockResponse.correctAnswer)

      if (mockResponse.isCorrect) {
        toast.success("Correct answer! 🎉", {
          duration: 2000,
          position: "top-center",
        })
      } else {
        toast("Incorrect answer", {
          duration: 2000,
          position: "top-center",
          icon: "❌",
        })
      }

      // Update results
      setResults(prevResults => {
          const newCorrectCount = prevResults.correct + (mockResponse.isCorrect ? 1 : 0);
          const newTotalCount = prevResults.total + 1;
          return {
              correct: newCorrectCount,
              total: newTotalCount,
              percentage: Math.round((newCorrectCount / newTotalCount) * 100),
              timeSpent: prevResults.timeSpent + timeSpent,
          };
      });

    } catch (error) {
      console.error("Error submitting answer:", error)
      const axiosError = error as AxiosError
      const errorMessage = (axiosError.response?.data as { message?: string })?.message || "Failed to submit answer";
      toast.error(errorMessage, {
        duration: 3000,
        position: "top-center",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  useEffect(() => {
    if (answerResult) {
      setIsExplanationVisible(true)
      setShowPopup(true)
      const timer = setTimeout(() => setShowPopup(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [answerResult])

  const toggleExplanation = () => {
    setIsExplanationVisible(!isExplanationVisible)
    setShowPopup(false)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setTimeStarted(Date.now())
      setElapsedTime(0)
      setQuestionAnalytics(null)
      setAiExplanation(null)
      setIsExplanationVisible(false) // Reset explanation visibility

      toast(`Question ${currentQuestionIndex + 2} of ${questions.length}`, {
        duration: 2000,
        position: "top-center",
        icon: "📝",
      })
    } else {
      // This is the last question, now we can go to results
      setExamCompleted(true)
      toast.success("Exam completed! 🏆", {
        duration: 3000,
        position: "top-center",
      })
    }
  }

  const calculateScore = (): number => {
    return results.percentage || 0
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const FlashcardNotification = () => {
    if (!flashcardCreated) return null

    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-blue-500 mr-2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 10h20" />
            </svg>
            <h4 className="text-base font-medium text-blue-700">Flashcard Created</h4>
          </div>
          <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">Category: {flashcardCategory}</div>
        </div>
        <p className="text-sm text-blue-600 mb-3">This question has been added to your flashcards for later review.</p>
      </div>
    )
  }

  // If the exam is being shown, render the exam interface
  if (showExam) {
    if (isLoading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto p-6">
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-16 h-16 mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </div>
              <div className="text-xl font-bold mb-4">Loading questions...</div>
              <p className="text-muted-foreground">Preparing your exam</p>
            </div>
          </div>
        </div>
      )
    }

    if (examCompleted) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
              <h3 className="font-semibold text-indigo-800">{examName} - Results</h3>
              <button onClick={handleCloseExam} className="p-1 rounded-full hover:bg-indigo-100 text-indigo-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-800 mb-4">
                  <Award size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Exam Completed!</h3>
                <p className="text-gray-600">You&apos;ve completed the {examName}</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-800 mb-1">{calculateScore()}%</div>
                  <div className="text-sm text-indigo-600">Your Score</div>
                </div>

                <div className="w-full bg-white h-3 rounded-full mt-4">
                  <div
                    className={`h-3 rounded-full ${calculateScore() >= minScore ? "bg-green-500" : "bg-amber-500"}`}
                    style={{ width: `${calculateScore()}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>
                    Target: {minScore}% - {maxScore}%
                  </span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-800">Performance Analysis</h4>

                {calculateScore() >= 80 ? (
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900 flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-green-800 dark:text-green-300">Excellent Performance!</h3>
                      <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                        You&apos;ve demonstrated mastery of this topic. Your understanding of the material is
                        exceptional.
                      </p>
                    </div>
                  </div>
                ) : calculateScore() >= 60 ? (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900 flex items-start">
                    <Brain className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-blue-800 dark:text-blue-300">Good Performance!</h3>
                      <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                        You have a solid understanding of the material. With a bit more practice, you&apos;ll master
                        these concepts.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900 flex items-start">
                    <HelpCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-amber-800 dark:text-amber-300">Keep Practicing!</h3>
                      <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                        This topic needs more attention. Review the material and try again to improve your
                        understanding.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCloseExam}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Close Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const currentQuestion = questions[currentQuestionIndex]

    if (!currentQuestion) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto p-6">
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-xl font-bold mb-4">No questions found</div>
              <Button onClick={handleCloseExam}>Close Exam</Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
          <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
            <div>
              <h3 className="font-semibold text-indigo-800">{examName}</h3>
              <p className="text-xs text-indigo-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center">
              <div className="mr-4 flex items-center bg-indigo-100 px-3 py-1 rounded-md">
                <Clock className="h-4 w-4 mr-2 text-indigo-700" />
                <span className="text-sm font-medium text-indigo-700">{formatTime(elapsedTime)}</span>
              </div>
              <button onClick={handleCloseExam} className="p-1 rounded-full hover:bg-indigo-100 text-indigo-700">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="relative mb-2">
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-[400px] overflow-x-hidden">
            {/* Left Column - Question */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <div className="w-full mb-6 border-2 border-muted rounded-lg h-full">
                <div className="bg-muted/20 p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium">
                        {currentQuestion.specialty || currentQuestion.subject} -{" "}
                        {currentQuestion.topic || currentQuestion.subsection}
                      </h4>
                      <p className="text-sm text-muted-foreground">{currentQuestion.system}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.exam_type && (
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          {currentQuestion.exam_type.replace("_", " ")}
                        </span>
                      )}
                      {currentQuestion.difficulty && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            currentQuestion.difficulty === "easy"
                              ? "bg-green-50 text-green-700"
                              : currentQuestion.difficulty === "medium"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="text-lg font-medium leading-relaxed">{currentQuestion.question}</div>

                    {!answerResult ? (
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => {
                          const optionLetter = String.fromCharCode(65 + index)
                          return (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.01 }}
                              className={`flex items-center space-x-2 border-2 rounded-md p-4 hover:bg-muted/30 cursor-pointer transition-colors ${
                                selectedAnswer === option ? "border-primary bg-primary/5" : "border-muted"
                              }`}
                              onClick={() => handleSelectAnswer(option)}
                            >
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 flex-shrink-0 ${
                                  selectedAnswer === option
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {optionLetter}
                              </div>
                              <label className="flex-1 cursor-pointer">{option}</label>
                            </motion.div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => {
                          const optionLetter = String.fromCharCode(65 + index)
                          const isSelected = selectedAnswer === option
                          const isCorrect = answerResult.correctAnswer === option

                          let className = "flex items-center space-x-2 border-2 rounded-md p-4"
                          let iconComponent = null

                          if (isCorrect) {
                            className += " bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                            iconComponent = <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          } else if (isSelected) {
                            className += " bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                            iconComponent = <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          }

                          return (
                            <div key={index} className={className}>
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 flex-shrink-0 ${
                                  isCorrect
                                    ? "bg-green-500 text-white"
                                    : isSelected
                                      ? "bg-red-500 text-white"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {optionLetter}
                              </div>
                              <div className="flex-1">{option}</div>
                              {iconComponent}
                            </div>
                          )
                        })}

                        {/* Question Analytics Section */}
                        {answerResult && questionAnalytics && (
                          <div className="mt-6 pt-4 border-t border-slate-200">
                            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <BarChart className="h-5 w-5 text-blue-500 mr-2" />
                                  <h4 className="text-base font-medium text-slate-700">Question Analytics</h4>
                                </div>

                                {/* Correct/Wrong Tag */}
                                <div
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    selectedAnswer === answerResult.correctAnswer
                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                      : "bg-red-100 text-red-700 border border-red-200"
                                  }`}
                                >
                                  {selectedAnswer === answerResult.correctAnswer ? "Correct" : "Wrong"}
                                </div>
                              </div>

                              {/* Correct Answer Display */}
                              <div className="mb-3 pb-3 border-b border-slate-100">
                                <div className="text-sm text-slate-500 mb-1">Correct Answer:</div>
                                <div className="font-medium text-slate-800">{answerResult.correctAnswer}</div>
                              </div>

                              {isLoadingAnalytics ? (
                                <div className="flex justify-center p-2">
                                  <div className="animate-pulse flex space-x-4">
                                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                  {/* Total Attempts with Icon */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4 text-blue-500"
                                      >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500">Total</div>
                                      <div className="font-medium text-slate-700">
                                        {questionAnalytics.totalAttempts} <span className="text-xs">attempts</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Correct Answers with Icon */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4 text-emerald-500"
                                      >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500">Correct</div>
                                      <div className="font-medium text-slate-700">
                                        {Math.round(
                                          questionAnalytics.totalAttempts * (questionAnalytics.correctPercentage / 100),
                                        )}{" "}
                                        <span className="text-xs">correct</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Avg Response Time with Icon */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4 text-amber-500"
                                      >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500">Avg. Response Time</div>
                                      <div className="font-medium text-slate-700">
                                        {questionAnalytics.avgResponseTime.toFixed(1)}{" "}
                                        <span className="text-xs">seconds</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Success Rate with Icon */}
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        questionAnalytics.correctPercentage >= 70
                                          ? "bg-emerald-100"
                                          : questionAnalytics.correctPercentage >= 40
                                            ? "bg-amber-100"
                                            : "bg-red-100"
                                      }`}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`h-4 w-4 ${
                                          questionAnalytics.correctPercentage >= 70
                                            ? "text-emerald-500"
                                            : questionAnalytics.correctPercentage >= 40
                                              ? "text-amber-500"
                                              : "text-red-500"
                                        }`}
                                      >
                                        <line x1="19" y1="5" x2="5" y2="19"></line>
                                        <circle cx="6.5" cy="6.5" r="2.5"></circle>
                                        <circle cx="17.5" cy="17.5" r="2.5"></circle>
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500">Success Rate</div>
                                      <div
                                        className={`font-medium ${
                                          questionAnalytics.correctPercentage >= 70
                                            ? "text-emerald-600"
                                            : questionAnalytics.correctPercentage >= 40
                                              ? "text-amber-600"
                                              : "text-red-600"
                                        }`}
                                      >
                                        {questionAnalytics.correctPercentage.toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {answerResult && !answerResult.isCorrect && <FlashcardNotification />}

                        {/* Toggle Explanation Button (only visible on mobile) */}
                        {answerResult && (
                          <div className="flex justify-end mt-4 lg:hidden">
                            <div className="relative flex items-center">
                              <Button
                                onClick={toggleExplanation}
                                variant="ghost"
                                className={`
                                  p-2 rounded-full transition-all duration-500 h-10 w-10
                                  ${
                                    isExplanationVisible
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }
                                `}
                              >
                                <Separator className="h-5 w-5" />
                              </Button>
                              {showPopup && (
                                <div className="left-full ml-2 bg-blue-500 text-white text-xs py-1 px-2 rounded whitespace-nowrap animate-bounce">
                                  Show explanation
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between p-6 bg-muted/10 border-t">
                  {!answerResult ? (
                    <Button
                      onClick={submitAnswer}
                      disabled={!selectedAnswer || isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                          Submitting...
                        </>
                      ) : (
                        "Submit Answer"
                      )}
                    </Button>
                  ) : (
                    <Button onClick={nextQuestion} className="w-full bg-primary hover:bg-primary/90">
                      {currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Results"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Explanation and Analytics */}
            <div
              className={`w-full lg:w-[400px] rounded-xl shadow-md overflow-hidden transition-all duration-300 ease-in-out relative
                ${
                  isExplanationVisible
                    ? "max-h-[800px] opacity-100 transform-none"
                    : "max-h-0 opacity-0 lg:opacity-100 lg:max-h-full lg:translate-x-[150%]"
                }
              `}
            >
              {/* Subtle pattern background */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-amber-100/50">
                <div
                  className="absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23925103' fillOpacity='0.15' fillRule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>

              <div className="relative h-full p-6 overflow-y-auto">
                {answerResult && (
                  <div className="space-y-6">
                    {/* AI Explanation Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-purple-800">
                        <Sparkles className="h-5 w-5" />
                        <h4 className="font-semibold">AI Explanation</h4>
                      </div>
                      <div className="pl-4 border-l-2 border-purple-200">
                        {isLoadingAiExplanation ? (
                          <div className="text-slate-600 backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                            Loading AI explanation...
                          </div>
                        ) : aiExplanationError ? (
                          <div className="text-red-500 backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                            {aiExplanationError}
                          </div>
                        ) : (
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                            {aiExplanation || answerResult.explanation || "No explanation available"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Standard Explanation Section */}
                    {answerResult.explanation && answerResult.explanation !== aiExplanation && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertCircle className="h-5 w-5" />
                          <h4 className="font-semibold">Detailed Explanation</h4>
                        </div>
                        <div className="pl-4 border-l-2 border-amber-200">
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                            {answerResult.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Toaster position="top-center" />
        </div>
      </div>
    )
  }

  // Default view (when exam is not being shown)
  return (
    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BookOpen className="text-indigo-600 mr-2" size={20} />
          <h4 className="font-medium text-indigo-800">{examName}</h4>
        </div>
        <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-1 rounded-full">Checkpoint</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-indigo-700">
          <Clock className="mr-2" size={16} />
          <span>Duration: {duration} minutes</span>
        </div>

        <div className="flex items-start text-sm text-indigo-700">
          <BookOpen className="mr-2 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <div className="font-medium mb-1">Topics Covered:</div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              {topicsCovered.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center text-sm text-indigo-700">
          <Award className="mr-2" size={16} />
          <span>
            Target Score: {minScore}% - {maxScore}%
          </span>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleStartExam}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            Start Practice Exam
          </button>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
