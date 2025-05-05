"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, BookOpen } from "lucide-react"

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
      setError("Unable to load test. Please try again.")
      setIsLoading(false)
      return
    }

    // Get the questions from localStorage
    const questionsJson = localStorage.getItem("feedbackQuestions")
    if (!questionsJson) {
      setError("No questions found for this test. Please return to the dashboard.")
      setIsLoading(false)
      return
    }

    try {
      // Remove debug logs in production
      const questions = JSON.parse(questionsJson)

      // Create a URL with the questions as a parameter
      const params = new URLSearchParams({
        mode,
        isRecommendedTest: "true",
        id: testId, // Still need to pass the ID, but users won't see it in the UI
      })

      // Force cache bust with timestamp
      params.append("t", Date.now().toString())

      // Navigate to the take-test page
      router.push(`/dashboard/take-test?${params.toString()}`)
    } catch (err) {
      setError("There was a problem loading your test. Please try again.")
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
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="animate-pulse p-4 bg-primary/10 rounded-full">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Preparing Your Test</h2>
        <p className="text-muted-foreground">Loading your questions...</p>
      </div>
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="animate-pulse p-4 bg-primary/10 rounded-full">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Preparing Your Test</h2>
        <p className="text-muted-foreground">Loading your questions...</p>
      </div>
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
