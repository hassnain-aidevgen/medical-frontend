"use client"

import type React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import axios from "axios"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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

interface TakeTestProps {
    initialQuestions: Question[]
    mode: "daily-challenge" | "practice"
    challengeId?: string
}

const TakeTest: React.FC<TakeTestProps> = ({ initialQuestions, mode, challengeId }) => {
    const [questions, setQuestions] = useState<Question[]>(initialQuestions)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState<string[]>([])
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        setQuestions(initialQuestions)
        setUserAnswers(Array(initialQuestions.length).fill(""))
        setCurrentQuestionIndex(0)
        setIsSubmitted(false)
        setScore(0)
    }, [initialQuestions])

    const handleAnswerChange = (answer: string) => {
        const updatedAnswers = [...userAnswers]
        updatedAnswers[currentQuestionIndex] = answer
        setUserAnswers(updatedAnswers)
    }

    const handleSubmit = async () => {
        setIsSubmitted(true)
        let correctAnswers = 0

        questions.forEach((question, index) => {
            if (question.answer === userAnswers[index]) {
                correctAnswers++
            }
        })

        const calculatedScore = (correctAnswers / questions.length) * 100
        setScore(calculatedScore)

        if (mode === "daily-challenge" && challengeId) {
            try {
                setLoading(true)
                const userId = localStorage.getItem("Medical_User_Id")
                const response = await axios.post("http://localhost:5000/api/test/submit-daily-challenge", {
                    challengeId: challengeId,
                    userId: userId,
                    score: calculatedScore,
                })

                if (response.status === 200) {
                    router.push("/daily-challenge/results")
                } else {
                    setError("Failed to submit daily challenge")
                }
            } catch (err) {
                setError("An error occurred while submitting the daily challenge")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        }
    }

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1)
        }
    }

    const currentQuestion = questions[currentQuestionIndex]

    return (
        <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <Card className="shadow-xl sm:rounded-2xl">
                    <CardHeader>
                        <CardTitle>
                            Question {currentQuestionIndex + 1} / {questions.length}
                        </CardTitle>
                        <CardDescription>{currentQuestion.topic}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-lg font-semibold">{currentQuestion.question}</p>
                        <RadioGroup defaultValue={userAnswers[currentQuestionIndex]} onValueChange={handleAnswerChange}>
                            {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value={option}
                                        id={`option-${index}`}
                                        className="peer h-5 w-5 shrink-0 rounded-full border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <label htmlFor={`option-${index}`} className="cursor-pointer peer-checked:font-semibold">
                                        {option}
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                                Previous
                            </Button>
                            <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1}>
                                Next
                            </Button>
                        </div>
                        {currentQuestionIndex === questions.length - 1 && (
                            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitted || loading}>
                                {loading ? "Submitting..." : "Submit"}
                            </Button>
                        )}
                        {isSubmitted && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Test Submitted</AlertTitle>
                                <AlertDescription>Your score: {score.toFixed(2)}%</AlertDescription>
                            </Alert>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default TakeTest

