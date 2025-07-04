"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

interface FlashcardChallengeProps {
    isOpen: boolean
    onClose: () => void
}

type Flashcard = {
    _id: string
    question: string
    answer: string
    mastery: number
}

type FlashcardEntry = {
    flashcardId: Flashcard
    isAttempted: boolean
    isCorrect: boolean
    attemptedAt?: string
}

type FlashcardChallenge = {
    _id: string
    userId: string
    date: string
    flashcards: FlashcardEntry[]
    isCompleted: boolean
    lastAttemptedAt?: string
}

type ProgressData = {
    attemptedToday: boolean
    total: number
    attempted: number
    isCompleted: boolean
    lastAttemptedAt?: string
}

type ChallengeView = "start" | "challenge" | "results"

type ResultsState = {
    correct: number
    total: number
}

export function FlashcardChallenge({ isOpen, onClose }: FlashcardChallengeProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [challenge, setChallenge] = useState<FlashcardChallenge | null>(null)
    const [progress, setProgress] = useState<ProgressData | null>(null)
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [showAnswer, setShowAnswer] = useState<boolean>(false)
    const [results, setResults] = useState<ResultsState>({ correct: 0, total: 0 })
    const [view, setView] = useState<ChallengeView>("start")
    const [medicalUserId, setMedicalUserId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedUserId = localStorage.getItem("Medical_User_Id")
            console.log("Dashboard - User ID from localStorage:", storedUserId)
            setMedicalUserId(storedUserId)
        }
    }, [])

    // Fetch the daily challenge
    const fetchChallenge = useCallback(
        async (completed = false) => {
            setIsLoading(true)
            try {
                const response = await fetch(`https://medical-backend-3eek.onrender.com/api/flashcards-daily?userId=${medicalUserId}`)

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`)
                }

                const data = (await response.json()) as { success: boolean; challenge?: FlashcardChallenge; error?: string }

                if (data.success && data.challenge) {
                    setChallenge(data.challenge)

                    if (completed) {
                        calculateResults(data.challenge)
                    } else {
                        setView("challenge")
                    }
                } else {
                    toast.error(data.error || "No flashcards available for today's challenge")
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to fetch flashcards")
            } finally {
                setIsLoading(false)
            }
        },
        [medicalUserId],
    )

    // Fetch progress to check if there's an active challenge
    const fetchProgress = useCallback(async () => {
        if (!medicalUserId) return

        try {
            const response = await fetch(`https://medical-backend-3eek.onrender.com/api/flashcards-daily/progress?userId=${medicalUserId}`)

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const data = (await response.json()) as { success: boolean } & ProgressData

            if (data.success) {
                setProgress(data)

                // If there's a completed challenge today, show results directly
                if (data.attemptedToday && data.isCompleted) {
                    void fetchChallenge(true)
                    setView("results")
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to fetch progress")
        }
    }, [medicalUserId, fetchChallenge])

    // Calculate results from completed challenge
    const calculateResults = (challenge: FlashcardChallenge): void => {
        const correct = challenge.flashcards.filter((f) => f.isCorrect).length
        const total = challenge.flashcards.length
        setResults({ correct, total })
    }

    // Submit an answer for the current flashcard
    const submitAnswer = useCallback(
        async (isCorrect: boolean) => {
            if (!challenge || !medicalUserId) return

            const currentFlashcard = challenge.flashcards[currentIndex]

            try {
                const response = await fetch("https://medical-backend-3eek.onrender.com/api/flashcards-daily/submit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: medicalUserId,
                        flashcardId: currentFlashcard.flashcardId._id,
                        isCorrect,
                    }),
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`)
                }

                const data = (await response.json()) as { success: boolean; error?: string }

                if (data.success) {
                    // Update local state to reflect the answer
                    const updatedChallenge = {
                        ...challenge,
                        flashcards: challenge.flashcards.map((fc, idx) =>
                            idx === currentIndex ? { ...fc, isAttempted: true, isCorrect } : fc,
                        ),
                    }
                    setChallenge(updatedChallenge)

                    // Move to next card or complete the challenge
                    if (currentIndex < challenge.flashcards.length - 1) {
                        setTimeout(() => {
                            setCurrentIndex((prev) => prev + 1)
                            setShowAnswer(false)
                        }, 1000)
                    } else {
                        // Challenge completed
                        setTimeout(() => {
                            calculateResults(updatedChallenge)
                            setView("results")
                        }, 1000)
                    }
                } else if (data.error) {
                    throw new Error(data.error)
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to submit answer")
            }
        },
        [challenge, currentIndex, medicalUserId],
    )

    // Start a new challenge
    const startChallenge = useCallback(() => {
        void fetchChallenge()
    }, [fetchChallenge])

    // Reset the challenge state
    const resetChallenge = useCallback(() => {
        setChallenge(null)
        setCurrentIndex(0)
        setShowAnswer(false)
        setView("start")
        onClose()
    }, [onClose])

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setView("start")
            void fetchProgress()
        }
    }, [isOpen, fetchProgress])

    // Render the start button
    const renderStartButton = () => {
        const hasIncompleteChallenge = progress?.attemptedToday && !progress.isCompleted

        return (
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="bg-blue-50 rounded-full p-3 mb-4">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-4 text-blue-900">Daily Flashcard Challenge</h2>
                <p className="mb-6 text-slate-600 max-w-md text-sm">
                    Test your medical knowledge with today&apos;s flashcard challenge. Answer questions to improve your mastery.
                </p>

                {hasIncompleteChallenge ? (
                    <>
                        <p className="mb-4 text-amber-600 dark:text-amber-400 text-sm">
                            You have an incomplete challenge from today.
                        </p>
                        <Progress
                            value={(progress.attempted / progress.total) * 100}
                            className="w-64 mb-4 bg-blue-500"
                        />
                        <p className="mb-4 text-xs text-slate-500">
                            {progress.attempted} of {progress.total} completed
                        </p>
                    </>
                ) : null}

                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                        Cancel
                    </Button>
                    <Button onClick={startChallenge} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {hasIncompleteChallenge ? "Continue Challenge" : "Start Today's Challenge"}
                    </Button>
                </div>
            </div>
        )
    }

    // Render the current flashcard
    const renderFlashcard = () => {
        if (!challenge) return null

        const currentFlashcard = challenge.flashcards[currentIndex]
        const progressPercentage = ((currentIndex + 1) / challenge.flashcards.length) * 100

        return (
            <div className="flex flex-col items-center">
                <div className="w-full mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">
                            Question {currentIndex + 1} of {challenge.flashcards.length}
                        </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2 bg-blue-500" />
                </div>

                <Card className="w-full mb-4 min-h-[250px] flex flex-col border-slate-200 shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-100">
                        <h3 className="text-md font-medium text-blue-900">Question</h3>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center py-6 bg-white">
                        <p className="text-lg text-center text-slate-800">{currentFlashcard.flashcardId.question}</p>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center pt-0 pb-4 bg-slate-50">
                    {!showAnswer ? (
    <Button
        onClick={() => setShowAnswer(true)}
        variant="outline"
        className="mb-4 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
    >
        Show Answer
    </Button>
) : (
    <>
        <div className="bg-blue-50 p-4 rounded-md w-full mb-4 text-center border border-blue-100">
            <p className="font-medium text-blue-900">{currentFlashcard.flashcardId.answer}</p>
        </div>
        <Button
            onClick={() => void submitAnswer(true)}
            variant="outline"
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
        >
            Next
        </Button>
    </>
)}
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Render the results screen
    const renderResults = () => {
        const percentage = (results.correct / results.total) * 100
        let message = ""
        let emoji = ""

        if (percentage >= 80) {
            message = "Excellent work! You're mastering these concepts!"
            emoji = "🎉"
        } else if (percentage >= 60) {
            message = "Good job! Keep practicing to improve further."
            emoji = "👍"
        } else if (percentage >= 40) {
            message = "Nice effort! Regular practice will help you improve."
            emoji = "💪"
        } else {
            message = "Keep going! Every review helps strengthen your knowledge."
            emoji = "🌱"
        }

        return (
            <Card className="w-full border-0 shadow-none">
                <CardHeader className="text-center pb-2">
                    <h2 className="text-xl font-bold text-blue-900">Challenge Complete! {emoji}</h2>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className="text-5xl font-bold mb-4 text-blue-700">
                        {results.correct}/{results.total}
                    </div>

                    <Progress value={percentage} className="w-full h-3 mb-4 bg-blue-500" />

                    <p className="text-center mb-4 text-sm text-slate-700">{message}</p>

                    <div className="grid grid-cols-2 gap-3 w-full mb-4">
                        <div className="bg-green-50 p-3 rounded-md text-center border border-green-100">
                            <p className="text-xs text-slate-600">Correct</p>
                            <p className="text-xl font-bold text-green-600">{results.correct}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-md text-center border border-red-100">
                            <p className="text-xs text-slate-600">Incorrect</p>
                            <p className="text-xl font-bold text-red-600">{results.total - results.correct}</p>
                        </div>
                    </div>

                    {percentage < 100 && (
                        <p className="text-xs text-slate-600 text-center mb-4">
                            Don&apos;t worry about the ones you missed. They&apos;ll appear in future challenges to help you improve!
                        </p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={resetChallenge} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Close
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    // Render the appropriate content based on the current view
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="mt-4 text-md text-slate-700">Loading your flashcards...</p>
                </div>
            )
        }

        switch (view) {
            case "start":
                return renderStartButton()
            case "challenge":
                return renderFlashcard()
            case "results":
                return renderResults()
            default:
                return renderStartButton()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-white border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-blue-900">Flashcard Challenge</DialogTitle>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    )
}
