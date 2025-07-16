"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CheckCircle2, Loader2, RefreshCw, Sparkles, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import "./flashcard-flip.css" // Ensure this CSS file exists and is imported

// Interface Definitions
interface FlashcardChallengeProps {
    isOpen: boolean
    onClose: () => void
}

type Flashcard = {
    _id: string
    question: string
    answer: string
}

type FlashcardChallenge = {
    _id?: string
    flashcards: {
        flashcardId: Flashcard
        isAttempted?: boolean
        isCorrect?: boolean
    }[]
}

type ProgressData = {
    attemptedToday: boolean
    isCompleted: boolean
}

type ChallengeView = "loading" | "start" | "challenge" | "complete"

type SessionResults = {
    correct: number;
    incorrect: number;
}


export function FlashcardChallenge({ isOpen, onClose }: FlashcardChallengeProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [challenge, setChallenge] = useState<FlashcardChallenge | null>(null)
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [showAnswer, setShowAnswer] = useState<boolean>(false)
    const [view, setView] = useState<ChallengeView>("loading")
    const [medicalUserId, setMedicalUserId] = useState<string | null>(null)
    const [sessionResults, setSessionResults] = useState<SessionResults>({ correct: 0, incorrect: 0 })

    useEffect(() => {
        setIsMounted(true)
        if (typeof window !== "undefined") {
            const storedUserId = localStorage.getItem("Medical_User_Id")
            setMedicalUserId(storedUserId)
        }
    }, [])

    const resetScore = () => {
        setSessionResults({ correct: 0, incorrect: 0 });
    }

    const fetchChallenge = useCallback(async () => {
        if (!medicalUserId) return
        setView("loading")
        resetScore()
        try {
            const response = await fetch(`https://medical-backend-3eek.onrender.com/api/flashcards-daily?userId=${medicalUserId}`)
            const data = await response.json()
            if (data.success && data.challenge) {
                setChallenge(data.challenge)
                const startIndex = data.challenge.flashcards.findIndex((fc: any) => !fc.isAttempted)
                setCurrentIndex(startIndex >= 0 ? startIndex : 0)
                setView("challenge")
            } else {
                toast.error(data.error || "No flashcards for today's challenge")
                setView("start")
            }
        } catch (error) {
            toast.error("Failed to fetch daily challenge")
            setView("start")
        }
    }, [medicalUserId])

    const startPracticeSession = useCallback(async () => {
        if (!medicalUserId) return
        setView("loading")
        resetScore()
        try {
            const response = await fetch(`https://medical-backend-3eek.onrender.com/api/flashcards-daily/practice?userId=${medicalUserId}`)
            const data = await response.json()
            if (data.success && data.practiceCards) {
                setChallenge({
                    flashcards: data.practiceCards.map((card: Flashcard) => ({ flashcardId: card })),
                })
                setCurrentIndex(0)
                setView("challenge")
            } else {
                toast.error(data.error || "Could not start a practice session.")
                setView("complete")
            }
        } catch (error) {
            toast.error("Failed to start practice session")
            setView("complete")
        }
    }, [medicalUserId])

    const fetchProgress = useCallback(async () => {
        if (!medicalUserId) return
        setView("loading")
        try {
            const response = await fetch(`https://medical-backend-3eek.onrender.com/api/flashcards-daily/progress?userId=${medicalUserId}`)
            const data: { success: boolean } & ProgressData = await response.json()

            if (data.success) {
                if (data.attemptedToday && data.isCompleted) {
                    setView("complete")
                } else {
                    setView("start")
                }
            } else {
                setView("start")
            }
        } catch (error) {
            toast.error("Failed to fetch progress")
            setView("start")
        }
    }, [medicalUserId])

    const submitAnswer = useCallback(
        async (isCorrect: boolean) => {
            if (isCorrect) {
                setSessionResults(prev => ({ ...prev, correct: prev.correct + 1 }));
            } else {
                setSessionResults(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
            }

            setShowAnswer(false)

            setTimeout(async () => {
                const isLastCard = currentIndex >= challenge!.flashcards.length - 1;

                if (isLastCard) {
                    setView("complete");
                } else {
                    setCurrentIndex((prev) => prev + 1);
                }

                if (challenge?._id) {
                    await fetch("https://medical-backend-3eek.onrender.com/api/flashcards-daily/submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: medicalUserId,
                            flashcardId: challenge.flashcards[currentIndex].flashcardId._id,
                            isCorrect,
                        }),
                    });
                }
            }, 600)
        },
        [challenge, currentIndex, medicalUserId]
    )

    useEffect(() => {
        if (isOpen && medicalUserId) {
            fetchProgress()
        } else if (!isOpen) {
            setChallenge(null)
            setCurrentIndex(0)
            setShowAnswer(false)
            setView("loading")
        }
    }, [isOpen, medicalUserId, fetchProgress])

    const renderStartButton = () => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-sky-100 rounded-full p-4 mb-4">
                <BookOpen className="h-10 w-10 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Daily Flashcard Challenge</h2>
            <p className="mb-6 text-slate-600 max-w-sm">Review cards you&apos;ve learned or struggled with to build long-term memory.</p>
            <Button onClick={fetchChallenge} size="lg" className="bg-sky-600 hover:bg-sky-700">
                {"Start Today's Challenge"}
            </Button>
        </div>
    )

    const renderFlashcard = () => {
        if (!challenge) return null
        const currentFlashcard = challenge.flashcards[currentIndex]
        const progressPercentage = ((currentIndex + 1) / challenge.flashcards.length) * 100

        return (
            <div className="flex flex-col items-center">
                <Progress value={progressPercentage} className="w-full h-2 mb-4" />
                <div className="card-container w-full h-[250px] mb-4">
                    <div className={`card-inner ${showAnswer ? 'is-flipped' : ''}`}>
                        <div className="card-face card-front">
                            {currentFlashcard.flashcardId.question}
                        </div>
                        <div className="card-face card-back">
                            {currentFlashcard.flashcardId.answer}
                        </div>
                    </div>
                </div>
                {!showAnswer ? (
                    <Button onClick={() => setShowAnswer(true)} variant="outline" size="lg" className="w-full">
                        Flip to See Answer
                    </Button>
                ) : (
                    <div className="w-full text-center">
                        <p className="text-sm text-muted-foreground mb-3">Did you know the answer?</p>
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button onClick={() => submitAnswer(false)} variant="outline" size="lg" className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200">
                                <XCircle className="mr-2 h-4 w-4" /> Incorrect
                            </Button>
                            <Button onClick={() => submitAnswer(true)} variant="outline" size="lg" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Correct
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const renderComplete = () => {
        const total = sessionResults.correct + sessionResults.incorrect;
        const percentage = total > 0 ? (sessionResults.correct / total) * 100 : 0;
        let feedbackMessage = "";

        if (percentage >= 80) {
            feedbackMessage = "Excellent work! You have a strong grasp of this material.";
        } else if (percentage >= 50) {
            feedbackMessage = "Good job! Keep up the consistent practice.";
        } else {
            feedbackMessage = "Nice effort! Every review session helps you learn.";
        }

        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-green-100 rounded-full p-4 mb-4">
                    <Sparkles className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Session Complete!</h2>
                <p className="mb-4 text-slate-600 max-w-sm">{feedbackMessage}</p>

                <div className="grid grid-cols-2 gap-4 w-full mb-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">Correct</p>
                        <p className="text-2xl font-bold text-green-600">{sessionResults.correct}</p>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">Incorrect</p>
                        <p className="text-2xl font-bold text-red-600">{sessionResults.incorrect}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
                    <Button onClick={startPracticeSession} className="w-full bg-sky-600 hover:bg-sky-700">
                        <RefreshCw className="mr-2 h-4 w-4"/> Practice More
                    </Button>
                </div>
            </div>
        )
    }

    const renderContent = () => {
        if (!isMounted || view === "loading") {
            return (
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                </div>
            )
        }
        switch (view) {
            case "start": return renderStartButton()
            case "challenge": return renderFlashcard()
            case "complete": return renderComplete()
            default: return renderStartButton()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Flashcard Challenge</DialogTitle>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    )
}