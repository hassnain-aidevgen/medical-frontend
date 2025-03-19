"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import axios from "axios"
import { ArrowRight, CheckCircle, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "react-hot-toast"


// types/Session.ts

/**
 * Represents a single item in a medical review session
 */
export interface SessionItem {
    _id: string;
    itemType: 'flashcard' | 'question' | 'case_study';
    question: string;
    answer: string;
    options: string[];
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    specialty?: string;
    topic?: string;
    subtopics?: string[];
}

/**
 * Tracks user performance in a session
 */
export interface SessionPerformance {
    totalQuestions: number;
    correctAnswers: number;
}

interface Session {
    _id: string;
    title: string;
    type: 'daily' | 'weekly' | 'custom';
    stage: number;
    items: SessionItem[];
    performance: SessionPerformance;
}


// Type for the simple answer map to track user answers
type UserAnswersMap = Record<string, string>;
// Type for difficulty ratings
type DifficultyRatingsMap = Record<string, number>;

// Props type for the component
interface ReviewSessionProps {
    params: string | undefined;
}

export default function ReviewSession({ params }: ReviewSessionProps) {

    const [session, setSession] = useState<Session | null>(null)
    const [currentItemIndex, setCurrentItemIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState<UserAnswersMap>({})
    const [loading, setLoading] = useState(true)
    const [completed, setCompleted] = useState(false)
    const [nextReviewDate, setNextReviewDate] = useState<string | null>(null)
    const [difficultyRatings, setDifficultyRatings] = useState<DifficultyRatingsMap>({})

    const fetchSessionData = useCallback(async () => {
        try {
            setLoading(true)
            // In a real app, you would fetch the actual session data with the items to review
            const response = await axios.get<Session>(`https://medical-backend-loj4.onrender.com/api/reviews/random`)
            // For demo purposes, if the API isn't implemented yet, we'll use mock data
            const mockSession: Session = {
                _id: "",
                title: "Medical Review Session",
                type: "daily",
                stage: 1,
                items: [
                    {
                        _id: "item1",
                        itemType: "flashcard",
                        question: "What is the primary function of hemoglobin?",
                        answer: "To transport oxygen from the lungs to the tissues",
                        options: [
                            "To transport oxygen from the lungs to the tissues",
                            "To fight infections in the bloodstream",
                            "To regulate blood glucose levels",
                            "To maintain blood pressure",
                        ],
                    },
                    {
                        _id: "item2",
                        itemType: "question",
                        question: "Which of the following is NOT a symptom of myocardial infarction?",
                        answer: "Increased urination",
                        options: ["Chest pain", "Shortness of breath", "Increased urination", "Nausea and vomiting"],
                    },
                    {
                        _id: "item3",
                        itemType: "case_study",
                        question:
                            "A 45-year-old patient presents with sudden onset of severe headache, stiff neck, and photophobia. What is the most likely diagnosis?",
                        answer: "Meningitis",
                        options: ["Migraine", "Meningitis", "Tension headache", "Cluster headache"],
                    },
                ],
                performance: {
                    totalQuestions: 3,
                    correctAnswers: 0,
                },
            }

            setSession(response.data || mockSession)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching session:", error)
            // Use mock data if API fails
            setSession({
                _id: params || "",
                title: "Medical Review Session",
                type: "daily",
                stage: 1,
                items: [
                    {
                        _id: "item1",
                        itemType: "flashcard",
                        question: "What is the primary function of hemoglobin?",
                        answer: "To transport oxygen from the lungs to the tissues",
                        options: [
                            "To transport oxygen from the lungs to the tissues",
                            "To fight infections in the bloodstream",
                            "To regulate blood glucose levels",
                            "To maintain blood pressure",
                        ],
                    },
                    {
                        _id: "item2",
                        itemType: "question",
                        question: "Which of the following is NOT a symptom of myocardial infarction?",
                        answer: "Increased urination",
                        options: ["Chest pain", "Shortness of breath", "Increased urination", "Nausea and vomiting"],
                    },
                    {
                        _id: "item3",
                        itemType: "case_study",
                        question:
                            "A 45-year-old patient presents with sudden onset of severe headache, stiff neck, and photophobia. What is the most likely diagnosis?",
                        answer: "Meningitis",
                        options: ["Migraine", "Meningitis", "Tension headache", "Cluster headache"],
                    },
                ],
                performance: {
                    totalQuestions: 3,
                    correctAnswers: 0,
                },
            })
            setLoading(false)
            toast.error("Failed to load review session")
        }
    }, [params])

    useEffect(() => {
        fetchSessionData()
    }, [fetchSessionData])

    const handleAnswer = (itemId: string, answer: string) => {
        setUserAnswers({
            ...userAnswers,
            [itemId]: answer,
        })
    }

    const handleDifficultyRating = (itemId: string, rating: number) => {
        setDifficultyRatings({
            ...difficultyRatings,
            [itemId]: rating,
        })
    }

    const isLastItem = (): boolean => {
        if (!session) return false
        return currentItemIndex === session.items.length - 1
    }

    const moveToNext = () => {
        if (isLastItem()) {
            completeSession()
        } else {
            setCurrentItemIndex(currentItemIndex + 1)
        }
    }

    const completeSession = async () => {
        try {
            if (!session) return

            // Calculate performance
            let correctAnswers = 0
            session.items.forEach((item) => {
                if (userAnswers[item._id] === item.answer) {
                    correctAnswers++
                }
            })

            const performance: SessionPerformance = {
                totalQuestions: session.items.length,
                correctAnswers,
            }

            const userId = localStorage.getItem("Medical_User_Id")

            // Prepare the payload for the API
            interface CompletionPayload {
                performance: SessionPerformance;
                difficultyRatings: DifficultyRatingsMap;
            }

            interface CompletionResponse {
                nextReview?: string;
                // Add other expected response fields here
            }

            // Submit session completion
            const response = await axios.post<CompletionResponse>(
                `https://medical-backend-loj4.onrender.com/api/reviews/${params}/complete?userId=${userId}`,
                {
                    performance,
                    difficultyRatings,
                } as CompletionPayload
            )

            // For demo purposes, if the API isn't implemented yet
            const mockNextReview = new Date()
            if (correctAnswers / session.items.length >= 0.8) {
                // Good performance - move to next stage
                mockNextReview.setDate(mockNextReview.getDate() + 7) // Stage 2
            } else if (correctAnswers / session.items.length >= 0.6) {
                // Average performance - stay at current stage
                mockNextReview.setDate(mockNextReview.getDate() + 1) // Stage 1
            } else {
                // Poor performance - repeat sooner
                mockNextReview.setHours(mockNextReview.getHours() + 12) // Repeat sooner
            }

            setNextReviewDate(response?.data?.nextReview || mockNextReview.toISOString())
            setCompleted(true)
            toast.success("Review session completed!")
        } catch (error) {
            console.error("Error completing session:", error)
            toast.error("Failed to complete review session")

            // For demo purposes, show completion screen anyway
            const mockNextReview = new Date()
            mockNextReview.setDate(mockNextReview.getDate() + 1)
            setNextReviewDate(mockNextReview.toISOString())
            setCompleted(true)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-12 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Loading review session...</h2>
                    <Progress value={100} className="w-64 mx-auto" />
                </div>
            </div>
        )
    }

    if (completed && session) {
        // Show completion screen
        const correctAnswers = session.items.filter((item) => userAnswers[item._id] === item.answer).length
        const totalQuestions = session.items.length
        const score = Math.round((correctAnswers / totalQuestions) * 100)

        return (
            <div className="container mx-auto py-12">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">Review Session Completed!</CardTitle>
                        <CardDescription>You&apos;ve completed your review session. Here&apos;s how you did:</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center py-6">
                            <div className="text-5xl font-bold mb-2">{score}%</div>
                            <p className="text-muted-foreground">
                                {correctAnswers} correct out of {totalQuestions} questions
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium">Performance Breakdown:</h3>
                            <ul className="space-y-2">
                                {session.items.map((item, index) => {
                                    const isCorrect = userAnswers[item._id] === item.answer
                                    return (
                                        <li key={item._id} className="flex items-start gap-2 p-2 rounded-md border">
                                            {isCorrect ? (
                                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                            )}
                                            <div>
                                                <p className="font-medium">
                                                    Question {index + 1}: {item.question}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Your answer: {userAnswers[item._id]}</p>
                                                {!isCorrect && <p className="text-sm text-green-600">Correct answer: {item.answer}</p>}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>

                        <div className="rounded-md bg-muted p-4">
                            <h3 className="font-medium mb-2">Next Review:</h3>
                            <p>Based on your performance, your next review is scheduled for:</p>
                            <p className="font-bold mt-1">{nextReviewDate ? new Date(nextReviewDate).toLocaleString() : "Soon"}</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => (window.location.href = "/dashboard/review")}>
                            Return to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Safety check to make sure session is loaded
    if (!session) {
        return (
            <div className="container mx-auto py-12 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Session not found</h2>
                    <Button onClick={() => window.location.href = "/dashboard/review"}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    // Show current review item
    const currentItem = session.items[currentItemIndex]
    const progress = ((currentItemIndex + 1) / session.items.length) * 100

    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{session.title}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            {currentItemIndex + 1} of {session.items.length}
                        </div>
                    </div>
                    <Progress value={progress} className="mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium mb-4">{currentItem.question}</h3>

                        <RadioGroup
                            value={userAnswers[currentItem._id] || ""}
                            onValueChange={(value) => handleAnswer(currentItem._id, value)}
                            className="space-y-3"
                        >
                            {currentItem.options.map((option) => (
                                <div key={option} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted">
                                    <RadioGroupItem value={option} id={option} />
                                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {userAnswers[currentItem._id] && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">How difficult was this question?</h4>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <Button
                                            key={rating}
                                            variant={difficultyRatings[currentItem._id] === rating ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleDifficultyRating(currentItem._id, rating)}
                                        >
                                            {rating}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Easy</span>
                                <span>Difficult</span>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <div className="flex-1">
                        {userAnswers[currentItem._id] && (
                            <div className="flex items-center gap-2">
                                {userAnswers[currentItem._id] === currentItem.answer ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="text-green-600">Correct!</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-500" />
                                        <span className="text-red-600">Incorrect. The answer is: {currentItem.answer}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <Button onClick={moveToNext} disabled={!userAnswers[currentItem._id] || !difficultyRatings[currentItem._id]}>
                        {isLastItem() ? "Complete Review" : "Next Question"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}