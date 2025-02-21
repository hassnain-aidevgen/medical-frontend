"use client"

import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import axios from "axios"
import { Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

interface Question {
    id: string
    question: string
    options: [string, string, string, string]
    answer: string
    explanation: string
}

const BASE_API_URL = "https://medical-backend-loj4.onrender.com/api/test"

export default function TestRecord() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [visibleCount, setVisibleCount] = useState(10) // Start with 10
    const [allQuestions, setAllQuestions] = useState<Question[]>([])

    useEffect(() => {
        fetchQuestions()
    }, [])

    const fetchQuestions = async () => {
        try {
            const response = await axios.get(`${BASE_API_URL}/questions`)
            setAllQuestions(response.data)
            setQuestions(response.data.slice(0, 10)) // Show only the first 10 initially
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to load questions: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to load questions: ${(error as Error).message}`)
            }
        } finally {
            setTimeout(() => {
                toast.dismiss()
            }, 2000)
        }
    }

    const handleShowMore = () => {
        const newVisibleCount = visibleCount + 10
        setVisibleCount(newVisibleCount)
        setQuestions(allQuestions.slice(0, newVisibleCount))
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return

        try {
            await axios.delete(`${BASE_API_URL}/questions/${id}`)
            const updatedQuestions = allQuestions.filter((q) => q.id !== id)
            setAllQuestions(updatedQuestions)
            setQuestions(updatedQuestions.slice(0, visibleCount)) // Update visible questions
            toast.success("Question deleted successfully")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to delete question: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to delete question: ${(error as Error).message}`)
            }
        } finally {
            setTimeout(() => {
                toast.dismiss()
            }, 2000)
        }
    }

    return (
        <>
            <Toaster position="top-right" />
            <CardContent className="p-6">
                <div className="space-y-6">
                    {questions.map((question) => (
                        <div key={question.id} className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-medium">{question.question}</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                {question.options.map((option, index) => (
                                    <li key={index} className={option === question.answer ? "font-bold" : ""}>
                                        {option} {option === question.answer && "(Correct)"}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-muted-foreground">
                                <strong>Explanation:</strong> {question.explanation}
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(question.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Show More Button */}
                {visibleCount < allQuestions.length && (
                    <div className="flex justify-center mt-6">
                        <Button onClick={handleShowMore} variant="default">
                            Show More
                        </Button>
                    </div>
                )}
            </CardContent>
        </>
    )
}
