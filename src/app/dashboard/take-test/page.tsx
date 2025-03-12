"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import axios from "axios"
import { AlertCircle } from "lucide-react"
import { Suspense, useEffect, useState } from "react"
import TakeTest from "./TakeTest"

// Define the Question interface
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

export default function TakeTestPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        // Fetch questions from your API
        const response = await axios.get("http://localhost:5000/api/test/questions")

        if (response.status === 200 && response.data) {
          setQuestions(response.data)
        } else {
          setError("Failed to fetch questions")
        }
      } catch (err) {
        console.error("Error fetching questions:", err)
        setError("An error occurred while fetching questions")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading questions...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // If no questions were fetched, provide some sample questions
  if (questions.length === 0) {
    const sampleQuestions: Question[] = [
      {
        _id: "sample1",
        question: "What is the most common cause of community-acquired pneumonia?",
        options: [
          "Streptococcus pneumoniae",
          "Haemophilus influenzae",
          "Klebsiella pneumoniae",
          "Staphylococcus aureus",
        ],
        answer: "Streptococcus pneumoniae",
        explanation: "Streptococcus pneumoniae is the most common cause of community-acquired pneumonia in adults.",
        subject: "Infectious Disease",
        subsection: "Respiratory Infections",
        system: "Respiratory",
        topic: "Pneumonia",
        subtopics: ["Bacterial Infections", "Respiratory Infections"],
        exam_type: "USMLE_STEP1",
        year: 2023,
        difficulty: "medium",
        specialty: "Internal Medicine",
        clinical_setting: "Outpatient",
        question_type: "single_best_answer",
      },
      {
        _id: "sample2",
        question: "Which of the following is a risk factor for osteoporosis?",
        options: [
          "High body mass index",
          "African American ethnicity",
          "Early menopause",
          "Regular weight-bearing exercise",
        ],
        answer: "Early menopause",
        explanation: "Early menopause leads to decreased estrogen levels, which is a risk factor for osteoporosis.",
        subject: "Endocrinology",
        subsection: "Bone Metabolism",
        system: "Musculoskeletal",
        topic: "Osteoporosis",
        subtopics: ["Risk Factors", "Bone Diseases"],
        exam_type: "USMLE_STEP2",
        year: 2023,
        difficulty: "easy",
        specialty: "Endocrinology",
        clinical_setting: "Outpatient",
        question_type: "single_best_answer",
      },
    ]

    return (
      <Suspense fallback={"Loading Tests..."}>
        <TakeTest initialQuestions={sampleQuestions} mode="practice" />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={"Loading Tests..."}>
      <TakeTest initialQuestions={questions} mode="practice" />
    </Suspense>
  )
}

