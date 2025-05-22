"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import axios from "axios"
import { AlertCircle, BarChart, BookOpenCheck, Medal, MoveRight, ScrollText, Sparkles } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import FlashcardView from "./FlashcardView"

type QuestionAnalytics = {
  totalAttempts: number
  avgResponseTime: number
  correctPercentage: number
}


type QuestionBoxProps = {
  question: {
    _id: string
    question: string
    options: string[]
    answer: string
    explanation: string
    subject: string | { $oid: string }
    subsection: string | { $oid: string }
    subjectDisplay: string
    subsectionDisplay: string
    exam_type?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    topic?: string
    targetExam?: string
  }

  selectedAnswer: string | undefined
  onAnswerSelect: (answer: string) => void
  questionNumber: number
  totalQuestions: number
  showCorrectAnswer: boolean
  onSubmit: () => void
  flashcardId?: string
}

const QuestionBox: React.FC<QuestionBoxProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  questionNumber,
  totalQuestions,
  showCorrectAnswer,
  onSubmit,
  flashcardId,
}) => {
  const [analytics, setAnalytics] = useState<QuestionAnalytics | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [isExplanationVisible, setIsExplanationVisible] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  // AI Explanation states
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isLoadingAiExplanation, setIsLoadingAiExplanation] = useState(false)
  const [aiExplanationError, setAiExplanationError] = useState<string | null>(null)
  const [hasAttemptedAiExplanation, setHasAttemptedAiExplanation] = useState(false)
  const [showFlashcard, setShowFlashcard] = useState(false)

  const isCorrect = selectedAnswer === question.answer


  useEffect(() => {
    const fetchAnalytics = async () => {
      if (showCorrectAnswer) {
        setIsLoadingAnalytics(true)
        setAnalyticsError(null)

        // Check if this is a recommended question (starts with 'rec-' or 'rec_')
        if (question._id.startsWith('rec-') || question._id.startsWith('rec_')) {
          // Provide default analytics for recommended questions
          setTimeout(() => {
            setAnalytics({
              totalAttempts: 1,
              avgResponseTime: 30,
              correctPercentage: 50
            });
            setIsLoadingAnalytics(false);
          }, 500); // Small delay to simulate loading
          return;
        }

        try {
          // Question analytics API call
          const response = await axios.get(
            `https://medical-backend-loj4.onrender.com/api/test/take-test/question-analytics/${question._id}`,
          )
          setAnalytics(response.data)
        } catch (error) {
          console.error("Error fetching question analytics:", error)

          // Set default analytics data even when there's an error
          setAnalytics({
            totalAttempts: 3,
            avgResponseTime: 35,
            correctPercentage: 70
          });

          setAnalyticsError("Failed to load question analytics")
        } finally {
          setIsLoadingAnalytics(false)
        }
      }
    }

    fetchAnalytics()
  }, [showCorrectAnswer, question._id])

  // Fetch AI explanation when answer is shown
  useEffect(() => {
    const fetchAiExplanation = async () => {
      // Only fetch if showing correct answer AND we haven't attempted to fetch yet
      if (showCorrectAnswer && !hasAttemptedAiExplanation) {
        setIsLoadingAiExplanation(true)
        setAiExplanationError(null)
        setHasAttemptedAiExplanation(true)  // Mark that we've attempted a fetch

        try {
          // Make sure options is properly formatted before sending
          const safeOptions = Array.isArray(question.options) ? question.options : [];

          // Call your backend API that will use OpenAI
          const response = await axios.post(
            `https://medical-backend-loj4.onrender.com/api/test/ai-explain`,
            {
              question: question.question,
              options: safeOptions,
              correctAnswer: question.answer,
              userAnswer: selectedAnswer || "No answer provided"
            }
          )

          setAiExplanation(response.data.explanation)
        } catch (error) {
          console.error("Error fetching AI explanation:", error)

          // Create a basic fallback explanation in case the server fails completely
          const localFallbackExplanation = `
  The correct answer is: ${question.answer}

  This question tests your understanding of medical concepts related to ${question.subsectionDisplay || question.subjectDisplay || "this topic"
            }.

  To remember this concept: Focus on connecting the key symptoms or findings with the most appropriate medical approach.

  Note: A more detailed explanation will be available when our explanation service is fully online.
            `;

          setAiExplanation(localFallbackExplanation);
          setAiExplanationError("Failed to load AI explanation")
        } finally {
          setIsLoadingAiExplanation(false)
        }
      }
    }

    fetchAiExplanation()
  }, [showCorrectAnswer, question, selectedAnswer, hasAttemptedAiExplanation])

  // Reset the hasAttemptedAiExplanation flag when the question changes
  useEffect(() => {
    setHasAttemptedAiExplanation(false)
    setAiExplanation(null)
    setAiExplanationError(null)
  }, [question._id])

  useEffect(() => {
    if (showCorrectAnswer) {
      setIsExplanationVisible(true)
      setShowPopup(true)
      // const timer = setTimeout(() => setShowPopup(false), 3000)
      // return () => clearTimeout(timer)
    }
  }, [showCorrectAnswer])

  useEffect(() => {
    setIsExplanationVisible(false)
  }, [])

  const toggleExplanation = () => {
    setIsExplanationVisible(!isExplanationVisible)
    setShowPopup(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[400px] overflow-x-hidden">
      {/* Left Column - Question */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-700">
            Question {questionNumber} of {totalQuestions}
          </h2>
          <div className="flex gap-2">
            <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              Medical Question
            </span>
            {question.exam_type && (
              <span className="px-4 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                {question.exam_type.replace("_", " ")}
              </span>
            )}
          </div>
        </div>
        {(question.subjectDisplay || question.subsectionDisplay) && (
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            {question.subjectDisplay && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">
                Subject: {question.subjectDisplay}
              </span>
            )}
            {question.subsectionDisplay && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">
                Topic: {question.subsectionDisplay}
              </span>
            )}
            {question.difficulty && (
              <span className={`px-3 py-1 rounded-md ${question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </span>
            )}
          </div>
        )}

        <div className="space-y-6">
          <p className="text-lg text-slate-800 leading-relaxed">{question.question}</p>

          <RadioGroup value={selectedAnswer} onValueChange={onAnswerSelect} disabled={showCorrectAnswer}>
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${selectedAnswer === option
                    ? showCorrectAnswer
                      ? option === question.answer
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-red-500 bg-red-50"
                      : "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200 hover:bg-blue-50"
                  }
                  `}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="h-5 w-5" />
                <Label htmlFor={`option-${index}`} className="flex-1 text-base text-slate-700">
                  {option}
                </Label>
                {showCorrectAnswer && option === question.answer && <Medal className="h-5 w-5 text-emerald-500" />}
              </label>
            ))}
          </RadioGroup>

          {/* NEW: Show Flashcard Button when answer is incorrect */}
          {showCorrectAnswer && !isCorrect && flashcardId && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-red-600 font-medium">
                  This question has been added to your flashcards for review.
                  <p className="text-xs text-gray-500">A review session is created after completing this test that contains flashcards of all your wrong answered questions (visit review system page).</p>
                </div>

                <Button
                  onClick={() => setShowFlashcard(true)}
                  variant="outline"
                  className="gap-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                >
                  <BookOpenCheck className="h-4 w-4" />
                  View Flashcard
                </Button>
              </div>
            </div>
          )}

          {/* NEW: Show analytics below question when answer is submitted */}
          {showCorrectAnswer && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              {/* Combined Analytics Box with Correct/Wrong Status */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 text-blue-500 mr-2" />
                    <h4 className="text-base font-medium text-slate-700">Question Analytics</h4>
                  </div>

                  {/* Correct/Wrong Tag */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${isCorrect
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                    }`}>
                    {isCorrect ? "Correct" : "Wrong"}
                  </div>
                </div>

                {/* Correct Answer Display */}
                <div className="mb-3 pb-3 border-b border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Correct Answer:</div>
                  <div className="font-medium text-slate-800">{question.answer}</div>
                </div>

                {isLoadingAnalytics && (
                  <div className="flex justify-center p-2">
                    <div className="animate-pulse flex space-x-4">
                      <div className="h-4 w-full bg-slate-200 rounded"></div>
                    </div>
                  </div>
                )}

                {analyticsError && (
                  <div className="text-red-500 p-2 bg-red-50 rounded-md text-sm">
                    {analyticsError}
                  </div>
                )}

                {analytics && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {/* Total Attempts with Icon */}
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-500">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Total</div>
                        <div className="font-medium text-slate-700">{analytics.totalAttempts} <span className="text-xs">attemptes</span></div>
                      </div>
                    </div>

                    {/* Correct Answers with Icon */}
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-500">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Correct</div>
                        <div className="font-medium text-slate-700">
                          {Math.round(analytics.totalAttempts * (analytics.correctPercentage / 100))} <span className="text-xs">answered correctly</span>
                        </div>
                      </div>
                    </div>

                    {/* Avg Response Time with Icon */}
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-amber-500">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Response Time</div>
                        <div className="font-medium text-slate-700">{analytics.avgResponseTime.toFixed(1)} <span className="text-xs">second</span></div>
                      </div>
                    </div>

                    {/* Success Rate with Icon */}
                    <div className="flex items-center gap-2">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${analytics.correctPercentage >= 70 ? 'bg-emerald-100' :
                        analytics.correctPercentage >= 40 ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${analytics.correctPercentage >= 70 ? 'text-emerald-500' :
                          analytics.correctPercentage >= 40 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                          <line x1="19" y1="5" x2="5" y2="19"></line>
                          <circle cx="6.5" cy="6.5" r="2.5"></circle>
                          <circle cx="17.5" cy="17.5" r="2.5"></circle>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Success Rate</div>
                        <div className={`font-medium ${analytics.correctPercentage >= 70 ? 'text-emerald-600' :
                          analytics.correctPercentage >= 40 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                          {analytics.correctPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-4 mt-8">
            {!showCorrectAnswer ? (
              null
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                {/* <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setIsExplanationVisible(false)
                      // Call your existing next question handler here
                    }}
                  >
                    Next Question
                    <MoveRight className="h-4 w-4" />
                  </Button> */}
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
                    <ScrollText className="h-5 w-5" />
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
        </div>
      </div>

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
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23925103' fill-opacity='0.15' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="relative h-full p-6 overflow-y-auto">
          {showCorrectAnswer && (
            <div className="space-y-6">
              {question.explanation && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    <h4 className="font-semibold">Detailed Explanation</h4>
                  </div>
                  <div className="pl-4 border-l-2 border-amber-200">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )}

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
                      {aiExplanation || "No AI explanation available"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
       {/* Flashcard Modal */}
      {showFlashcard && flashcardId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-0 shadow-xl">
            <FlashcardView 
              flashcardId={flashcardId} 
              onClose={() => setShowFlashcard(false)} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionBox