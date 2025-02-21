"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

// Constants for validation
const VALIDATION_RULES = {
    question: {
        min: 10,
        max: 500,
    },
    option: {
        min: 1,
        max: 100,
    },
    explanation: {
        min: 20,
        max: 1000,
    },
} as const

type ValidationError = {
    field: string
    message: string
}

type Subject = {
    _id: string
    name: string
}

type Subsection = {
    _id: string
    name: string
    subject: string
}

type Question = {
    question: string
    options: [string, string, string, string]
    answer: string
    explanation: string
}

type FormData = {
    subjectId: string
    subSectionId: string
    questions: Question[]
}

type SubjectStats = {
    totalQuestions: number
    subsections: {
        id: string
        name: string
        questionCount: number
    }[]
}

const initialQuestion: Question = {
    question: "",
    options: ["", "", "", ""],
    answer: "",
    explanation: "",
}

const initialFormData: FormData = {
    subjectId: "",
    subSectionId: "",
    questions: [{ ...initialQuestion }],
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/test"

export default function DynamicForm() {
    const [formData, setFormData] = useState<FormData>(initialFormData)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [subsections, setSubsections] = useState<Subsection[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<SubjectStats | null>(null)
    const [errors, setErrors] = useState<ValidationError[]>([])
    const [touched, setTouched] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/subject`)
                setSubjects(response.data)
                setLoading(false)
            } catch (error) {
                console.error("Error fetching subjects:", error)
                toast.error("Failed to load subjects")
                setLoading(false)
            }
        }
        fetchSubjects()
    }, [])

    useEffect(() => {
        const fetchSubsections = async () => {
            if (formData.subjectId) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/subject/${formData.subjectId}/subsections`)
                    setSubsections(response.data)
                } catch (error) {
                    console.error("Error fetching subsections:", error)
                    toast.error("Failed to load subsections")
                }
            } else {
                setSubsections([])
            }
        }
        fetchSubsections()
    }, [formData.subjectId])

    useEffect(() => {
        const fetchStats = async () => {
            if (formData.subjectId) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/subject/${formData.subjectId}/stats`)
                    setStats(response.data)
                } catch (error) {
                    console.error("Error fetching stats:", error)
                }
            } else {
                setStats(null)
            }
        }
        fetchStats()
    }, [formData.subjectId])

    useEffect(() => {
        // Initialize empty answers for new questions
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map((q) => ({
                ...q,
                answer: q.answer || "",
            })),
        }))
    }, [])

    const validateField = (value: string, type: "question" | "option" | "explanation"): string | null => {
        if (!value.trim()) {
            return "This field is required"
        }
        if (value.length < VALIDATION_RULES[type].min) {
            return `Must be at least ${VALIDATION_RULES[type].min} characters`
        }
        if (value.length > VALIDATION_RULES[type].max) {
            return `Must be less than ${VALIDATION_RULES[type].max} characters`
        }
        return null
    }

    const validateForm = (): ValidationError[] => {
        const newErrors: ValidationError[] = []

        if (!formData.subjectId) {
            newErrors.push({ field: "subject", message: "Please select a subject" })
        }

        if (!formData.subSectionId) {
            newErrors.push({ field: "subsection", message: "Please select a subsection" })
        }

        formData.questions.forEach((question, questionIndex) => {
            const questionError = validateField(question.question, "question")
            if (questionError) {
                newErrors.push({ field: `question-${questionIndex}`, message: questionError })
            }

            question.options.forEach((option, optionIndex) => {
                const optionError = validateField(option, "option")
                if (optionError) {
                    newErrors.push({ field: `option-${questionIndex}-${optionIndex}`, message: optionError })
                }
            })

            if (!question.answer) {
                newErrors.push({ field: `answer-${questionIndex}`, message: "Please select a correct answer" })
            }

            const explanationError = validateField(question.explanation, "explanation")
            if (explanationError) {
                newErrors.push({ field: `explanation-${questionIndex}`, message: explanationError })
            }
        })

        return newErrors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            setErrors(validationErrors)
            setIsSubmitting(false)
            toast.error("Please fix the validation errors")
            return
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/questions`, formData)

            if (response.status === 201) {
                toast.success("Questions created successfully")
                setFormData(initialFormData)
                setErrors([])
                setTouched(new Set())
            }
        } catch (error) {
            console.error("Error:", error)
            toast.error("An error occurred while submitting the questions")
        } finally {
            setIsSubmitting(false)
        }
    }

    const addQuestion = () => {
        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, { ...initialQuestion }],
        }))
    }

    const removeQuestion = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }))
        // Clean up errors for removed question
        setErrors(errors.filter((error) => !error.field.startsWith(`question-${index}`)))
    }

    const updateQuestion = (questionIndex: number, field: keyof Question, value: string | string[]) => {
        setFormData((prev) => {
            const newQuestions = [...prev.questions]
            if (field === "options" && Array.isArray(value)) {
                newQuestions[questionIndex] = {
                    ...newQuestions[questionIndex],
                    [field]: value as [string, string, string, string],
                }
            } else {
                newQuestions[questionIndex] = {
                    ...newQuestions[questionIndex],
                    [field]: value as string,
                }
            }
            return { ...prev, questions: newQuestions }
        })

        // Mark field as touched
        setTouched((prev) => new Set(prev).add(`${field}-${questionIndex}`))
    }

    const getFieldError = (fieldId: string) => {
        return errors.find((error) => error.field === fieldId)?.message
    }

    const isFieldTouched = (fieldId: string) => {
        return touched.has(fieldId)
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mx-auto p-6">
            <Toaster position="top-right" />
            <Card>
                <CardHeader>
                    <CardTitle>Create Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Select
                                value={formData.subjectId}
                                onValueChange={(value) => {
                                    setFormData((prev) => ({ ...prev, subjectId: value, subSectionId: "" }))
                                    setTouched((prev) => new Set(prev).add("subject"))
                                }}
                            >
                                <SelectTrigger className={getFieldError("subject") ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject._id} value={subject._id}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {getFieldError("subject") && <p className="text-sm text-red-500">{getFieldError("subject")}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subsection">Subsection</Label>
                            <Select
                                value={formData.subSectionId}
                                onValueChange={(value) => {
                                    setFormData((prev) => ({ ...prev, subSectionId: value }))
                                    setTouched((prev) => new Set(prev).add("subsection"))
                                }}
                                disabled={!formData.subjectId}
                            >
                                <SelectTrigger className={getFieldError("subsection") ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select a subsection" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subsections.map((subsection) => (
                                        <SelectItem key={subsection._id} value={subsection._id}>
                                            {subsection.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {getFieldError("subsection") && <p className="text-sm text-red-500">{getFieldError("subsection")}</p>}
                        </div>
                    </div>

                    {stats && (
                        <div className="text-sm text-muted-foreground">
                            Total questions: {stats.totalQuestions}
                            {formData.subSectionId && (
                                <span className="ml-2">
                                    | Current subsection:{" "}
                                    {stats.subsections.find((s) => s.id === formData.subSectionId)?.questionCount || 0} questions
                                </span>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        {formData.questions.map((q, questionIndex) => (
                            <Card key={questionIndex}>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium">Question {questionIndex + 1}</h3>
                                        {formData.questions.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => removeQuestion(questionIndex)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Question Text</Label>
                                        <Textarea
                                            value={q.question}
                                            onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                                            className={getFieldError(`question-${questionIndex}`) ? "border-red-500" : ""}
                                            required
                                        />
                                        {isFieldTouched(`question-${questionIndex}`) && getFieldError(`question-${questionIndex}`) && (
                                            <p className="text-sm text-red-500">{getFieldError(`question-${questionIndex}`)}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {q.question.length}/{VALIDATION_RULES.question.max} characters
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Options</Label>
                                        {q.options.map((option, optionIndex) => (
                                            <div key={optionIndex} className="flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <Input
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...q.options]
                                                            newOptions[optionIndex] = e.target.value
                                                            updateQuestion(questionIndex, "options", newOptions)
                                                        }}
                                                        className={getFieldError(`option-${questionIndex}-${optionIndex}`) ? "border-red-500" : ""}
                                                        required
                                                    />
                                                    {isFieldTouched(`option-${questionIndex}-${optionIndex}`) &&
                                                        getFieldError(`option-${questionIndex}-${optionIndex}`) && (
                                                            <p className="text-sm text-red-500">
                                                                {getFieldError(`option-${questionIndex}-${optionIndex}`)}
                                                            </p>
                                                        )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant={option && q.answer === option ? "default" : "outline"}
                                                    size="sm"
                                                    className={`min-w-[120px] ${option && q.answer === option ? "bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-white" : ""}`}
                                                    onClick={() => {
                                                        const newQuestions = [...formData.questions]
                                                        newQuestions[questionIndex] = {
                                                            ...newQuestions[questionIndex],
                                                            answer: option,
                                                        }
                                                        setFormData((prev) => ({ ...prev, questions: newQuestions }))
                                                        setTouched((prev) => new Set(prev).add(`answer-${questionIndex}`))
                                                    }}
                                                >
                                                    {option && q.answer === option ? "Correct" : "Set as Correct"}
                                                </Button>
                                            </div>
                                        ))}
                                        {getFieldError(`answer-${questionIndex}`) && (
                                            <p className="text-sm text-red-500">{getFieldError(`answer-${questionIndex}`)}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Explanation</Label>
                                        <Textarea
                                            value={q.explanation}
                                            onChange={(e) => updateQuestion(questionIndex, "explanation", e.target.value)}
                                            className={getFieldError(`explanation-${questionIndex}`) ? "border-red-500" : ""}
                                            required
                                        />
                                        {isFieldTouched(`explanation-${questionIndex}`) &&
                                            getFieldError(`explanation-${questionIndex}`) && (
                                                <p className="text-sm text-red-500">{getFieldError(`explanation-${questionIndex}`)}</p>
                                            )}
                                        <p className="text-xs text-muted-foreground">
                                            {q.explanation.length}/{VALIDATION_RULES.explanation.max} characters
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" onClick={addQuestion} variant="outline">
                            <Plus className="h-4 w-4 mr-2" /> Add Question
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4 mr-2" /> {isSubmitting ? "Submitting..." : "Submit All"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}

