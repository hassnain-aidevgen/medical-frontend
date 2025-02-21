"use client"

import type React from "react"
import { useState } from "react"

type TestSummaryProps = {
  questions: {
    id: string
    text: string
    correctAnswer: string
    explanation?: string
  }[]
  selectedAnswers: { [key: number]: string }
  questionTimes: { [key: number]: number }
  score: number
  totalTime: number
}

const TestSummary: React.FC<TestSummaryProps> = ({ questions, selectedAnswers, questionTimes, score, totalTime }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userId = localStorage.getItem("Medical_User_Id")

  // Debugging logs
  console.log("📝 Questions:", questions);
  console.log("📝 Selected Answers:", selectedAnswers);
  console.log("📝 Question Times:", questionTimes);

  // Calculate the percentage of correct answers
  const percentage = (score / questions.length) * 100

  const handleSubmitResults = async () => {
    if (!userId) {
      return
    }
    setLoading(true)
    setError(null)
    console.log("📌 Selected Answers before sending:", selectedAnswers);
    console.log("📌 Question Times before sending:", questionTimes);
    console.log("📌 Props received in TestSummary:", { selectedAnswers, questions });

    const testData = {
      userId,
      questions: questions.map((q, index) => ({
        questionText: q.text,
        correctAnswer: q.correctAnswer,
        userAnswer: selectedAnswers[index] || "",
        timeSpent: questionTimes[index] || 0,
      })),
      score,
      totalTime,
      percentage,
    }

    try {
      const response = await fetch("http://localhost:5000/api/test/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `❌ Server error ${response.status}`)
      }

      alert("🎉 Test results saved successfully!")
    } catch (err) {
      console.error("❌ Error submitting test results:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Results</h1>
      <p className="text-xl mb-4">
        Your score: {score} out of {questions.length}
      </p>
      <p className="text-xl mb-4">Percentage: {percentage.toFixed(2)}%</p>
      <p className="text-xl mb-4">
        Total time: {Math.floor(totalTime / 60)} minutes {totalTime % 60} seconds
      </p>
      <h2 className="text-2xl font-semibold mb-4">Question Summary</h2>

      <div className="space-y-4">

        {questions.map((question, index) => {
          const displayQuestionNumber = index + 1;
          // Use index as the key for selectedAnswers and questionTimes
          const userAnswer = selectedAnswers[index] || "";
          const isCorrect = userAnswer === question.correctAnswer;
          const timeSpent = questionTimes[index] || 0;

          return (
            <div key={question.id} className="bg-white shadow rounded-lg p-4">
              <h3 className="font-semibold mb-2">Question {displayQuestionNumber}</h3>
              <p className="mb-2">{question.text}</p>
              <p className="mb-2">
                Your answer:{" "}
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {userAnswer || "No answer"}
                </span>
              </p>
              <p className="mb-2">Correct answer: {question.correctAnswer}</p>
              <p>Time spent: {timeSpent} seconds</p>

              {!isCorrect && question.explanation && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                  <h3 className="font-semibold mb-2">Explanation:</h3>
                  <p>{question.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      <button
        onClick={handleSubmitResults}
        className="mt-8 bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Save Results"}
      </button>
    </div>
  );
}

export default TestSummary
