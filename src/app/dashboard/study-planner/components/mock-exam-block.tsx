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
  onTestComplete: (results: { score: number; correct: number; total: number }) => void;
}

interface Question {
  _id: string
  question: string
  options: string[]
  answer: string
  explanation?: string
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

export const MockExamBlock: React.FC<MockExamBlockProps> = ({ weekNumber, weekTheme, focusAreas, examNumber, onTestComplete }) => {
  const [showExam, setShowExam] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [examCompleted, setExamCompleted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Preparing your exam...");
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

  // Analytics and AI Explanation states
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
  const [isFirstAttempt, setIsFirstAttempt] = useState<boolean>(false)

  const duration = Math.min(30 + weekNumber * 5, 60)
  const examName = `Mini Assessment ${examNumber}: ${focusAreas[0]}`
  const topicsCovered = focusAreas.slice(0, Math.min(3, focusAreas.length))
  const minScore = Math.max(60, 65 + weekNumber * 2)
  const maxScore = Math.min(95, minScore + 15)


  useEffect(() => {
    if (!answerResult && !examCompleted && showExam) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - timeStarted) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeStarted, answerResult, examCompleted, showExam])

  const handleStartExam = async () => {
    setIsLoading(true);
    setLoadingMessage("Finding relevant subjects...");

    try {
        const topic = focusAreas[0];
        if (!topic) {
            throw new Error("No topic specified for the test.");
        }

        const subjectsResponse = await axios.get('https://medical-backend-3eek.onrender.com/api/ai-planner/subjects-ai');
        const subject = subjectsResponse.data.find((s: { name: string }) => s.name.toLowerCase() === topic.toLowerCase());

        if (!subject) {
            throw new Error(`Subject "${topic}" not found.`);
        }
        const subjectId = subject._id;
        setLoadingMessage("Finding relevant subsections...");

        const subsectionsResponse = await axios.get(`https://medical-backend-3eek.onrender.com/api/ai-planner/subjects-ai/${subjectId}/subsections`);
        if (!subsectionsResponse.data || subsectionsResponse.data.length === 0) {
            throw new Error(`No subsections found for subject "${topic}".`);
        }
        const subsectionId = subsectionsResponse.data[0]._id;
        setLoadingMessage("Generating AI questions... This may take a moment.");

        const questionCount = 5;
        const generationResponse = await axios.post('https://medical-backend-3eek.onrender.com/api/ai-planner/ai-test-suggestions', {
            topic: topic,
            questionCount: questionCount,
            difficultyDistribution: 'balanced',
            subjectId: subjectId,
            subsectionId: subsectionId,
            examType: 'USMLE_STEP1'
        });

        const { questionIds } = generationResponse.data;
        if (!questionIds || questionIds.length === 0) {
            throw new Error("AI failed to generate questions.");
        }
        setLoadingMessage("Loading generated questions...");

        const questionsDataResponse = await axios.post('https://medical-backend-3eek.onrender.com/api/ai-planner/ai-questions-by-ids', {
            questionIds: questionIds
        });

        setQuestions(questionsDataResponse.data.questions);
        setShowExam(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setExamCompleted(false);
        setTimeStarted(Date.now());
        setElapsedTime(0);
        setResults({ correct: 0, total: 0, percentage: 0, timeSpent: 0 });

    } catch (error) {
        console.error("Error starting AI-generated exam:", error);
        const errorMessage = (error as any).response?.data?.error || (error as Error).message || "Failed to start the exam.";
        toast.error(errorMessage, { duration: 4000 });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCloseExam = () => {
    setShowExam(false)
  }

  const fetchQuestionAnalytics = async (questionId: string) => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    setIsFirstAttempt(false);
    try {
      const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/test/take-test/question-analytics/${questionId}`);
      const analytics = response.data;
      
      // Check if this is the first attempt
      if (analytics.totalAttempts === 0) {
        setIsFirstAttempt(true);
        setQuestionAnalytics(null);
      } else {
        setQuestionAnalytics(analytics);
      }
    } catch (error) {
      console.error("Error fetching question analytics:", error);
      // Set as first attempt if we can't fetch analytics
      setIsFirstAttempt(true);
      setQuestionAnalytics(null);
      setAnalyticsError("Failed to load question analytics");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchAiExplanation = async (questionId: string, userAnswer: string | null, correctAnswer: string) => {
    setIsLoadingAiExplanation(true);
    setAiExplanationError(null);
    setAiExplanation(null);
    try {
        const currentQuestion = questions[currentQuestionIndex];
        const response = await axios.post(`https://medical-backend-3eek.onrender.com/api/ai-explain/ai-explain`, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: correctAnswer,
            userAnswer: userAnswer || "No answer provided",
        });
        setAiExplanation(response.data.explanation);
    } catch (error) {
        console.error("Error fetching AI explanation:", error);
        const errorMessage = "Failed to load AI explanation. The service may be temporarily unavailable.";
        setAiExplanationError(errorMessage);
        setAiExplanation(errorMessage);
    } finally {
        setIsLoadingAiExplanation(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) {
      toast.error("Please select an answer.", { icon: "⚠️" });
      return;
    }

    setIsSubmitting(true);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.answer;

    setAnswerResult({
      isCorrect: isCorrect,
      correctAnswer: currentQuestion.answer,
      explanation: currentQuestion.explanation || "No explanation available.",
    });

    if (isCorrect) {
      toast.success("Correct! 🎉");
    } else {
      toast.error("Incorrect.");
      setFlashcardCreated(true);
      setFlashcardCategory("Mistakes");
    }

    fetchQuestionAnalytics(currentQuestion._id);
    fetchAiExplanation(currentQuestion._id, selectedAnswer, currentQuestion.answer);

    setResults(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      percentage: Math.round(((prev.correct + (isCorrect ? 1 : 0)) / (prev.total + 1)) * 100),
    }));

    setIsSubmitting(false);
    setIsExplanationVisible(true);
  };

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
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setTimeStarted(Date.now());
      setElapsedTime(0);
      setIsExplanationVisible(false);
      setFlashcardCreated(false);
      setQuestionAnalytics(null);
      setAiExplanation(null);
      setIsFirstAttempt(false);
    } else {
      onTestComplete({
        score: results.percentage,
        correct: results.correct,
        total: results.total,
      });
      setExamCompleted(true);
      toast.success("Exam completed! 🏆");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const FlashcardNotification = () => {
    if (!flashcardCreated) return null;
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
          <h4 className="text-base font-medium text-blue-700">Flashcard Created</h4>
        </div>
        <p className="text-sm text-blue-600 mt-1">This question has been added to your &apos;{flashcardCategory}&apos; deck for review.</p>
      </div>
    );
  };

  const QuestionAnalyticsDisplay = () => {
    if (isLoadingAnalytics) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">Loading analytics...</p>
        </div>
      );
    }

    if (isFirstAttempt || (questionAnalytics && questionAnalytics.totalAttempts === 0)) {
      return (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-2 text-indigo-800 mb-2">
            <Award className="h-5 w-5" />
            <h4 className="font-semibold">First Attempt!</h4>
          </div>
          <p className="text-sm text-indigo-700">
            You&apos;re the first to attempt this question. Your response will help build analytics for future learners.
          </p>
        </div>
      );
    }

    if (questionAnalytics) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-3">
            <BarChart className="h-5 w-5" />
            <h4 className="font-semibold">Question Analytics</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Attempts:</span>
              <strong>{questionAnalytics.totalAttempts}</strong>
            </div>
            <div className="flex justify-between">
              <span>Correct Rate:</span>
              <strong>{questionAnalytics.correctPercentage}%</strong>
            </div>
            <div className="flex justify-between">
              <span>Avg. Time:</span>
              <strong>{questionAnalytics.avgResponseTime}s</strong>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (showExam) {
    if (isLoading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
            <motion.div
              className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h3 className="text-xl font-bold">Generating Your Test</h3>
            <p className="text-muted-foreground mt-2">{loadingMessage}</p>
          </div>
        </div>
      );
    }

    if (examCompleted) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
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
                      <div className="text-3xl font-bold text-indigo-800 mb-1">{results.percentage}%</div>
                      <div className="text-sm text-indigo-600">Your Score</div>
                    </div>
    
                    <div className="w-full bg-white h-3 rounded-full mt-4">
                      <div
                        className={`h-3 rounded-full ${results.percentage >= minScore ? "bg-green-500" : "bg-amber-500"}`}
                        style={{ width: `${results.percentage}%` }}
                      ></div>
                    </div>
    
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>Target: {minScore}% - {maxScore}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-800">Performance Analysis</h4>
                    {results.percentage >= 80 ? (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-green-800">Excellent Performance!</h3>
                          <p className="text-green-700 text-sm mt-1">
                            You&apos;ve demonstrated mastery of this topic. Your understanding of the material is
                            exceptional.
                          </p>
                        </div>
                      </div>
                    ) : results.percentage >= 60 ? (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start">
                        <Brain className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-blue-800">Good Performance!</h3>
                          <p className="text-blue-700 text-sm mt-1">
                            You have a solid understanding of the material. With a bit more practice, you&apos;ll master
                            these concepts.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start">
                        <HelpCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-amber-800">Keep Practicing!</h3>
                          <p className="text-amber-700 text-sm mt-1">
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

    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
              <h3 className="text-xl font-bold">No Questions Found</h3>
              <p className="text-muted-foreground mt-2">Could not load questions for this test.</p>
              <Button onClick={handleCloseExam} className="mt-4">Close</Button>
            </div>
          </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
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
  
            <div className="flex flex-col lg:flex-row gap-6 p-6 flex-grow overflow-y-auto">
                {/* Left Column - Question */}
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                >
                    <div className="w-full mb-6 border-2 border-muted rounded-lg h-full flex flex-col">
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
                        <div className="p-6 flex-grow">
                            <div className="text-lg font-medium leading-relaxed mb-6">{currentQuestion.question}</div>
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                const isSelected = selectedAnswer === option;
                                const isCorrect = answerResult && answerResult.correctAnswer === option;
                                const isWrong = answerResult && isSelected && !isCorrect;

                                let optionClass = "border-muted hover:bg-muted/30";
                                if (isSelected && !answerResult) optionClass = "border-primary bg-primary/5";
                                if (isCorrect) optionClass = "border-green-500 bg-green-50";
                                if (isWrong) optionClass = "border-red-500 bg-red-50";

                                return (
                                    <motion.div
                                    key={index}
                                    whileHover={{ scale: answerResult ? 1 : 1.02 }}
                                    className={`flex items-center space-x-3 border-2 rounded-md p-3 cursor-pointer transition-colors ${optionClass}`}
                                    onClick={() => !answerResult && setSelectedAnswer(option)}
                                    >
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 flex-shrink-0 text-white ${
                                        isCorrect ? "bg-green-500" : isWrong ? "bg-red-500" : isSelected ? "bg-primary" : "bg-muted-foreground"
                                        }`}
                                    >
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <label className="flex-1 cursor-pointer">{option}</label>
                                    {isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    {isWrong && <XCircle className="h-5 w-5 text-red-500" />}
                                    </motion.div>
                                )
                                })}
                            </div>
                        </div>
                        
                        {/* Analytics and Flashcard Section - Now inside the left column */}
                        {answerResult && (
                          <div className="p-6 space-y-4 bg-gray-50 border-t">
                            <QuestionAnalyticsDisplay />
                            <FlashcardNotification />
                          </div>
                        )}
                        
                        <div className="flex justify-between p-6 bg-muted/10 border-t">
                            {!answerResult ? (
                            <Button
                                onClick={submitAnswer}
                                disabled={!selectedAnswer || isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Answer"}
                            </Button>
                            ) : (
                            <Button onClick={nextQuestion} className="w-full">
                                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Results"}
                            </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
                
                {/* Right Column - AI Explanation Only */}
                <div className={`w-full lg:w-[400px] flex-shrink-0 transition-all duration-300 ease-in-out ${isExplanationVisible ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
                    {answerResult && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg h-fit">
                            <div className="flex items-center gap-2 text-purple-800 mb-2">
                                <Sparkles className="h-5 w-5" />
                                <h4 className="font-semibold">AI Explanation</h4>
                            </div>
                            {isLoadingAiExplanation ? (
                                <div className="flex items-center justify-center py-8">
                                    <motion.div
                                        className="h-8 w-8 rounded-full border-3 border-purple-300 border-t-purple-600"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-purple-900 whitespace-pre-line">{aiExplanation || answerResult.explanation}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )
  }

  return (
    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BookOpen className="text-indigo-600 mr-2" size={20} />
          <h4 className="font-medium text-indigo-800">{examName}</h4>
        </div>
        <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-1 rounded-full">AI-Generated Test</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-indigo-700">
          <Clock className="mr-2" size={16} />
          <span>Approx. Duration: {duration} minutes</span>
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
          <span>Target Score: {minScore}% - {maxScore}%</span>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleStartExam}
            disabled={isLoading}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
          >
            {isLoading ? "Generating..." : "Start Practice Test"}
          </button>
        </div>
      </div>
      <Toaster />
    </div>
  )
}