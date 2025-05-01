"use client"

import TestPageWarning from "@/components/pageTestWarning"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { AlertCircle, Brain, Calendar, Clock, GraduationCap, MessageSquare } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useRef } from "react"
import QuestionBox from "./QuestionBox"
import TestSummary from "./TestSummary"

// Define interfaces for recommended and AI-generated questions
interface RecommendedQuestion {
  _id?: string
  questionText: string
  topic?: string
  correctAnswer?: string
  uniqueId?: string
}

interface AIGeneratedQuestion {
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string
  topic?: string
  difficulty?: string
}

type Question = {
  subsectionDisplay: any
  subjectDisplay: any
  _id: string
  question: string
  options: string[]
  answer: string
  explanation: string
  subject: string
  subsection: string
  system: string
  topic: string
  subtopics: string[]
  exam_type: "USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3" | "NEET" | "PLAB" | "MCAT" | "NCLEX" | "COMLEX" | "FEEDBACK"
  year: number
  difficulty: "easy" | "medium" | "hard"
  specialty: string
  state_specific?: string
  clinical_setting: string
  question_type: "case_based" | "single_best_answer" | "extended_matching"
}

const TakeTestPage = () => {
  // const router = useRouter()
  const searchParams = useSearchParams()

  const mode = searchParams.get("mode") || "tutor"
  const subjectsParam = searchParams.get("subjects") || ""
  const subsectionsParam = searchParams.get("subsections") || ""
  const countParam = searchParams.get("count") || "10"
  const examTypeParam = searchParams.get("exam_type") || "ALL_USMLE_TYPES"

  // Get target exam parameters from URL
  const targetExamParam = searchParams.get("targetExam") || ""
  const examDateParam = searchParams.get("examDate") || ""

  // Add parameters for AI-generated tests
  const isAIGenerated = searchParams.get("isAIGenerated") === "true"
  const aiTopic = searchParams.get("topic") || ""
  const aiGeneratedQuestionsParam = searchParams.get("aiGeneratedQuestions")

  // Add parameters for recommended questions
  const hasRecommendedParam = searchParams.get("hasRecommended") === "true"
  const recommendedQuestionsParam = searchParams.get("recommendedQuestions")
  const isRecommendedTest = searchParams.get("isRecommendedTest") === "true"

  // Add parameters for feedback test
  const testId = searchParams.get("id") || ""
  const isFeedbackTest = testId.startsWith("feedback_")

  // Use a ref to track if we've already processed feedback questions
  const processedFeedbackRef = useRef(false)

  // DEBUG: Log all parameters
  console.log("DEBUG - URL Parameters:", {
    mode,
    subjectsParam,
    subsectionsParam,
    countParam,
    examTypeParam,
    targetExamParam,
    examDateParam,
    isAIGenerated,
    aiTopic,
    hasRecommendedParam,
    isRecommendedTest,
    testId,
    isFeedbackTest,
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({})
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({})
  const [startTime, setStartTime] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [usingFeedbackQuestions, setUsingFeedbackQuestions] = useState(false)

  const totalQuestions = Math.max(1, Number.parseInt(countParam, 10))

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // If we've already processed feedback questions, don't try again
    if (processedFeedbackRef.current) {
      console.log("DEBUG - Already processed feedback questions, skipping localStorage check")
      setIsLoading(false) // Make sure to set isLoading to false
      return
    }

    // DEBUG: Check localStorage
    const feedbackQuestionsJson = localStorage.getItem("feedbackQuestions")
    const currentFeedbackTestId = localStorage.getItem("currentFeedbackTestId")

    console.log("DEBUG - localStorage:", {
      feedbackQuestionsJson: feedbackQuestionsJson ? "exists" : "not found",
      currentFeedbackTestId,
      testId,
      isFeedbackTest,
      shouldUseFeedbackQuestions:
        feedbackQuestionsJson && currentFeedbackTestId && (isFeedbackTest || testId === currentFeedbackTestId),
    })

    // Check if this is a feedback test and we have feedback questions
    if (
      feedbackQuestionsJson &&
      ((testId && testId.startsWith("feedback_")) || (isRecommendedTest && testId?.startsWith("feedback_")))
    ) {
      try {
        console.log("DEBUG - This is a feedback test, using localStorage questions")
        processedFeedbackRef.current = true // Mark that we've processed feedback questions

        // Parse the questions from localStorage
        const feedbackQuestions = JSON.parse(feedbackQuestionsJson)
        console.log("DEBUG - Parsed feedback questions:", feedbackQuestions)

        // Log the first question to see its structure in detail
        if (feedbackQuestions.length > 0) {
          console.log("DEBUG - First question structure:", JSON.stringify(feedbackQuestions[0], null, 2))
          console.log("DEBUG - First question options:", feedbackQuestions[0].options)
        }

        // Process the feedback questions to match the Question type
        const processedQuestions = feedbackQuestions.map((q: any) => {
          // Log each question's options
          console.log(`DEBUG - Question "${q.question || q.questionText}" options:`, q.options)

          return {
            ...q,
            // Make sure we have all required fields
            _id: q._id || q.uniqueId || `feedback_${Math.random().toString(36).substring(2, 9)}`,
            question: q.question || q.questionText || "Question text not available",
            options: q.options || ["Option A", "Option B", "Option C", "Option D"],
            answer: q.answer || q.correctAnswer || "Option A",
            explanation: q.explanation || `This is a feedback question.`,
            subject: q.subject || "Feedback",
            subsection: q.subsection || "Question Feedback",
            system: q.system || "Feedback",
            topic: q.topic || "Feedback Question",
            subtopics: q.subtopics || [],
            exam_type: "FEEDBACK" as any,
            year: q.year || new Date().getFullYear(),
            difficulty: q.difficulty || "medium",
            specialty: q.specialty || "General",
            clinical_setting: q.clinical_setting || "General",
            question_type: q.question_type || "single_best_answer",
            // Display fields
            subjectDisplay: q.subject || "Feedback",
            subsectionDisplay: q.subsection || "Question Feedback",
          }
        })

        console.log("DEBUG - Setting feedback questions:", processedQuestions)

        // Log the first processed question to see its structure
        if (processedQuestions.length > 0) {
          console.log("DEBUG - First processed question:", processedQuestions[0])
          console.log("DEBUG - First processed question options:", processedQuestions[0].options)
        }

        // Set the questions state
        setQuestions(processedQuestions)
        setUsingFeedbackQuestions(true)

        // IMPORTANT: Only clear localStorage AFTER we've set the questions
        // This prevents the issue where we check localStorage again before the state is updated
        localStorage.removeItem("feedbackQuestions")
        localStorage.removeItem("currentFeedbackTestId")
        console.log("DEBUG - Cleared localStorage after setting questions")

        setStartTime(Date.now())
        if (mode === "timer") {
          setTimeLeft(processedQuestions.length * 60) // 60 seconds per question
        }

        setIsLoading(false) // Make sure to set isLoading to false
        return // Exit early since we've set the questions
      } catch (error) {
        console.error("DEBUG - Error parsing feedback questions:", error)
        setIsLoading(false) // Make sure to set isLoading to false even on error
        setError("Error loading feedback questions. Please try again.")
        return // Exit early on error
      }
    }

    // If this is a feedback test but we don't have feedback questions, show an error
    if (isFeedbackTest && !feedbackQuestionsJson) {
      console.error("DEBUG - This is a feedback test but no feedback questions found in localStorage")
      setError("No feedback questions found. Please try again.")
      setIsLoading(false) // Make sure to set isLoading to false
      return
    }

    // Regular question fetching logic for non-feedback tests
    try {
      console.log("DEBUG - Fetching questions from API with params:", {
        subjects: subjectsParam,
        subsections: subsectionsParam,
        count: totalQuestions,
        exam_type: targetExamParam || examTypeParam,
      })

      const response = await axios.get("https://medical-backend-loj4.onrender.com/api/test/take-test/questions", {
        params: {
          subjects: subjectsParam,
          subsections: subsectionsParam,
          count: totalQuestions,
          exam_type: targetExamParam || examTypeParam, // Use target exam if available
        },
      })

      // Check if we received the questions properly
      if (response.data && response.data.length > 0) {
        console.log(`DEBUG - Received ${response.data.length} questions from API`)
        // Process the data to ensure we have string representations for subject/subsection
        const processedQuestions = response.data.map(
          (q: {
            subjectName: any
            subject: { name: any; $oid: any }
            subsectionName: any
            subsection: { name: any; $oid: any }
          }) => {
            const extractFieldValue = (field: { name: any; $oid: any }) => {
              if (!field) return "Unknown"

              // If it's a string, use it directly
              if (typeof field === "string") return field

              // If it has a name property (from enriched backend data)
              if (field.name) return field.name

              // If it's an object with $oid (MongoDB ObjectId)
              if (typeof field === "object" && field.$oid) return field.$oid

              // If none of above, convert to string
              return String(field)
            }
            // Convert ObjectId to string if needed
            return {
              ...q,
              // Create readable fields for UI display
              subjectDisplay: q.subjectName || extractFieldValue(q.subject),
              subsectionDisplay: q.subsectionName || extractFieldValue(q.subsection),
              // Keep original fields too
              subject: q.subject,
              subsection: q.subsection,
            }
          },
        )
        setQuestions(processedQuestions)
      } else {
        console.warn("DEBUG - No questions returned from API")
        setError("No questions found with the given criteria. Please try different filters.")
      }

      setStartTime(Date.now())
      if (mode === "timer") {
        setTimeLeft(totalQuestions * 60) // 60 seconds per question
      }
    } catch (err) {
      console.error("DEBUG - Error fetching questions from API:", err)
      setError("Failed to fetch questions. Please try again.")
    } finally {
      setIsLoading(false) // Make sure to set isLoading to false in finally block
    }
  }, [
    subjectsParam,
    subsectionsParam,
    totalQuestions,
    mode,
    targetExamParam,
    examTypeParam,
    isFeedbackTest,
    testId,
    isRecommendedTest,
  ])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // Add a useEffect to ensure isLoading is set to false after a timeout
  // This is a safety measure in case something goes wrong
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("DEBUG - Safety timeout: Setting isLoading to false after 5 seconds")
        setIsLoading(false)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timer)
  }, [isLoading])

  // Rest of the component remains the same...

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }))
  }

  const handleFinishTest = useCallback(() => {
    const currentTime = Date.now()
    const timeSpent = startTime ? Math.round((currentTime - startTime) / 1000) : 0
    setQuestionTimes((prev) => ({
      ...prev,
      [currentQuestionIndex]: timeSpent,
    }))
    setShowResults(true)
  }, [startTime, currentQuestionIndex])

  // Add the timer useEffect AFTER handleFinishTest is defined
  useEffect(() => {
    let timerId: NodeJS.Timeout

    if (mode === "timer" && timeLeft > 0 && !showResults && !isLoading) {
      timerId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Auto-finish the test when time runs out
            handleFinishTest()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }

    // Clear the interval when component unmounts or when test ends
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [mode, timeLeft, showResults, isLoading, handleFinishTest])

  const handleAnswerSubmit = useCallback(() => {
    if (selectedAnswers[currentQuestionIndex]) {
      const currentTime = Date.now()
      const timeSpent = startTime ? Math.round((currentTime - startTime) / 1000) : 0
      setQuestionTimes((prev) => ({
        ...prev,
        [currentQuestionIndex]: timeSpent,
      }))
      setStartTime(currentTime)
      setSubmittedAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: true,
      }))
    }
  }, [currentQuestionIndex, selectedAnswers, startTime])

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setStartTime(Date.now())
    } else {
      handleFinishTest()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.answer ? 1 : 0)
    }, 0)
  }

  // Helper to format exam name for display
  const formatExamName = (examType: string) => {
    return examType.replace("_", " ").replace(/USMLE/g, "USMLE ").trim()
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading questions...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (questions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Questions Available</AlertTitle>
        <AlertDescription>No questions were found. Please try again or select different criteria.</AlertDescription>
      </Alert>
    )
  }

  if (showResults) {
    // Create questions with targetExam for TestSummary
    const questionsWithTargetExam = questions.map((q) => ({
      ...q,
      targetExam: targetExamParam,
    }))

    return (
      <TestSummary
        questions={questionsWithTargetExam as any}
        selectedAnswers={selectedAnswers}
        questionTimes={questionTimes}
        score={calculateScore()}
        totalTime={Object.values(questionTimes).reduce((sum, time) => sum + time, 0)}
        isAIGenerated={isAIGenerated}
        aiTopic={aiTopic}
        targetExam={targetExamParam}
        examDate={examDateParam}
        isRecommendedTest={isRecommendedTest || isFeedbackTest || usingFeedbackQuestions}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TestPageWarning
        selectedAnswers={selectedAnswers}
        showResults={showResults}
        // currentQuestion={currentQuestion}
        totalQuestions={questions.length}
      />

      <h1 className="text-3xl font-bold mb-8">
        {isAIGenerated
          ? `AI-Generated Medical Test: ${aiTopic}`
          : isFeedbackTest || usingFeedbackQuestions
            ? "Feedback Questions Test"
            : "Medical Test"}
      </h1>

      {/* Target Exam Info Display */}
      {targetExamParam && !isFeedbackTest && !usingFeedbackQuestions && (
        <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
          <h2 className="text-lg font-semibold text-green-800 flex items-center">
            <GraduationCap className="mr-2" size={20} />
            Exam: {formatExamName(targetExamParam)}
          </h2>
          {examDateParam && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <Calendar className="mr-1" size={16} />
              Exam Date: {new Date(examDateParam).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Feedback Test banner when applicable */}
      {(isFeedbackTest || usingFeedbackQuestions) && (
        <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
          <h2 className="text-lg font-semibold text-purple-800 flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Feedback Questions
          </h2>
          <p className="text-sm text-purple-600">
            This test contains questions based on user feedback and commonly missed topics.
          </p>
        </div>
      )}

      {/* AI Test banner when applicable */}
      {isAIGenerated && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center">
            <Brain className="mr-2" size={20} />
            Topic: {aiTopic}
          </h2>
          <p className="text-sm text-blue-600">
            This test was custom-generated by AI focusing on key concepts in {aiTopic}.
          </p>
        </div>
      )}

      {mode === "timer" && (
        <div className="mb-4 text-xl flex items-center">
          <Clock className="mr-2" />
          Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      )}

      {questions.length > 0 && (
        <QuestionBox
          question={{
            _id: questions[currentQuestionIndex]._id,
            question: questions[currentQuestionIndex].question,
            options: questions[currentQuestionIndex].options,
            answer: questions[currentQuestionIndex].answer,
            explanation: questions[currentQuestionIndex].explanation,
            subject: questions[currentQuestionIndex].subject,
            subsection: questions[currentQuestionIndex].subsection,
            // Use our new display fields
            subjectDisplay: questions[currentQuestionIndex].subjectDisplay,
            subsectionDisplay: questions[currentQuestionIndex].subsectionDisplay,
            exam_type: questions[currentQuestionIndex].exam_type,
            difficulty: questions[currentQuestionIndex].difficulty,
            topic: questions[currentQuestionIndex].topic,
            targetExam: targetExamParam,
          }}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          showCorrectAnswer={submittedAnswers[currentQuestionIndex]}
          onSubmit={handleAnswerSubmit}
        />
      )}

      <div className="flex gap-5 mt-6">
        <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
          Previous
        </Button>
        {!submittedAnswers[currentQuestionIndex] ? (
          <Button onClick={handleAnswerSubmit} disabled={!selectedAnswers[currentQuestionIndex]}>
            Submit Answer
          </Button>
        ) : (
          <Button onClick={currentQuestionIndex === questions.length - 1 ? handleFinishTest : handleNextQuestion}>
            {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
          </Button>
        )}
      </div>
    </div>
  )
}

export default TakeTestPage
