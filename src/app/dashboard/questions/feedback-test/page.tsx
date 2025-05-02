"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// This component handles the actual logic after params are available
function FeedbackTestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testId = searchParams.get("id")
    const mode = searchParams.get("mode") || "tutor"

    if (!testId) {
      setError("Test ID is missing")
      setIsLoading(false)
      return
    }

    // Get the questions from localStorage
    const questionsJson = localStorage.getItem("feedbackQuestions")
    if (!questionsJson) {
      setError("No questions found")
      setIsLoading(false)
      return
    }

    try {
      // DEBUG: Log the questions and parameters
      console.log("DEBUG - feedback-test/page.tsx - testId:", testId)
      console.log("DEBUG - feedback-test/page.tsx - mode:", mode)
      console.log("DEBUG - feedback-test/page.tsx - questionsJson exists:", !!questionsJson)

      const questions = JSON.parse(questionsJson)

      // Create a URL with the questions as a parameter
      const params = new URLSearchParams({
        mode,
        isRecommendedTest: "true",
        id: testId, // Make sure to pass the testId
      })

      // Force cache bust with timestamp
      params.append("t", Date.now().toString())

      // Navigate to the take-test page
      console.log("DEBUG - feedback-test/page.tsx - Navigating to:", `/dashboard/take-test?${params.toString()}`)
      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (err) {
      console.error("Error parsing questions:", err)
      setError("Failed to parse questions")
      setIsLoading(false)
    }
  }, [router, searchParams])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Skeleton className="h-12 w-64 mb-4" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Skeleton className="h-12 w-64 mb-4" />
      <Skeleton className="h-4 w-48" />
      <p className="text-sm text-gray-500 mt-4">Loading test...</p>
    </div>
  )
}

// Main component that wraps the content with Suspense
export default function FeedbackTestPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FeedbackTestContent />
    </Suspense>
  )
}