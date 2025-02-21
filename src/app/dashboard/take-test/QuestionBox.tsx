"use client"

import { AlertCircle, Medal, MoveRight, ScrollText } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"

type QuestionBoxProps = {
  question: {
    id: string
    text: string
    options: string[]
    correctAnswer: string
    explanation?: string
    isExplanationVisible: boolean // ✅ Add this missing property
  }
  isExplanationVisible: boolean
  onAnswerSelect: (answer: string) => void
  handleSubmit: () => void
  moveToNextQuestion: () => void
  toggleExplanation: () => void;
  questionNumber: number
  totalQuestions: number
  showCorrectAnswer: boolean
  isAnswerSubmitted: boolean
  isQuestionSubmitted: boolean
  selectedAnswer: string | undefined
  onSubmit: () => void
}

const QuestionBox: React.FC<QuestionBoxProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  handleSubmit,
  moveToNextQuestion,
  questionNumber,
  totalQuestions,
  isAnswerSubmitted,
  isQuestionSubmitted,
}) => {
  const [isExplanationVisible, setIsExplanationVisible] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const isCorrect = selectedAnswer === question.correctAnswer

  useEffect(() => {
    if (isAnswerSubmitted) {
      setShowPopup(true)
      const timer = setTimeout(() => setShowPopup(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isAnswerSubmitted])

  const toggleExplanation = () => {
    setIsExplanationVisible(!isExplanationVisible)
    setShowPopup(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      {/* Left Column - Question */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-700">
              Question {questionNumber} of {totalQuestions}
            </h2>
          </div>
          <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium self-start sm:self-auto">
            Medical Fundamentals
          </span>
        </div>

        <div className="space-y-6">
          <p className="text-base sm:text-lg text-slate-800 leading-relaxed">{question.text}</p>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${selectedAnswer === option
                    ? isAnswerSubmitted
                      ? option === question.correctAnswer
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-red-500 bg-red-50"
                      : "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200 hover:bg-blue-50"
                  }
                `}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={() => onAnswerSelect(option)}
                  className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-blue-600"
                  disabled={isAnswerSubmitted}
                  required
                />
                <span className="flex-1 text-sm sm:text-base text-slate-700">{option}</span>
                {isAnswerSubmitted && option === question.correctAnswer && (
                  <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                )}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            {!isAnswerSubmitted && (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                disabled={!selectedAnswer || isQuestionSubmitted}
              >
                Submit Answer
                <MoveRight className="h-4 w-4" />
              </button>
            )}

            {isAnswerSubmitted && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={moveToNextQuestion}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedAnswer || !isAnswerSubmitted}
                >
                  Next Question
                  <MoveRight className="h-4 w-4" />
                </button>
                <div className="relative flex items-center">
                  <button
                    onClick={toggleExplanation}
                    className={`
                      p-2 rounded-full transition-all duration-500
                      ${isExplanationVisible
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }
                    `}
                  >
                    <ScrollText className="h-5 w-5" />
                  </button>
                  {showPopup && (
                    <div className="translate-x-2 bg-blue-500 text-white text-xs py-1 px-2 rounded whitespace-nowrap animate-bounce">
                      Show explanation
                    </div>
                  )}
                </div>
              </div>
            )}
            {!selectedAnswer && isAnswerSubmitted && (
              <p className="text-red-500 text-sm mt-2">
                Please select an answer before proceeding to the next question.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Explanation */}
      <div
        className={`w-full lg:w-[400px] bg-gradient-to-b from-amber-50 to-amber-100/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 ease-in-out ${isExplanationVisible
          ? "max-h-[600px] opacity-100"
          : "max-h-0 opacity-0 lg:opacity-100 lg:max-h-full lg:translate-x-[150%]"
          }`}
      >
        {/* <div className="absolute inset-0 bg-[url('/paper-texture.png')] opacity-10" /> */}

        <div className="relative h-full p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <ScrollText className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
            <h3 className="text-base sm:text-lg font-semibold text-amber-900">Medical Notes</h3>
          </div>

          {isAnswerSubmitted && (
            <div className="space-y-6">
              <div
                className={`p-3 sm:p-4 rounded-lg ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50/50 text-amber-700"}`}
              >
                <p className="font-medium text-sm sm:text-base">
                  {isCorrect ? "Excellent diagnosis! That's correct." : "Let's review the correct answer:"}
                </p>
                <p className="mt-2 font-semibold text-sm sm:text-base">{question.correctAnswer}</p>
              </div>

              {question.explanation && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <h4 className="font-semibold text-sm sm:text-base">Detailed Explanation</h4>
                  </div>
                  <div className="pl-4 border-l-2 border-amber-200">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionBox

