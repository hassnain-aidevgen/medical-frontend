"use client"

import axios from "axios"
import { AlertCircle, BarChart, Brain, CheckCircle, ChevronLeft, ChevronRight, Clock, HelpCircle, Sparkles, Timer, XCircle } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import TargetExamSelector from "@/components/TargetExamSelector"

// Types definitions
interface SimulationQuestion {
  _id: string
  question?: string // Added to support API response format
  questionText: string
  options: string[]
  correctAnswer: string
  subject: string
  subsection: string
  difficulty: string
  explanation?: string
  answer?: string
  specialty?: string   // Added to align with challenge page
  topic?: string       // Added to align with challenge page
  system?: string      // Added to align with challenge page
}

interface SimulationConfig {
  duration: number // in minutes
  totalQuestions: number
  examName: string
}

interface UserAnswer {
  questionId: string
  selectedAnswer: string | null
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

// Exam-specific configurations
const examConfigs: Record<string, SimulationConfig> = {
  "USMLE Step 1": { duration: 10, totalQuestions: 10, examName: "USMLE Step 1" },
  NEET: { duration: 10, totalQuestions: 10, examName: "NEET" },
  PLAB: { duration: 10, totalQuestions: 10, examName: "PLAB" },
  MCAT: { duration: 10, totalQuestions: 10, examName: "MCAT" },
  NCLEX: { duration: 10, totalQuestions: 10, examName: "NCLEX" },
  COMLEX: { duration: 10, totalQuestions: 10, examName: "COMLEX" },
  DEFAULT: { duration: 10, totalQuestions: 10, examName: "Medical Exam" },
}

const ExamSimulation: React.FC = () => {
  // State for simulation
  const [isSimulationActive, setIsSimulationActive] = useState(false)
  const [isSimulationComplete, setIsSimulationComplete] = useState(false)
  const [simulationQuestions, setSimulationQuestions] = useState<SimulationQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // in seconds
  const [isLoading, setIsLoading] = useState(false)
  const [examConfig, setExamConfig] = useState<SimulationConfig>(examConfigs["DEFAULT"])
  const [userId, setUserId] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [simulationResults, setSimulationResults] = useState<{
    score: number
    totalQuestions: number
    percentage: number
    timeSpent: number
  } | null>(null)
  
  // Added states for explanations and analytics (from challenge page)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isLoadingAiExplanation, setIsLoadingAiExplanation] = useState(false)
  const [aiExplanationError, setAiExplanationError] = useState<string | null>(null)
  const [isExplanationVisible, setIsExplanationVisible] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [flashcardCreated, setFlashcardCreated] = useState<boolean>(false)
  const [flashcardCategory, setFlashcardCategory] = useState<string | null>(null)
  const [timeStarted, setTimeStarted] = useState<number>(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  interface SimulationHistoryEntry {
    id: number
    date: string
    examName: string
    score: number
    questionsAnswered: number
    duration: string
  }

  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [examDate, setExamDate] = useState<string>("")

  // Timer ref for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Fetch question analytics function
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

  // Fetch AI explanation function
  const fetchAiExplanation = async (questionId: string, userAnswer: string | null, correctAnswer: string) => {
        setIsLoadingAiExplanation(true);
        setAiExplanationError(null);
        setAiExplanation(null); // Clear previous explanation

        try {
            const currentQuestion = simulationQuestions[currentQuestionIndex];
            const safeOptions = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];

            const response = await axios.post(`https://medical-backend-3eek.onrender.com/api/ai-explain/ai-explain`, {
                question: currentQuestion.questionText || currentQuestion.question,
                options: safeOptions,
                correctAnswer: correctAnswer,
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

  // Toggle explanation visibility
  const toggleExplanation = () => {
    setIsExplanationVisible(!isExplanationVisible)
    setShowPopup(false)
  }

  // Wrap fetchSimulationHistory in useCallback to prevent it from changing on every render
  const fetchSimulationHistory = useCallback(async () => {
    try {
      const user_id = localStorage.getItem("Medical_User_Id")
      const { data } = await axios.get(
        `https://medical-backend-3eek.onrender.com/api/simulation/getSimulationHistory?userId=${user_id}`,
      )
      // console.log(data)
      setSimulationHistory(data.data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to fetch history")
    }
  }, [])

  // Modified submitSimulation function to include analytics and explanation features
  const submitSimulation = useCallback(() => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Calculate score
    let correctCount = 0
    userAnswers.forEach((answer) => {
      const question = simulationQuestions.find((q) => q._id === answer.questionId)
      if (question && answer.selectedAnswer) {
        console.log(question)
        const selectedAnswerText = answer.selectedAnswer
        const correctAnswerParts = question.answer || question.correctAnswer

        // Check if the selected answer matches the correct answer
        if (
          selectedAnswerText.startsWith(correctAnswerParts || "") ||
          selectedAnswerText.includes(correctAnswerParts || "")
        ) {
          correctCount++
        }
      }
    })

    const timeSpent = examConfig.duration * 60 - timeRemaining

    // Set results
    const results = {
      score: correctCount,
      totalQuestions: simulationQuestions.length,
      percentage: Math.round((correctCount / simulationQuestions.length) * 100),
      timeSpent: timeSpent, // in seconds
    }

    setSimulationResults(results)
    setIsSimulationComplete(true)

    // Save to history (this would normally be sent to a backend)
    const historyEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      examName: selectedExam,
      score: results.percentage,
      questionsAnswered: simulationQuestions.length,
      allQuestions: simulationQuestions,
      duration: formatTime(timeSpent),
    }

    const saveToDb = {
      userId,
      examName: selectedExam,
      score: results.percentage,
      percentage: results.percentage,
      questionsAnswered: userAnswers.length,
      totalQuestions: simulationQuestions.length,
      timeSpent,
      questions: simulationQuestions,
    }

    setSimulationHistory((prev) => [historyEntry, ...prev])

    try {
      axios.post("https://medical-backend-3eek.onrender.com/api/simulation/saveSimulationHistory", saveToDb)
    } catch (error) {
      console.error(error)
    }

    toast.success("Simulation completed!")
  }, [examConfig.duration, selectedExam, setSimulationHistory, simulationQuestions, timeRemaining, userAnswers, userId])

  // Start simulation function - wrap in useCallback to use in dependency array
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - submit automatically
          clearInterval(timerRef.current as NodeJS.Timeout)
          submitSimulation()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [submitSimulation])

  const startSimulation = useCallback(async () => {
    if (!selectedExam) {
      toast.error("Please select an exam in the calendar settings first")
      return
    }

    setIsLoading(true)

    try {
      // Initialize timer based on selected exam
      const config = examConfigs[selectedExam] || examConfigs["DEFAULT"]
      setExamConfig(config)
      setTimeRemaining(config.duration * 60) // Convert minutes to seconds

      // Get subjects relevant to the selected exam
      const examSubjects = getExamSubjects(selectedExam)
      const relatedSubjects = getRelatedSubjects(selectedExam)

      // Calculate question distribution (80% core subjects, 20% related)
      const totalQuestions = config.totalQuestions
      const examSpecificCount = Math.floor(totalQuestions * 0.8)
      const relatedSubjectsCount = totalQuestions - examSpecificCount

      let simulationQs: SimulationQuestion[] = []

      try {
        // Fetch main subject questions (80%)
        const examSpecificResponse = await axios.get(
          "https://medical-backend-3eek.onrender.com/api/test/take-test/questions-fixed",
          {
            params: {
              subjects: examSubjects.join(","),
              count: examSpecificCount,
              userId, // Include userId in the request if your API needs it
            },
          },
        )

        // Fetch related subject questions (20%)
        const relatedSubjectsResponse = await axios.get(
          "https://medical-backend-3eek.onrender.com/api/test/take-test/questions-fixed",
          {
            params: {
              subjects: relatedSubjects.join(","),
              count: relatedSubjectsCount,
              userId, // Include userId in the request if your API needs it
            },
          },
        )

        // Combine and shuffle questions
        simulationQs = [...examSpecificResponse.data, ...relatedSubjectsResponse.data].sort(() => Math.random() - 0.5)
      } catch (error) {
        console.error("Error fetching questions from API:", error)
        toast("Using sample questions due to API connectivity issues")

        // Fallback to mock data
        // simulationQs = generateMockQuestions(selectedExam, totalQuestions);
      }

      console.log(simulationQs)
      // Initialize simulation state
      setSimulationQuestions(simulationQs)
      setCurrentQuestionIndex(0)
      setUserAnswers(simulationQs.map((q) => ({ questionId: q._id, selectedAnswer: null })))
      setIsSimulationActive(true)
      setIsSimulationComplete(false)
      setSimulationResults(null)

      // Reset explanation and analytics states
      setAiExplanation(null)
      setQuestionAnalytics(null)
      setAnswerResult(null)
      setIsExplanationVisible(false)
      setFlashcardCreated(false)
      setFlashcardCategory(null)

      // Start the countdown timer
      startTimer()
    } catch (error) {
      console.error("Error starting simulation:", error)
      toast.error("Failed to start simulation. Please try again.")

      setCurrentQuestionIndex(0)
      //   setUserAnswers(mockQuestions.map(q => ({ questionId: q._id, selectedAnswer: null })));
      setIsSimulationActive(true)
      setIsSimulationComplete(false)
      setSimulationResults(null)

      // Start the countdown timer
      startTimer()
    } finally {
      setIsLoading(false)
    }
  }, [selectedExam, userId, startTimer]) // Added startTimer to the dependency array

  // Check for simulation requests from Today Dashboard
  useEffect(() => {
    const checkForSimulationRequest = () => {
      if (typeof window !== "undefined") {
        const startSimulationFlag = localStorage.getItem("startSimulation")

        if (startSimulationFlag === "true") {
          // Clear the flag immediately to prevent multiple starts
          localStorage.removeItem("startSimulation")

          // Get the simulation details
          const simulationType = localStorage.getItem("simulationType")
          const simulationSubject = localStorage.getItem("simulationSubject")
          const simulationTitle = localStorage.getItem("simulationTitle")
          const storedExam = localStorage.getItem("selectedExam")

          // Log the details for debugging (can be removed later)
          console.log("Starting simulation:", { simulationType, simulationSubject, simulationTitle, storedExam })

          // Update the selected exam if it's available
          if (storedExam && storedExam !== selectedExam) {
            setSelectedExam(storedExam)
            setExamConfig(examConfigs[storedExam] || examConfigs["DEFAULT"])
          }

          // Only start if we're not already in a simulation
          if (!isSimulationActive && !isSimulationComplete) {
            // Small delay to ensure the component is fully rendered and exam is set
            setTimeout(() => {
              startSimulation()
            }, 800) // Increased delay to ensure state updates
          }
        }
      }
    }

    // Check when component mounts
    checkForSimulationRequest()

    // Set up interval to check periodically
    const intervalId = setInterval(checkForSimulationRequest, 2000)

    return () => {
      clearInterval(intervalId)
    }
  }, [isSimulationActive, isSimulationComplete, selectedExam, startSimulation]) // Added startSimulation to dependencies

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      // const storedExam = localStorage.getItem("selectedExam")

      setUserId(storedUserId || "")

      // if (storedExam) {
      //   setSelectedExam(storedExam)
      //   setExamConfig(examConfigs[storedExam] || examConfigs["DEFAULT"])
      // }
    }

    // Optionally fetch simulation history if you implement that feature
    fetchSimulationHistory()

    return () => {
      // Cleanup timer on component unmount
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [fetchSimulationHistory])

  // Show explanation popup when answer is submitted
  useEffect(() => {
    if (answerResult) {
      setIsExplanationVisible(true)
      setShowPopup(true)
      const timer = setTimeout(() => setShowPopup(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [answerResult])

  const handleExamChange = (exam: string) => {
    setSelectedExam(exam)
    setExamConfig(examConfigs[exam] || examConfigs["DEFAULT"])
  }

  // Handle exam date changes
  const handleExamDateChange = (date: string) => {
    setExamDate(date)
  }

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < simulationQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      // Reset explanation and analytics states for the new question
      setAiExplanation(null)
      setQuestionAnalytics(null)
      setAnswerResult(null)
      setIsExplanationVisible(false)
      setFlashcardCreated(false)
      setFlashcardCategory(null)
      setTimeStarted(Date.now()) // Reset timer for the new question
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      // Reset explanation and analytics states for the new question
      setAiExplanation(null)
      setQuestionAnalytics(null)
      setAnswerResult(null)
      setIsExplanationVisible(false)
      setFlashcardCreated(false)
      setFlashcardCategory(null)
      setTimeStarted(Date.now()) // Reset timer for the new question
    }
  }

  // Enhanced answer selection function with submission capability
  const handleAnswerSelection = (answer: string) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev]
      const currentQuestion = simulationQuestions[currentQuestionIndex]
      const answerIndex = newAnswers.findIndex((a) => a.questionId === currentQuestion._id)

      if (answerIndex !== -1) {
        newAnswers[answerIndex] = {
          ...newAnswers[answerIndex],
          selectedAnswer: answer,
        }
      }

      return newAnswers
    })
  }

  // Submit answer function (similar to the one in challenge page)
  const submitAnswer = async () => {
    const userAnswer = userAnswers.find(
      (a) => a.questionId === simulationQuestions[currentQuestionIndex]._id
    );
    
    if (!userAnswer?.selectedAnswer) {
      toast.error("Please select an answer before submitting", {
        duration: 2000,
        position: "top-center",
        icon: "⚠️",
      });
      return;
    }

    setIsSubmitting(true);
    const timeSpent = Math.floor((Date.now() - timeStarted) / 1000); // Time in seconds

    try {
      const currentQuestion = simulationQuestions[currentQuestionIndex];
      const correctAnswer = currentQuestion.correctAnswer || currentQuestion.answer || "";
      const isCorrect = userAnswer.selectedAnswer.startsWith(correctAnswer) || 
                        userAnswer.selectedAnswer.includes(correctAnswer);

      setAnswerResult({
        isCorrect,
        correctAnswer,
        explanation: currentQuestion.explanation || "No explanation provided."
      });

      // Fetch question analytics and AI explanation
      fetchQuestionAnalytics(currentQuestion._id);
      // FIX: Pass all three required arguments: questionId, userAnswer, and correctAnswer
      fetchAiExplanation(currentQuestion._id, userAnswer.selectedAnswer, correctAnswer);

      if (!isCorrect) {
        setFlashcardCreated(true);
        setFlashcardCategory("Mistakes");
      }

      if (isCorrect) {
        toast.success("Correct answer! 🎉", {
          duration: 2000,
          position: "top-center",
        });
      } else {
        toast("Incorrect answer", {
          duration: 2000,
          position: "top-center",
          icon: "❌",
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset simulation state
  const resetSimulation = () => {
    setIsSimulationActive(false)
    setIsSimulationComplete(false)
    setSimulationQuestions([])
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setTimeRemaining(0)
    setSimulationResults(null)
    setAiExplanation(null)
    setQuestionAnalytics(null)
    setAnswerResult(null)
    setIsExplanationVisible(false)
    setFlashcardCreated(false)
    setFlashcardCategory(null)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  // Get exam-specific subjects mapping
  const getExamSubjects = (exam: string) => {
    // This mapping would ideally come from your backend
    // Using the same mapping function from the main component
    const examSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"],
      NEET: ["Physics", "Chemistry", "Biology", "Zoology", "Botany"],
      PLAB: ["Clinical Medicine", "Surgery", "Obstetrics", "Gynecology", "Psychiatry"],
      MCAT: ["Biology", "Chemistry", "Physics", "Psychology"],
      NCLEX: ["Fundamentals", "Medical-Surgical", "Pharmacology", "Maternal Newborn", "Pediatrics"],
      COMLEX: ["Osteopathic Principles", "Anatomy", "Microbiology", "Pathology", "Pharmacology"],
    }

    return examSubjectsMap[exam] || []
  }

  // Get related subjects for an exam
  const getRelatedSubjects = (exam: string) => {
    // This would also ideally come from your backend
    // Using the same mapping function from the main component
    const relatedSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Microbiology", "Immunology", "Neuroscience", "Behavioral Science"],
      NEET: ["Organic Chemistry", "Inorganic Chemistry", "Human Physiology", "Genetics"],
      PLAB: ["Emergency Medicine", "Pediatrics", "Dermatology", "Public Health"],
      MCAT: ["Biochemistry", "Organic Chemistry", "Sociology", "Statistics"],
      NCLEX: ["Critical Care", "Community Health", "Leadership", "Mental Health"],
      COMLEX: ["OMT", "Clinical Applications", "Ethics", "Biostatistics"],
    }

    return relatedSubjectsMap[exam] || []
  }

  // Calculate the number of answered questions
  const getAnsweredCount = () => {
    return userAnswers.filter((answer) => answer.selectedAnswer !== null).length
  }

  // Flashcard notification component (from challenge page)
  const FlashcardNotification = () => {
    if (!flashcardCreated) return null

    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-5 w-5 text-blue-500 mr-2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 10h20" />
            </svg>
            <h4 className="text-base font-medium text-blue-700">Flashcard Created</h4>
          </div>
          <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
            Category: {flashcardCategory}
          </div>
        </div>
        <p className="text-sm text-blue-600 mb-3">
          This question has been added to your flashcards for later review.
        </p>
      </div>
    )
  }

  // Render different views based on simulation state
  if (!isSimulationActive) {
    // Start screen
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6" id="exam-simulation">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Quick Test</h2>
          <button onClick={() => setShowHistory(!showHistory)} className="text-blue-600 hover:underline">
            {showHistory ? "Hide History" : "View History"}
          </button>
        </div>
        
        <div className="mb-6">
          <TargetExamSelector
            selectedExam={selectedExam}
            onExamChange={handleExamChange}
            examDate={examDate}
            onDateChange={handleExamDateChange}
          />
        </div>

        {showHistory && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Simulation History</h3>
            {simulationHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border">Date</th>
                      <th className="px-4 py-2 border">Exam</th>
                      <th className="px-4 py-2 border">Score</th>
                      <th className="px-4 py-2 border">Questions</th>
                      <th className="px-4 py-2 border">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-2 border">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 border">{entry.examName}</td>
                        <td className="px-4 py-2 border">{entry.score}%</td>
                        <td className="px-4 py-2 border">{entry.questionsAnswered}</td>
                        <td className="px-4 py-2 border">{entry.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No simulation history available.</p>
            )}
          </div>
        )}

        <div className="text-center py-8">
          <div className="mb-6">
            {selectedExam ? (
              <div>
                <h3 className="text-lg font-medium mb-2">Ready to take a {selectedExam} quick test?</h3>
                <p className="text-gray-600 mb-2">
                  This quick test will include {examConfig.totalQuestions} questions to be completed in{" "}
                  {examConfig.duration} minutes, mimicking the real exam format and timing.
                </p>
                <p className="text-gray-600 mb-4">
                  80% of questions are from core {selectedExam} topics, while 20% cover related subjects that often
                  appear on the exam.
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <AlertCircle className="mx-auto mb-2 text-yellow-500" size={36} />
                <p className="text-gray-600">
                  Please select a target exam in the calendar settings first to personalize your simulation.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={startSimulation}
            disabled={isLoading || !selectedExam}
            className={`px-6 py-3 rounded-lg text-white font-medium flex items-center justify-center mx-auto 
              ${selectedExam ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <Timer className="mr-2" size={20} />
                Start {selectedExam || "Exam"} Simulation
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (isSimulationComplete) {
    // Results screen
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6" id="exam-simulation">
        <h2 className="text-xl font-semibold mb-6">Simulation Results</h2>

        {simulationResults && (
          <div className="text-center py-4">
            <div className="mb-6">
              <div className="text-5xl font-bold text-blue-600">{simulationResults.percentage}%</div>
              <div className="text-lg mt-2">
                You answered {simulationResults.score} out of {simulationResults.totalQuestions} questions correctly
              </div>
              <div className="text-gray-600 mt-1">Time spent: {formatTime(simulationResults.timeSpent)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Strengths</h3>
                <p className="text-gray-600">
                  Analysis of your strong areas will appear here when this feature is fully implemented.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Areas for Improvement</h3>
                <p className="text-gray-600">
                  Recommendations for improvement will appear here when this feature is fully implemented.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-medium mb-4">Question Review</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {simulationQuestions.map((question, index) => {
                  const userAnswer = userAnswers.find((a) => a.questionId === question._id)

                  // Get the correct answer from either correctAnswer or answer property
                  const correctAnswer = question.correctAnswer || question.answer

                  // Check if the answer exists and process it
                  let isCorrect = false
                  if (userAnswer?.selectedAnswer && correctAnswer) {
                    const correctAnswerParts = correctAnswer.split(": ")
                    isCorrect =
                      userAnswer.selectedAnswer.startsWith(correctAnswerParts[0]) ||
                      (correctAnswerParts.length > 1 && userAnswer.selectedAnswer.includes(correctAnswerParts[1]))
                  }

                  return (
                    <div
                      key={question._id}
                      className={`p-4 rounded-lg border ${userAnswer?.selectedAnswer
                          ? isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-red-300 bg-red-50"
                          : "border-gray-300"
                        }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">Question {index + 1}</span>
                        {userAnswer?.selectedAnswer ? (
                          isCorrect ? (
                            <CheckCircle className="text-green-500" size={20} />
                          ) : (
                            <XCircle className="text-red-500" size={20} />
                          )
                        ) : (
                          <span className="text-gray-500">Not answered</span>
                        )}
                      </div>
                      <p className="my-2">{question.question || question.questionText}</p>
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-600">Your answer:</div>
                        <div className={isCorrect ? "text-green-600" : "text-red-600"}>
                          {userAnswer?.selectedAnswer || "None"}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-600">Correct answer:</div>
                        <div className="text-green-600">{correctAnswer || "Not provided"}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button onClick={resetSimulation} className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Active simulation screen with added explanation and analytics features
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6" id="exam-simulation">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{selectedExam} Simulation</h2>
        <div className="flex items-center">
          <div className="text-gray-600 mr-4">
            {getAnsweredCount()}/{simulationQuestions.length} Answered
          </div>
          <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full flex items-center">
            <Timer className="mr-1" size={16} />
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {simulationQuestions.length > 0 && (
        <div>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                Question {currentQuestionIndex + 1} of {simulationQuestions.length}
              </span>
              {/* Show only subject and difficulty, NOT the question ID */}
              <span>
                {typeof simulationQuestions[currentQuestionIndex].subject === "string" &&
                  !simulationQuestions[currentQuestionIndex].subject.includes("67")
                  ? simulationQuestions[currentQuestionIndex].subject
                  : "Subject"}{" "}
                • {simulationQuestions[currentQuestionIndex].difficulty}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / simulationQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Main section with question and explanations */}
          <div className="flex flex-col lg:flex-row gap-6 min-h-[400px]">
            {/* Left Column - Question */}
            <div className="flex-1">
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">
                  {simulationQuestions[currentQuestionIndex].question ||
                    simulationQuestions[currentQuestionIndex].questionText}
                </h3>

                <div className="space-y-3">
                  {!answerResult ? (
                    // Not answered yet - show options to select
                    simulationQuestions[currentQuestionIndex].options.map((option) => {
                      const currentQuestion = simulationQuestions[currentQuestionIndex]
                      const userAnswer = userAnswers.find((a) => a.questionId === currentQuestion._id)
                      const isSelected = userAnswer?.selectedAnswer === option

                      return (
                        <div
                          key={option}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors 
                            ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"}`}
                          onClick={() => handleAnswerSelection(option)}
                        >
                          {option}
                        </div>
                      )
                    })
                  ) : (
                    // Answered - show correct/incorrect options
                    simulationQuestions[currentQuestionIndex].options.map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index)
                      const isSelected = userAnswers.find(
                        (a) => a.questionId === simulationQuestions[currentQuestionIndex]._id
                      )?.selectedAnswer === option
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
                            className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 flex-shrink-0 ${isCorrect
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
                    })
                  )}
                </div>

                {/* Question Analytics Section (only shown after answering) */}
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
                          className={`px-3 py-1 rounded-full text-sm font-medium ${userAnswers.find((a) => a.questionId === simulationQuestions[currentQuestionIndex]._id)?.selectedAnswer === answerResult.correctAnswer
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                        >
                          {userAnswers.find((a) => a.questionId === simulationQuestions[currentQuestionIndex]._id)?.selectedAnswer === answerResult.correctAnswer ? "Correct" : "Wrong"}
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
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${questionAnalytics.correctPercentage >= 70
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
                                className={`h-4 w-4 ${questionAnalytics.correctPercentage >= 70
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
                                className={`font-medium ${questionAnalytics.correctPercentage >= 70
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
                    <button 
                      onClick={toggleExplanation} 
                      className={`p-2 rounded-full h-10 w-10 transition-all duration-500
                        ${isExplanationVisible
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center py-2 px-4 rounded 
                    ${currentQuestionIndex === 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}
                >
                  <ChevronLeft size={20} className="mr-1" />
                  Previous
                </button>

                <div>
                  {!answerResult ? (
                    <button
                      onClick={submitAnswer}
                      disabled={!userAnswers.find(a => a.questionId === simulationQuestions[currentQuestionIndex]._id)?.selectedAnswer || isSubmitting}
                      className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div
                            className="mr-2 h-4 w-4 inline-block rounded-full border-2 border-white border-t-transparent animate-spin"
                          />
                          Submitting...
                        </>
                      ) : (
                        "Submit Answer"
                      )}
                    </button>
                  ) : currentQuestionIndex === simulationQuestions.length - 1 ? (
                    <button
                      onClick={submitSimulation}
                      className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700"
                    >
                      Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={goToNextQuestion}
                      className="flex items-center text-blue-600 py-2 px-4 rounded hover:bg-blue-50"
                    >
                      Next
                      <ChevronRight size={20} className="ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Explanation and Analytics */}
            <div
              className={`w-full lg:w-[400px] rounded-xl shadow-md overflow-hidden transition-all duration-300 ease-in-out relative
                ${isExplanationVisible
                  ? "max-h-[800px] opacity-100 transform-none"
                  : "max-h-0 opacity-0 lg:opacity-100 lg:max-h-full lg:hidden"
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
        </div>
      )}
    </div>
  )
}

export default ExamSimulation