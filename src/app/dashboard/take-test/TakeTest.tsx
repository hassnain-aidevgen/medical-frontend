"use client"

import TestPageWarning from "@/components/pageTestWarning"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { AlertCircle, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import QuestionBox from "./QuestionBox"
import TestSummary from "./TestSummary"

type Question = {
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

// Interface for recommended questions from create-test page
interface RecommendedQuestion {
    questionText: string
    correctAnswer: string
    topic: string
    _id?: string
}

const TakeTest = () => {
    // const router = useRouter()
    const searchParams = useSearchParams()

    const mode = searchParams.get("mode") || "tutor"
    const subjectsParam = searchParams.get("subjects") || ""
    const subsectionsParam = searchParams.get("subsections") || ""
    const countParam = searchParams.get("count") || "10"
    const isRecommendedTest = searchParams.get("isRecommendedTest") === "true"

    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
    const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({})
    const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({})
    const [startTime, setStartTime] = useState<number | null>(null)
    const [timeLeft, setTimeLeft] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showResults, setShowResults] = useState(false)

    const totalQuestions = Math.max(1, Number.parseInt(countParam, 10))
    const [combinedQuestions, setCombinedQuestions] = useState<Question[]>([])

    // Generate contextually relevant incorrect options based on the correct answer
    const generatePlausibleOptions = (correctAnswer: string, topic: string): string[] => {
        // Get base words from the correct answer to create variations
        const words = correctAnswer.split(' ');
        
        // Medical terminology common modifiers
        const medicalModifiers = [
            'acute', 'chronic', 'mild', 'severe', 'primary', 'secondary', 
            'early', 'late', 'benign', 'malignant', 'partial', 'complete',
            'anterior', 'posterior', 'bilateral', 'unilateral'
        ];
        
        // Common medical conditions that could be substituted
        const medicalConditions = [
            'hypertension', 'hypotension', 'tachycardia', 'bradycardia',
            'hyperglycemia', 'hypoglycemia', 'anemia', 'leukemia',
            'pneumonia', 'bronchitis', 'hepatitis', 'nephritis',
            'syndrome', 'disease', 'disorder', 'deficiency'
        ];
        
        // Generate options based on the context
        const options: string[] = [correctAnswer];
        
        // Option 1: Modify a word in the correct answer
        if (words.length > 1) {
            const modifiedWords = [...words];
            const randomIndex = Math.floor(Math.random() * words.length);
            modifiedWords[randomIndex] = medicalModifiers[Math.floor(Math.random() * medicalModifiers.length)];
            options.push(modifiedWords.join(' '));
        } else {
            // If only one word, prepend a modifier
            options.push(`${medicalModifiers[Math.floor(Math.random() * medicalModifiers.length)]} ${correctAnswer}`);
        }
        
        // Option 2: Replace with a related but incorrect condition
        options.push(`${topic} related ${medicalConditions[Math.floor(Math.random() * medicalConditions.length)]}`);
        
        // Option 3: Negate or invert the meaning
        if (correctAnswer.includes('increase')) {
            options.push(correctAnswer.replace('increase', 'decrease'));
        } else if (correctAnswer.includes('decrease')) {
            options.push(correctAnswer.replace('decrease', 'increase'));
        } else if (correctAnswer.includes('high')) {
            options.push(correctAnswer.replace('high', 'low'));
        } else if (correctAnswer.includes('low')) {
            options.push(correctAnswer.replace('low', 'high'));
        } else {
            // Default option if no specific pattern to invert
            options.push(`No ${correctAnswer}`);
        }
        
        // Shuffle the options to randomize the position of the correct answer
        return shuffleArray(options);
    };

    // Helper function to shuffle an array
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        
        try {
            // Check if we're using recommended questions
            if (isRecommendedTest) {
                // Get user ID from localStorage
                const userId = localStorage.getItem("Medical_User_Id")
                if (!userId) {
                    throw new Error("User ID not found. Please log in again.")
                }
                
                // Fetch recommended questions using the existing API endpoint
                const recommendationsResponse = await axios.get(
                    `https://medical-backend-loj4.onrender.com/api/test/recommendations/${userId}`
                );
                
                if (!recommendationsResponse.data.recommendations || 
                    recommendationsResponse.data.recommendations.length === 0) {
                    throw new Error("No recommended questions available. Please take more tests first.");
                }
                
                // Create questions directly from the recommendations since we can't filter by topic
                // Map the recommendation data to match the Question structure as closely as possible
                const mappedQuestions: Question[] = recommendationsResponse.data.recommendations.map((rec: RecommendedQuestion, index: number) => ({
                    _id: rec._id || `rec-${index}`,
                    question: rec.questionText,
                    options: generatePlausibleOptions(rec.correctAnswer, rec.topic),
                    answer: rec.correctAnswer,
                    explanation: `This question covers ${rec.topic}.`,
                    subject: "Recommended",
                    subsection: rec.topic,
                    system: "General",
                    topic: rec.topic,
                    subtopics: [],
                    exam_type: "USMLE_STEP1",
                    year: new Date().getFullYear(),
                    difficulty: "medium",
                    specialty: "General",
                    clinical_setting: "General",
                    question_type: "single_best_answer"
                }));
                
                setQuestions(mappedQuestions);
                setCombinedQuestions(mappedQuestions);
                
                console.log("Using mapped recommendations:", mappedQuestions);
            } else {
                // Original fetch logic for regular test
                const response = await axios.get("https://medical-backend-loj4.onrender.com/api/test/take-test/questions", {
                    params: {
                        subjects: subjectsParam,
                        subsections: subsectionsParam,
                        count: totalQuestions,
                    },
                });
                setQuestions(response.data);
                setCombinedQuestions(response.data);
            }
            
            setStartTime(Date.now());
            if (mode === "timer") {
                // For recommended test, use actual questions length
                const questionCount = questions.length > 0 ? questions.length : totalQuestions;
                setTimeLeft(questionCount * 60); // 60 seconds per question
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch questions. Please try again.");
            console.error("Error fetching questions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [subjectsParam, subsectionsParam, totalQuestions, mode, isRecommendedTest, questions.length]);

    useEffect(() => {
        fetchQuestions()
    }, [fetchQuestions])

    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: answer,
        }))
    }

    const handleFinishTest = useCallback(() => {
        const currentTime = Date.now()
        const timeSpent = startTime ? Math.round((currentTime - startTime) / 1000) : 0
        setQuestionTimes((prev) => ({
            ...prev,
            [currentQuestionIndex]: timeSpent,
        }))
        setShowResults(true)
    }, [startTime, currentQuestionIndex])

    const handleAnswerSubmit = useCallback(() => {
        if (selectedAnswers[currentQuestionIndex]) {
            const currentTime = Date.now()
            const timeSpent = startTime ? Math.round((currentTime - startTime) / 1000) : 0
            setQuestionTimes((prev) => ({
                ...prev,
                [currentQuestionIndex]: timeSpent,
            }))
            setStartTime(currentTime)
            setSubmittedAnswers((prev) => ({
                ...prev,
                [currentQuestionIndex]: true,
            }))
        }
    }, [currentQuestionIndex, selectedAnswers, startTime])

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1)
            setStartTime(Date.now())
        } else {
            handleFinishTest()
        }
    }

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1)
        }
    }

    const calculateScore = () => {
        return combinedQuestions.reduce((score, question, index) => {
            return score + (selectedAnswers[index] === question.answer ? 1 : 0)
        }, 0)
    }

    if (isLoading) {
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

    if (showResults) {
        return (
            <TestSummary
                questions={combinedQuestions}
                selectedAnswers={selectedAnswers}
                questionTimes={questionTimes}
                score={calculateScore()}
                totalTime={Object.values(questionTimes).reduce((sum, time) => sum + time, 0)}
            />
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <TestPageWarning
                selectedAnswers={selectedAnswers}
                showResults={showResults}
                // currentQuestion={currentQuestion}
                totalQuestions={questions.length}
            />

            <h1 className="text-3xl font-bold mb-8">
                {isRecommendedTest ? "Recommended Questions Test" : "Medical Test"}
            </h1>

            {mode === "timer" && (
                <div className="mb-4 text-xl flex items-center">
                    <Clock className="mr-2" />
                    Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </div>
            )}

            {questions.length > 0 && (
                <QuestionBox
                    question={questions[currentQuestionIndex]}
                    selectedAnswer={selectedAnswers[currentQuestionIndex]}
                    onAnswerSelect={handleAnswerSelect}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    showCorrectAnswer={submittedAnswers[currentQuestionIndex]}
                    onSubmit={handleAnswerSubmit}
                />
            )}

            <div className="flex gap-5 mt-6">
                <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                    Previous
                </Button>
                {!submittedAnswers[currentQuestionIndex] ? (
                    <Button onClick={handleAnswerSubmit} disabled={!selectedAnswers[currentQuestionIndex]}>
                        Submit Answer
                    </Button>
                ) : (
                    <Button onClick={currentQuestionIndex === questions.length - 1 ? handleFinishTest : handleNextQuestion}>
                        {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default TakeTest