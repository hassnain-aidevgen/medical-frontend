"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useDailyChallenge } from "@/contexts/daily-challenge-context"
import { AlertCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import DailyChallenge from "./DailyChallenge"

// Define the Question interface expected by DailyChallenge
interface Question {
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
    exam_type: "USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3"
    year: number
    difficulty: "easy" | "medium" | "hard"
    specialty: string
    state_specific?: string
    clinical_setting: string
    question_type: "case_based" | "single_best_answer" | "extended_matching"
}

export default function DailyChallengePage() {
    const { id } = useParams()
    const router = useRouter()
    const { challenge, completed, loading, error } = useDailyChallenge()
    const [adaptedQuestions, setAdaptedQuestions] = useState<Question[]>([])

    useEffect(() => {
        // Verify this is today's challenge
        if (challenge && challenge._id !== id) {
            router.push("/dashboard")
            return
        }

        // Check if already completed
        if (completed) {
            router.push("/dashboard/daily-challenge/results")
            return
        }

        // Adapt the challenge questions to the format expected by DailyChallenge
        if (challenge?.questions) {
            const adapted = challenge.questions.map((q, index) => ({
                _id: `daily-${index}`,
                question: q.question,
                options: q.options,
                answer: q.answer,
                explanation: q.explanation || "Explanation will be provided after submission.",
                subject: "Daily Challenge",
                subsection: "General",
                system: "Mixed",
                topic: "Daily Challenge",
                subtopics: ["Daily Challenge"],
                exam_type: "USMLE_STEP1" as const, // Use a const assertion to fix the type
                year: new Date().getFullYear(),
                difficulty: "medium" as const, // Also fix this type
                specialty: "General",
                clinical_setting: "Mixed",
                question_type: "single_best_answer" as const, // And this one
            }))
            setAdaptedQuestions(adapted)
        }
    }, [challenge, completed, id, router])

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading challenge...</div>
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!challenge || adaptedQuestions.length === 0) {
        return null
    }

    return (
        <div className="w-full h-screen">
            {/* Pass the adapted questions to the DailyChallenge component */}
            <Suspense fallback={<div>Loading...</div>}>
                <DailyChallenge initialQuestions={adaptedQuestions} challengeId={challenge._id} />
            </Suspense>
        </div>
    )
}
