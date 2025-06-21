"use client"

import { Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import axios from "axios"

interface Recommendation {
  questionText: string
  correctAnswer: string
  topic: string
  _id?: string
}

interface RecommendedQuestionsProps {
  mode: "tutor" | "timer"
  selectedExam: string
  examDate: string
  onRecommendationAdd: (recommendation: Recommendation) => void
  onRecommendationRemove: (questionText: string) => void
  selectedRecommendations: string[]
  recommendedQuestionsToAdd: Recommendation[]
}

const RecommendedQuestions: React.FC<RecommendedQuestionsProps> = ({
  mode,
  selectedExam,
  examDate,
  onRecommendationAdd,
  onRecommendationRemove,
  selectedRecommendations,
  recommendedQuestionsToAdd,
}) => {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [isCreatingRecommendedTest, setIsCreatingRecommendedTest] = useState(false)

  // Function to generate contextually appropriate options based on the correct answer
  const generateContextualOptions = (correctAnswer: string, topic: string) => {
    // Make sure we have a valid answer to work with
    if (!correctAnswer || correctAnswer.trim() === "") {
      return ["Option A", "Option B", "Option C", correctAnswer]
    }

    // Generate variations based on the correct answer
    const options = []

    // Always include the correct answer
    options.push(correctAnswer)

    // Generate 3 additional options that are contextually related to the correct answer
    // These will be different depending on the type of answer

    // For numerical answers (like dosages)
    if (/\d+/.test(correctAnswer)) {
      const numMatch = correctAnswer.match(/\d+/)
      if (numMatch) {
        const num = Number.parseInt(numMatch[0])
        const unit = correctAnswer.replace(numMatch[0], "").trim()

        // Add variations with different numbers
        options.push(`${Math.floor(num * 0.5)}${unit}`)
        options.push(`${Math.floor(num * 2)}${unit}`)
        options.push(`${Math.floor(num * 1.5)}${unit}`)
      }
    }
    // For multiple choice answers with common medical terms
    else {
      // Create variations based on the answer
      const words = correctAnswer.split(" ")

      // If it's a single word answer
      if (words.length === 1) {
        // Add similar but different terms
        if (topic.toLowerCase().includes("diagnosis")) {
          options.push(`Acute ${correctAnswer}`)
          options.push(`Chronic ${correctAnswer}`)
          options.push(`Recurrent ${correctAnswer}`)
        } else if (topic.toLowerCase().includes("treatment")) {
          options.push(`Modified ${correctAnswer}`)
          options.push(`Alternative ${correctAnswer}`)
          options.push(`Experimental ${correctAnswer}`)
        } else {
          // Generic variations
          options.push(`${correctAnswer} Type I`)
          options.push(`${correctAnswer} Type II`)
          options.push(`Atypical ${correctAnswer}`)
        }
      }
      // For multi-word answers
      else {
        // Create variations by modifying parts of the answer
        if (words.length >= 3) {
          // Replace first word
          const variation1 = [...words]
          variation1[0] =
            variation1[0] === "Primary"
              ? "Secondary"
              : variation1[0] === "Acute"
                ? "Chronic"
                : variation1[0] === "Benign"
                  ? "Malignant"
                  : "Atypical"
          options.push(variation1.join(" "))

          // Replace last word
          const variation2 = [...words]
          variation2[variation2.length - 1] =
            variation2[variation2.length - 1] === "Syndrome"
              ? "Disease"
              : variation2[variation2.length - 1] === "Deficiency"
                ? "Excess"
                : "Disorder"
          options.push(variation2.join(" "))

          // Combine modifications
          const variation3 = [...words]
          variation3[0] = variation3[0] === "Primary" ? "Secondary" : variation3[0] === "Acute" ? "Chronic" : "Atypical"
          variation3[variation3.length - 1] = "Variant"
          options.push(variation3.join(" "))
        } else {
          // For two-word answers
          options.push(`${words[0]} Variant`)
          options.push(`Atypical ${words.join(" ")}`)
          options.push(`${words.join(" ")} Complex`)
        }
      }
    }

    // If we still don't have enough options, add generic ones
    while (options.length < 4) {
      if (topic.toLowerCase().includes("anatomy")) {
        options.push(`Proximal ${correctAnswer}`)
        options.push(`Distal ${correctAnswer}`)
        options.push(`Lateral ${correctAnswer}`)
      } else if (topic.toLowerCase().includes("pharmacology")) {
        options.push(`${correctAnswer} Analog`)
        options.push(`${correctAnswer} Derivative`)
        options.push(`${correctAnswer} Antagonist`)
      } else {
        options.push(`${correctAnswer} (Type A)`)
        options.push(`${correctAnswer} (Type B)`)
        options.push(`${correctAnswer} (Variant)`)
      }
    }

    // Shuffle the options and ensure the correct answer is included
    const shuffledOptions = options.slice(0, 4).sort(() => Math.random() - 0.5)

    // Make sure the correct answer is in the options
    if (!shuffledOptions.includes(correctAnswer)) {
      shuffledOptions[0] = correctAnswer
    }

    return shuffledOptions
  }

  const fetchRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        console.log("No user ID found in localStorage")
        return
      }
      const { data } = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/recommendations4/${userId}`)

      console.log("Recommendation data received:", data)

      setRecommendations(data.recommendations)

      // If we got recommendations, show the section
      if (data.recommendations && data.recommendations.length > 0) {
        setShowRecommendations(true)
      } else {
        setShowRecommendations(false)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setShowRecommendations(false)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [])

  const addRecommendedQuestion = (recommendation: Recommendation) => {
    if (selectedRecommendations.includes(recommendation.questionText)) {
      // Remove if already selected
      onRecommendationRemove(recommendation.questionText)
    } else {
      // Add if not already selected
      onRecommendationAdd(recommendation)
    }
  }

  const handleCreateRecommendedTest = async () => {
    if (recommendations.length === 0) {
      toast.error("No recommendations available")
      return
    }

    setIsCreatingRecommendedTest(true)

    try {
      // Create a unique test ID with a recommended_ prefix
      const testId = `recommended_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Fetch the full question details for each recommendation to get the actual options
      const enhancedRecommendations = await Promise.all(
        recommendations.map(async (rec, index) => {
          try {
            // Try to fetch the question by topic or text to get all options
            const searchTerm = rec.topic || rec.questionText
            const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/questions/search`, {
              params: { query: searchTerm, limit: 5 },
            })

            // Check if we got any results
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              // Find the best matching question
              const matchingQuestion =
                response.data.find(
                  (q) => q.question === rec.questionText || (q.answer === rec.correctAnswer && q.topic === rec.topic),
                ) || response.data[0]

              console.log(`Found matching question for "${rec.questionText.substring(0, 30)}..."`, matchingQuestion)

              // If the question has options, use them
              if (
                matchingQuestion.options &&
                Array.isArray(matchingQuestion.options) &&
                matchingQuestion.options.length >= 3
              ) {
                console.log(`DEBUG - Using actual options for question:`, matchingQuestion.options)

                // Make sure the correct answer is in the options
                const options = [...matchingQuestion.options]
                if (!options.includes(rec.correctAnswer)) {
                  options[0] = rec.correctAnswer
                }

                // Ensure we have exactly 4 options for consistency
                while (options.length < 4) {
                  options.push(generateContextualOptions(rec.correctAnswer, rec.topic || "")[0])
                }

                // Limit to 4 options if we have more
                const finalOptions = options.slice(0, 4)

                console.log(`DEBUG - Final options for "${rec.questionText.substring(0, 30)}...":`, finalOptions)

                return {
                  ...rec,
                  uniqueId: `rec_${Date.now()}_${index}`,
                  options: finalOptions,
                  answer: rec.correctAnswer,
                  explanation: matchingQuestion.explanation || `This is a recommended question about ${rec.topic}.`,
                  question: rec.questionText,
                  subject: matchingQuestion.subject || "Recommended",
                  subsection: matchingQuestion.subsection || "Recommended Questions",
                  difficulty: matchingQuestion.difficulty || "medium",
                  question_type: matchingQuestion.question_type || "single_best_answer",
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching question details for "${rec.questionText.substring(0, 30)}...":`, error)
          }

          // If we couldn't find a matching question or get options, create contextually appropriate options
          console.log(
            `DEBUG - No matching question found for "${rec.questionText.substring(0, 30)}...", generating contextual options`,
          )

          // Generate contextually appropriate options based on the correct answer and topic
          const options = generateContextualOptions(rec.correctAnswer, rec.topic || "")
          console.log(`DEBUG - Generated contextual options:`, options)
          console.log(`DEBUG - Is correct answer in generated options: ${options.includes(rec.correctAnswer)}`)

          // Ensure we have exactly 4 options
          const finalOptions = options.slice(0, 4)

          return {
            ...rec,
            uniqueId: `rec_${Date.now()}_${index}`,
            options: finalOptions,
            answer: rec.correctAnswer,
            explanation: `This is a recommended question about ${rec.topic}.`,
            question: rec.questionText,
            subject: "Recommended",
            subsection: "Recommended Questions",
            difficulty: "medium",
            question_type: "single_best_answer",
          }
        }),
      )

      console.log("Enhanced recommendations with options:", enhancedRecommendations)

      // Store the questions in localStorage with recommended naming
      localStorage.setItem("recommendedQuestions", JSON.stringify(enhancedRecommendations))
      localStorage.setItem("currentRecommendedTestId", testId)

      // Also store in the standard feedback keys for backward compatibility
      // This ensures the take-test page can still find the questions
      localStorage.setItem("feedbackQuestions", JSON.stringify(enhancedRecommendations))
      localStorage.setItem("currentFeedbackTestId", testId)

      // Create URL parameters for recommended questions test
      const params = new URLSearchParams({
        mode,
        isRecommendedTest: "true",
        id: testId, // Add a test ID to identify this as a recommended test
        testType: "recommendations", // Add this to distinguish from feedback tests
        targetExam: selectedExam || "",
        examDate: examDate || "",
      })

      // Force cache bust with timestamp
      params.append("t", Date.now().toString())

      // Navigate to the test page
      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (error) {
      console.error("Error creating recommended test:", error)
      toast.error("An error occurred. Please try again.")
      setIsCreatingRecommendedTest(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  if (!showRecommendations) {
    return null
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
        <Lightbulb className="mr-2" size={24} />
        Recommended Questions
      </h2>
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-amber-800">
            Based on your previous tests, we recommend focusing on these topics:
          </p>
          <button
            type="button"
            onClick={handleCreateRecommendedTest}
            disabled={isLoadingRecommendations || recommendations.length === 0 || isCreatingRecommendedTest}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 shadow ${
              isLoadingRecommendations || recommendations.length === 0 || isCreatingRecommendedTest
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {isCreatingRecommendedTest ? (
              "Creating..."
            ) : (
              <>
                <span className="hidden sm:inline">Create Test from All Recommendations</span>
                <span className="sm:hidden">Create from All</span>
              </>
            )}
          </button>
        </div>

        {isLoadingRecommendations ? (
          <div className="text-center py-4">Loading recommendations...</div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No recommendations available yet. Complete more tests to get personalized suggestions.
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{recommendation.questionText}</p>
                    <p className="text-sm text-gray-500 mt-1">Topic: {recommendation.topic}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addRecommendedQuestion(recommendation)}
                    className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      selectedRecommendations.includes(recommendation.questionText)
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                  >
                    {selectedRecommendations.includes(recommendation.questionText)
                      ? "Added ✓"
                      : "Add to Test"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRecommendations.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <span className="font-medium">{selectedRecommendations.length}</span> recommended{" "}
              {selectedRecommendations.length === 1 ? "question" : "questions"} will be added to your test
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecommendedQuestions