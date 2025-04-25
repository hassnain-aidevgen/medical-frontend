"use client"

import axios, { type AxiosError } from "axios"
import { motion } from "framer-motion"
import {
    AlertCircle,
    ArrowLeft,
    BarChart,
    Brain,
    CheckCircle,
    Clock,
    HelpCircle,
    Sparkles,
    Trophy,
    XCircle,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

interface Question {
    _id: string
    question: string
    options: string[]
    specialty: string
    topic: string
    system: string
    exam_type?: string
    difficulty?: "easy" | "medium" | "hard"
}

interface QuestionAnalytics {
    totalAttempts: number
    avgResponseTime: number
    correctPercentage: number
}

interface SessionQuestion {
    questionId: string
    userAnswer: string | null
    isCorrect: boolean | null
    timeSpent: number | null
}

interface ChallengeSession {
    _id: string
    userId: string
    questions: SessionQuestion[]
    status: "in_progress" | "completed"
    metadata: {
        specialties: string[]
        topics: string[]
        difficultyLevel: string
        questionCount: number
    }
}

interface AnswerResult {
    isCorrect: boolean
    correctAnswer: string
    explanation: string
}

interface ChallengeResults {
    correct: number
    total: number
    percentage: number
    timeSpent: number
}

interface SubmitAnswerResponse {
    success: boolean
    isCorrect: boolean
    correctAnswer: string
    explanation: string
    sessionComplete: boolean
    metrics?: {
        totalCorrect: number
        totalQuestions: number
        averageTimePerQuestion: number
    }
}

interface SessionResponse {
    success: boolean
    session: {
        _id: string
        userId: string
        questions: Array<{
            questionId: string
            userAnswer: string | null
            isCorrect: boolean | null
            timeSpent: number | null
            question: string
            options: string[]
            correctAnswer: string
            explanation: string
            specialty: string
            topic: string
            system: string
        }>
        status: "in_progress" | "completed"
        metadata: {
            specialties: string[]
            topics: string[]
            difficultyLevel: string
            questionCount: number
        }
        metrics?: {
            totalCorrect: number
            totalQuestions: number
            averageTimePerQuestion: number
        }
    }
}

export default function ChallengePage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = params.sessionId as string

    const [isLoading, setIsLoading] = useState(true)
    const [session, setSession] = useState<ChallengeSession | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
    const [timeStarted, setTimeStarted] = useState<number>(Date.now())
    const [elapsedTime, setElapsedTime] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [results, setResults] = useState<ChallengeResults>({
        correct: 0,
        total: 0,
        percentage: 0,
        timeSpent: 0,
    })

    const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics | null>(null)
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
    const [analyticsError, setAnalyticsError] = useState<string | null>(null)

    // AI Explanation states
    const [aiExplanation, setAiExplanation] = useState<string | null>(null)
    const [isLoadingAiExplanation, setIsLoadingAiExplanation] = useState(false)
    const [aiExplanationError, setAiExplanationError] = useState<string | null>(null)

    const [isExplanationVisible, setIsExplanationVisible] = useState(false)
    const [showPopup, setShowPopup] = useState(false)

    // Update elapsed time every second
    useEffect(() => {
        if (!answerResult && !sessionComplete) {
            const timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - timeStarted) / 1000))
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [timeStarted, answerResult, sessionComplete])

    useEffect(() => {
        const fetchChallengeSession = async () => {
            setIsLoading(true)
            try {
                const userId = localStorage.getItem("Medical_User_Id")

                const response = await axios.get<SessionResponse>(
                    `https://medical-backend-loj4.onrender.com/api/challenge/${sessionId}?userId=${userId}`,
                )

                if (response.data.success) {
                    const sessionData = response.data.session

                    // If session is already completed, show results directly
                    if (sessionData.status === "completed") {
                        setSessionComplete(true)
                        calculateResults(sessionData)
                    }

                    // Extract questions and session data
                    const formattedQuestions: Question[] = sessionData.questions.map((q) => ({
                        _id: q.questionId,
                        question: q.question,
                        options: q.options,
                        specialty: q.specialty,
                        topic: q.topic,
                        system: q.system,
                    }))

                    setSession({
                        _id: sessionData._id,
                        userId: sessionData.userId,
                        questions: sessionData.questions.map((q) => ({
                            questionId: q.questionId,
                            userAnswer: q.userAnswer,
                            isCorrect: q.isCorrect,
                            timeSpent: q.timeSpent,
                        })),
                        status: sessionData.status,
                        metadata: sessionData.metadata,
                    })

                    setQuestions(formattedQuestions)

                    // Reset timer for the current question
                    setTimeStarted(Date.now())

                    toast.success("Challenge loaded successfully", {
                        duration: 2000,
                        position: "top-center",
                        icon: "🏆",
                    })
                } else {
                    toast.error("Failed to load challenge session", {
                        duration: 4000,
                        position: "top-center",
                    })
                }
            } catch (error) {
                console.error("Error fetching challenge session:", error)
                const axiosError = error as AxiosError
                toast.error(axiosError.message || "Failed to load challenge session", {
                    duration: 4000,
                    position: "top-center",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchChallengeSession()
    }, [sessionId, router])

    const calculateResults = (sessionData: SessionResponse["session"]) => {
        const totalQuestions = sessionData.questions.length
        const correctAnswers = sessionData.questions.filter((q) => q.isCorrect).length
        const percentage = Math.round((correctAnswers / totalQuestions) * 100)
        const totalTimeSpent = sessionData.questions.reduce((total, q) => total + (q.timeSpent || 0), 0)

        setResults({
            correct: correctAnswers,
            total: totalQuestions,
            percentage,
            timeSpent: totalTimeSpent,
        })
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
                `https://medical-backend-loj4.onrender.com/api/test/take-test/question-analytics/${questionId}`,
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

    const fetchAiExplanation = async (questionId: string, userAnswer: string | null) => {
        setIsLoadingAiExplanation(true)
        setAiExplanationError(null)

        try {
            const currentQuestion = questions[currentQuestionIndex]

            // Make sure options is properly formatted before sending
            const safeOptions = Array.isArray(currentQuestion.options) ? currentQuestion.options : []

            // Call your backend API that will use OpenAI
            const response = await axios.post(`https://medical-backend-loj4.onrender.com/api/test/ai-explain`, {
                question: currentQuestion.question,
                options: safeOptions,
                correctAnswer: userAnswer, // This will be updated with the correct answer from the response
                userAnswer: userAnswer || "No answer provided",
            })

            setAiExplanation(response.data.explanation)
        } catch (error) {
            console.error("Error fetching AI explanation:", error)

            // Create a basic fallback explanation
            const localFallbackExplanation = `
The correct answer is provided above.

This question tests your understanding of medical concepts related to ${questions[currentQuestionIndex].specialty || questions[currentQuestionIndex].topic || "this topic"}.

To remember this concept: Focus on connecting the key symptoms or findings with the most appropriate medical approach.

Note: A more detailed explanation will be available when our explanation service is fully online.
            `

            setAiExplanation(localFallbackExplanation)
            setAiExplanationError("Failed to load AI explanation")
        } finally {
            setIsLoadingAiExplanation(false)
        }
    }

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
        const timeSpent = Math.floor((Date.now() - timeStarted) / 1000) // Time in seconds

        try {
            const userId = localStorage.getItem("Medical_User_Id")
            const currentQuestion = questions[currentQuestionIndex]

            const response = await axios.post<SubmitAnswerResponse>(
                `https://medical-backend-loj4.onrender.com/api/challenge/${sessionId}/submit?userId=${userId}`,
                {
                    questionId: currentQuestion._id,
                    answer: selectedAnswer,
                    timeSpent,
                },
            )

            if (response.data.success) {
                setAnswerResult({
                    isCorrect: response.data.isCorrect,
                    correctAnswer: response.data.correctAnswer,
                    explanation: response.data.explanation || "No explanation provided.",
                })

                // Fetch question analytics and AI explanation
                // Make sure these are called immediately and not conditionally
                fetchQuestionAnalytics(currentQuestion._id)
                fetchAiExplanation(currentQuestion._id, response.data.correctAnswer)

                // Show toast based on answer correctness
                if (response.data.isCorrect) {
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

                // Check if session is complete
                if (response.data.sessionComplete) {
                    const isLastQuestion = true

                    // Fetch updated session to get final results
                    const sessionResponse = await axios.get<SessionResponse>(
                        `https://medical-backend-loj4.onrender.com/api/challenge/${sessionId}?userId=${userId}`,
                    )

                    if (sessionResponse.data.success) {
                        calculateResults(sessionResponse.data.session)

                        // Show a toast notification that the challenge is complete
                        toast.success("Challenge completed! View results after reviewing this question.", {
                            duration: 4000,
                            position: "top-center",
                        })
                    }
                }
            } else {
                toast.error("Failed to submit answer", {
                    duration: 3000,
                    position: "top-center",
                })
            }
        } catch (error) {
            console.error("Error submitting answer:", error)
            const axiosError = error as AxiosError
            toast.error(axiosError.message || "Failed to submit answer", {
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
            setSessionComplete(true)
            toast.success("Challenge completed! 🏆", {
                duration: 3000,
                position: "top-center",
            })
        }
    }

    const returnToDashboard = () => {
        router.push("/dashboard")
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[70vh]">
                <div className="relative w-20 h-20 mb-6">
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                </div>
                <div className="text-2xl font-bold mb-4">Loading challenge...</div>
                <p className="text-muted-foreground">Preparing your questions</p>
                <Toaster />
            </div>
        )
    }

    if (sessionComplete) {
        return (
            <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
                <Button variant="ghost" onClick={returnToDashboard} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card className="w-full overflow-hidden border-2 border-primary/10">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Challenge Complete!</h2>
                                <p className="text-muted-foreground">You&apos;ve completed the hard challenge</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Trophy className="h-8 w-8 text-primary" />
                            </div>
                        </div>

                        <CardContent className="space-y-8 p-6">
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="relative">
                                    <svg className="w-32 h-32">
                                        <circle
                                            className="text-muted-foreground/20"
                                            strokeWidth="6"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="58"
                                            cx="64"
                                            cy="64"
                                        />
                                        <motion.circle
                                            initial={{ strokeDashoffset: 365 }}
                                            animate={{
                                                strokeDashoffset: 365 - (365 * results.percentage) / 100,
                                            }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="text-primary"
                                            strokeWidth="6"
                                            strokeDasharray="365"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="58"
                                            cx="64"
                                            cy="64"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold">{results.percentage}%</span>
                                        <span className="text-sm text-muted-foreground">Score</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-md">
                                    <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold">
                                            {results.correct}/{results.total}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Correct Answers</div>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold">{formatTime(results.timeSpent)}</div>
                                        <div className="text-sm text-muted-foreground">Total Time</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Performance Analysis</h3>

                                {results.percentage >= 80 ? (
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
                                ) : results.percentage >= 60 ? (
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
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 bg-muted/10">
                            <Button variant="outline" onClick={returnToDashboard} className="w-full sm:w-auto">
                                Return to Dashboard
                            </Button>
                            <Button onClick={() => router.push("/dashboard/performance-tracking")} className="w-full sm:w-auto">
                                View Performance History
                            </Button>
                            <Button onClick={() => router.push("/dashboard/create-test")} className="w-full sm:w-auto bg-primary">
                                Practice More Questions
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
                <Toaster position="top-right" />
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]

    if (!currentQuestion) {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center">
                <div className="text-xl font-bold mb-4">No questions found</div>
                <Button onClick={returnToDashboard}>Return to Dashboard</Button>
            </div>
        )
    }

    return (
        <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto">
            <Button variant="ghost" onClick={returnToDashboard} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-orange-500" />
                        Hard Challenge
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                </div>
                <div className="flex items-center bg-muted/30 px-3 py-2 rounded-md">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Time: {formatTime(elapsedTime)}</span>
                </div>
            </div>

            <div className="relative mb-8">
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
                <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complete
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 min-h-[400px] overflow-x-hidden">
                {/* Left Column - Question */}
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                >
                    <Card className="w-full mb-6 border-2 border-muted h-full">
                        <CardHeader className="bg-muted/20">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">
                                        {currentQuestion.specialty} - {currentQuestion.topic}
                                    </CardTitle>
                                    <CardDescription>{currentQuestion.system}</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {currentQuestion.exam_type && (
                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                            {currentQuestion.exam_type.replace("_", " ")}
                                        </span>
                                    )}
                                    {currentQuestion.difficulty && (
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${currentQuestion.difficulty === "easy"
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
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="text-lg font-medium leading-relaxed">{currentQuestion.question}</div>

                                {!answerResult ? (
                                    <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer}>
                                        <div className="space-y-3">
                                            {currentQuestion.options.map((option, index) => {
                                                const optionLetter = String.fromCharCode(65 + index)
                                                return (
                                                    <motion.div
                                                        key={index}
                                                        whileHover={{ scale: 1.01 }}
                                                        className={`flex items-center space-x-2 border-2 rounded-md p-4 hover:bg-muted/30 cursor-pointer transition-colors ${selectedAnswer === option ? "border-primary bg-primary/5" : "border-muted"

                                                            }`}
                                                            onClick={() => setSelectedAnswer(option)}
                                                    >
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 flex-shrink-0 ${selectedAnswer === option
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            {optionLetter}
                                                        </div>
                                                        <label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                                            {option}
                                                        </label>
                                                        <RadioGroupItem value={option} id={`option-${index}`} className="sr-only" />
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </RadioGroup>
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
                                                            className={`px-3 py-1 rounded-full text-sm font-medium ${selectedAnswer === answerResult.correctAnswer
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
                                                                    <div className="text-xs text-slate-500">Response Time</div>
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

                                        {/* Toggle Explanation Button (only visible on mobile) */}
                                        {answerResult && (
                                            <div className="flex justify-end mt-4 lg:hidden">
                                                <div className="relative flex items-center">
                                                    <Button
                                                        onClick={toggleExplanation}
                                                        variant="ghost"
                                                        className={`
                            p-2 rounded-full transition-all duration-500 h-10 w-10
                            ${isExplanationVisible
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
                        </CardContent>
                        <CardFooter className="flex justify-between p-6 bg-muted/10">
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
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Right Column - Explanation and Analytics */}
                <div
                    className={`w-full lg:w-[400px] rounded-xl shadow-md overflow-hidden transition-all duration-300 ease-in-out relative
          ${isExplanationVisible
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
    )
}
