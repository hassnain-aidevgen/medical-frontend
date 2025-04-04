"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useDailyChallenge } from "@/contexts/daily-challenge-context"
import { AlertCircle, Calendar, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DailyChallengeResults() {
    const router = useRouter()
    const { challenge, completed, loading, error, results, fetchResults } = useDailyChallenge()

    // Local state to prevent redirect loops
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
    const [fallbackResults, setFallbackResults] = useState<{
        score: number
        total: number
        date: string
    } | null>(null)

    useEffect(() => {
        // If the challenge is completed but we don't have results yet, fetch them
        if (challenge && completed && !results && !hasAttemptedFetch) {
            fetchResults()
            setHasAttemptedFetch(true)
        } else if (!completed && !loading && !hasAttemptedFetch) {
            // Check if we have fallback results in localStorage
            const score = localStorage.getItem("lastChallengeScore")
            const total = localStorage.getItem("lastChallengeTotal")

            if (score && total) {
                // Use fallback results from localStorage
                setFallbackResults({
                    score: Number.parseInt(score),
                    total: Number.parseInt(total),
                    date: new Date().toISOString(),
                })
            } else {
                // If the challenge isn't completed and we have no fallback, redirect
                console.log("/dashboard/daily-challenge")
                // router.push("/dashboard/daily-challenge")
            }

            setHasAttemptedFetch(true)
        }
    }, [challenge, completed, results, fetchResults, router, loading, hasAttemptedFetch])

    if (loading && !hasAttemptedFetch) {
        return <div className="flex justify-center items-center h-screen">Loading results...</div>
    }

    if (error && !fallbackResults) {
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

    // Use either API results or fallback results
    const displayResults =
        results ||
        (fallbackResults
            ? {
                score: fallbackResults.score,
                questions: Array(fallbackResults.total).fill({
                    id: "fallback",
                    question: "Question",
                    answer: "",
                    correct: false,
                }),
                date: fallbackResults.date,
            }
            : null)

    if (!displayResults) {
        return null
    }

    const scorePercentage =
        displayResults.questions.length > 0 ? (displayResults.score / displayResults.questions.length) * 100 : 0

    const formattedDate = new Date(displayResults.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Calendar className="h-7 w-7" />
                Daily Challenge Results
            </h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Your Performance</CardTitle>
                    <CardDescription>{formattedDate}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative w-40 h-40">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-4xl font-bold">{displayResults.score}</div>
                                    <div className="text-sm text-muted-foreground">out of {displayResults.questions.length || 10}</div>
                                </div>
                            </div>
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    className="text-muted stroke-current"
                                    strokeWidth="10"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                                <circle
                                    className="text-primary stroke-current"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - scorePercentage / 100)}`}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Score</span>
                                    <span className="text-sm font-medium">{scorePercentage.toFixed(0)}%</span>
                                </div>
                                <Progress value={scorePercentage} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                                    <div className="text-2xl font-bold">{displayResults.score}</div>
                                </div>
                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                                    <div className="text-2xl font-bold">
                                        {(displayResults.questions.length || 10) - displayResults.score}
                                    </div>
                                </div>
                            </div>

                            {scorePercentage >= 70 && (
                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                                    <Trophy className="h-5 w-5" />
                                    <span>Great job! You&apos;ve mastered today&apos;s challenge.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        </div>
    )
}

