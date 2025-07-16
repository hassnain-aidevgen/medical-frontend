"use client"

import type React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import axios from "axios"
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"
import {
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Loader2,
  Share2,
  Sparkles,
  BookOpenCheck,
  BarChart
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Doughnut } from "react-chartjs-2"
import toast, { Toaster } from "react-hot-toast"
import TargetedExamBlueprint from "@/components/targeted-exam-blueprint"
import { Progress } from "@/components/ui/progress"

ChartJS.register(ArcElement, Tooltip, Legend)

type TestSummaryProps = {
  questions: {
    _id: string
    question: string
    answer: string
    explanation?: string
    targetExam?: string
    subject?: string | object
    subsection?: string | object
    subjectName?: string
    subsectionName?: string
    subjectDisplay?: string
    subsectionDisplay?: string
    exam_type?: string
    difficulty?: string
    topic?: string
  }[]
  selectedAnswers: { [key: number]: string }
  questionTimes: { [key: number]: number }
  score: number
  totalTime: number
  isAIGenerated?: boolean
  aiTopic?: string
  targetExam?: string
  examDate?: string
  isRecommendedTest?: boolean
}

type QuestionAnalytics = {
  totalAttempts: number
  avgResponseTime: number
  correctPercentage: number
}


const TestSummary: React.FC<TestSummaryProps> = ({
  questions,
  selectedAnswers,
  questionTimes,
  score,
  totalTime,
  isAIGenerated = false,
  aiTopic = "",
  targetExam = "",
  examDate = "",
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false)
  const [isAddingToFlashcards, setIsAddingToFlashcards] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // AI Feedback states
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [questionAnalytics, setQuestionAnalytics] = useState<{[key: string]: QuestionAnalytics}>({});
const [loadingAnalytics, setLoadingAnalytics] = useState<{[key: string]: boolean}>({});

  // Check if this was a recommended test
  const isRecommendedTest = searchParams.get("isRecommendedTest") === "true"

  const percentage = (score / questions.length) * 100
  const incorrectCount = questions.length - score

  const chartData = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [score, incorrectCount],
        backgroundColor: ["#4ade80", "#f87171"],
        hoverBackgroundColor: ["#22c55e", "#ef4444"],
      },
    ],
  }

  // Helper function to format exam name for display
  const formatExamName = (examType: string) => {
    if (!examType) return ""
    return examType.replace("_", " ").replace(/USMLE/g, "USMLE ").trim()
  }

  // Function to track user performance using our new schema
  const trackUserPerformance = async (userId: string) => {
    try {
      console.log("Tracking user performance...");
      
      // Prepare data to send to the API
      const performanceData = {
        userId,
        questions,
        selectedAnswers
      };
      
      // Send performance data to the API
      const response = await axios.post(
        "https://medical-backend-3eek.onrender.com/api/test/update-performance", 
        performanceData,
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      
      if (response.status === 200) {
        console.log("Performance data saved successfully:", response.data.message);
        return true;
      } else {
        console.error("Failed to save performance data:", response.data);
        return false;
      }
    } catch (err) {
      console.error("Error tracking user performance:", err);
      return false;
    }
  };

  useEffect(() => {
    const fetchQuestionAnalytics = async () => {
      const analyticsPromises = questions.map(async (question) => {
        // Skip analytics fetch for AI-generated questions
        if (isAIGenerated || !question._id || question._id.startsWith('ai')) {
          return { id: question._id, data: null };
        }
  
        const loadingState = { ...loadingAnalytics };
        loadingState[question._id] = true;
        setLoadingAnalytics(loadingState);
  
        try {
          const response = await axios.get(
            `https://medical-backend-3eek.onrender.com/api/test/take-test/question-analytics/${question._id}`
          );
          return { id: question._id, data: response.data };
        } catch (error) {
          console.error(`Error fetching analytics for question ${question._id}:`, error);
          return { id: question._id, data: null };
        } finally {
          const updatedLoadingState = { ...loadingAnalytics };
          updatedLoadingState[question._id] = false;
          setLoadingAnalytics(updatedLoadingState);
        }
      });
  
      const results = await Promise.all(analyticsPromises);
      
      const analyticsData = results.reduce((acc, result) => {
        if (result.id && result.data) {
          acc[result.id] = result.data;
        }
        return acc;
      }, {} as {[key: string]: QuestionAnalytics});
      
      setQuestionAnalytics(analyticsData);
    };
  
    if (questions.length > 0 && !isAIGenerated) {
      fetchQuestionAnalytics();
    }
  }, [questions]);

  // Fetch AI feedback when component mounts
 useEffect(() => {
    const fetchAIFeedback = async () => {
      setIsLoadingFeedback(true)
      setFeedbackError(null)

      try {
        // Correctly map questions using human-readable names for the 'topic' field
        const feedbackData = {
          questions: questions.map((q, index) => ({
            questionId: q._id,
            questionText: q.question,
            correctAnswer: q.answer,
            userAnswer: selectedAnswers[index] || "",
            timeSpent: questionTimes[index] || 0,
            // FIX: Use display/name fields instead of raw IDs for the topic
            topic: q.subsectionDisplay || q.subsectionName || q.subjectDisplay || q.subjectName || "General Knowledge",
          })),
          score,
          totalTime,
          percentage,
          targetExam: targetExam || "",
        }

        const response = await axios.post(
          "https://medical-backend-3eek.onrender.com/api/ai-explain/ai-report-feedback",
          feedbackData,
        )

        setAiFeedback(response.data.feedback)
      } catch (error) {
        console.error("Error fetching AI feedback:", error)
        setFeedbackError("Unable to load AI feedback at this time")
      } finally {
        setIsLoadingFeedback(false)
      }
    }

    if (questions.length > 0) {
      fetchAIFeedback()
    }
  }, [questions, selectedAnswers, questionTimes, score, totalTime, percentage, targetExam])

  const handleSubmitResults = async () => {
    setLoading(true);
    setError(null);

    const userId = localStorage.getItem("Medical_User_Id");
    console.log("Processing questions for submission...");

    let testData = null;
    
    // Log raw question data to debug
    console.log("Raw questions data:", JSON.stringify(questions.slice(0, 1), null, 2));
    
    if (isAIGenerated) {
      // For AI-generated tests
      const formattedQuestions = questions.map((q, index) => {
        console.log(`Processing AI question ${index}:`, q._id);
        return {
          questionId: q._id || `ai${Date.now()}${index}`,
          questionText: q.question,
          correctAnswer: q.answer,
          userAnswer: selectedAnswers[index] || "",
          timeSpent: questionTimes[index] || 0,
          // Add these fields even for AI-generated questions
          subject: "AI Generated",
          subjectName: "AI Generated",
          subsection: aiTopic || "Custom Topic",
          subsectionName: aiTopic || "Custom Topic",
          exam_type: targetExam || "",
          difficulty: "medium",
          topic: aiTopic || "Custom Topic"
        };
      });
      
      testData = {
        userId,
        questions: formattedQuestions,
        score,
        totalTime,
        percentage,
        isRecommendedTest: false,
        targetExam: targetExam || "",
        examDate: examDate || ""
      };
    } else {
      // For regular tests
      const formattedQuestions = questions.map((q, index) => {
        // Log what we're processing for debugging
        console.log(`Processing regular question ${index}:`, {
          id: q._id,
          subject: q.subject,
          subjectName: q.subjectName || q.subjectDisplay,
          subsection: q.subsection,
          subsectionName: q.subsectionName || q.subsectionDisplay
        });
        
        return {
          questionId: q._id,
          questionText: q.question,
          correctAnswer: q.answer,
          userAnswer: selectedAnswers[index] || "",
          timeSpent: questionTimes[index] || 0,
          // Convert fields to strings to ensure they're saved properly
          subject: typeof q.subject === 'object' ? JSON.stringify(q.subject) : String(q.subject || ""),
          subjectName: String(q.subjectDisplay || q.subjectName || "Unknown Subject"),
          subsection: typeof q.subsection === 'object' ? JSON.stringify(q.subsection) : String(q.subsection || ""),
          subsectionName: String(q.subsectionDisplay || q.subsectionName || "Unknown Topic"),
          exam_type: String(q.exam_type || ""),
          difficulty: String(q.difficulty || "medium"),
          topic: String(q.topic || "")
        };
      });
      
      testData = {
        userId,
        questions: formattedQuestions,
        score,
        totalTime,
        percentage,
        isRecommendedTest: isRecommendedTest || false,
        targetExam: targetExam || "",
        examDate: examDate || ""
      };
    }
    
    // Debug log the first question to verify structure
    if (testData.questions.length > 0) {
      console.log("First formatted question sample:", JSON.stringify(testData.questions[0], null, 2));
    }
    
    try {
      console.log("Submitting test data to API...");
      const response = await axios.post(
        "https://medical-backend-3eek.onrender.com/api/test/take-test/submit-test/v2", 
        testData, 
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status !== 201) {
        throw new Error("Failed to submit test results");
      }

      console.log("Test submission successful:", response.data);

      // After test submission is successful, track user performance
      if (userId) {
        try {
          console.log("Tracking user performance data...");
          await trackUserPerformance(userId);
        } catch (performanceError) {
          // Don't fail the entire submission if performance tracking fails
          console.error("Error tracking performance:", performanceError);
        }
        
        // Update the streak
        try {
          await axios.post(`https://medical-backend-3eek.onrender.com/api/test/update-streak/${userId}`);
          console.log("Test streak updated successfully");
        } catch (streakError) {
          console.error("Error updating streak:", streakError);
        }
      }

      toast.success("Test Saved Successfully! 🎉");

      // setTimeout(() => {
      //   router.push("/dashboard");
      // }, 4500);
    } catch (err) {
      console.error("Error submitting test results:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // Function to add incorrect questions to flashcards

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-8">
        {isAIGenerated
          ? `AI-Generated Test Results: ${aiTopic}`
          : isRecommendedTest
            ? "Recommended Test Results"
            : "Test Results"}
      </h1>

      {/* Target Exam Info Display */}
      {targetExam && (
        <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
          <h2 className="text-lg font-semibold text-green-800 flex items-center">
            <GraduationCap className="mr-2" size={20} />
            Exam: {formatExamName(targetExam)}
          </h2>
          {examDate && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <Calendar className="mr-1" size={16} />
              Exam Date: {new Date(examDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* AI Generated Test Banner */}
      {isAIGenerated && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center">
            <Brain className="mr-2" size={20} />
            AI-Generated Test: {aiTopic}
          </h2>
          <p className="text-sm text-blue-600">
            This test was custom-generated by AI focusing on key concepts in {aiTopic}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Score Overview</CardTitle>
            <CardDescription>Your performance at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-primary">
                {score}/{questions.length}
              </p>
              <p className="text-xl">{percentage.toFixed(2)}%</p>
            </div>
            <div className="w-48 h-48 mx-auto">
              <Doughnut data={chartData} />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Total time: {Math.floor(totalTime / 60)} minutes {totalTime % 60} seconds
            </p>
          </CardFooter>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
            <CardDescription>How you performed across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Group questions by subject/category and calculate performance */}
              {(() => {
                // Group questions by category using the display field
                const categories: Record<string, { total: number; correct: number }> = {};
                questions.forEach((q, idx) => {
                  const category = q.subjectDisplay || q.subjectName ||
                    (typeof q.subject === 'string' ? q.subject : 'Unknown');

                  if (!categories[category]) {
                    categories[category] = { total: 0, correct: 0 };
                  }
                  categories[category].total++;
                  if (selectedAnswers[idx] === q.answer) {
                    categories[category].correct++;
                  }
                });

                // Return category performance bars
                return Object.entries(categories).map(([category, stats]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{category}</span>
                      <span className="font-medium">
                        {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                      </span>
                    </div>
                    <Progress
                      value={(stats.correct / stats.total) * 100}
                      max={100}
                      className="h-2 bg-amber-100/50"
                    />
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>What would you like to do next?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handleSubmitResults} disabled={loading} className="w-full">
                <CheckCircle className="mr-2" />
                {loading ? "Submitting..." : "Save Results"}
              </Button>
              
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
                <Share2 className="mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Feedback Card */}
      <Card className={`mb-8 border-t-4 ${isAIGenerated ? "border-t-blue-500" : "border-t-purple-500"}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            {isAIGenerated ? (
              <Brain className="mr-2 h-5 w-5 text-blue-500" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
            )}
            <CardTitle>
              {isAIGenerated
                ? `AI Analysis: ${aiTopic} Performance`
                : targetExam
                  ? `AI Feedback on Your ${formatExamName(targetExam)} Performance`
                  : "AI Feedback on Your Performance"}
            </CardTitle>
          </div>
          <CardDescription>
            {isAIGenerated
              ? `Personalized insights on your ${aiTopic} knowledge`
              : "Personalized insights and recommendations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFeedback ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`h-8 w-8 animate-spin ${isAIGenerated ? "text-blue-500" : "text-purple-500"}`} />
              <span className="ml-3 text-gray-600">Generating your personalized feedback...</span>
            </div>
          ) : feedbackError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{feedbackError}</AlertDescription>
            </Alert>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {aiFeedback ? (
                <div dangerouslySetInnerHTML={{ __html: aiFeedback.replace(/\n/g, "<br/>") }} />
              ) : (
                <p>No feedback available at this time.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Switch id="show-incorrect" checked={showIncorrectOnly} onCheckedChange={setShowIncorrectOnly} />
          <Label htmlFor="show-incorrect">Show incorrect answers only</Label>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = selectedAnswers[index] || ""
          const isCorrect = userAnswer === question.answer
          const timeSpent = questionTimes[index] || 0

          if (showIncorrectOnly && isCorrect) return null

          return (
            <Card key={question._id}>
              <CardHeader>
                <CardTitle>Question {index + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add exam type, subject, and difficulty badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.exam_type && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm">
                      {question.exam_type.replace(/_/g, " ")}
                    </span>
                  )}
                  {(question.subjectName || question.subject) && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                      Subject: {question.subjectName ||
                        (typeof question.subject === 'string' ? question.subject : 'Unknown')}
                    </span>
                  )}
                  {(question.subsectionName || question.subsection) && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                      Topic: {question.subsectionName ||
                        (typeof question.subsection === 'string' ? question.subsection : 'Unknown')}
                    </span>
                  )}
                  {question.difficulty && (
                    <span className={`px-3 py-1 rounded-md text-sm ${question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                      }`}>
                      {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {userAnswer || "No answer"}
                      </span>
                    </p>
                    <p className="mb-2">
                      Correct answer: <span className="text-green-600 font-semibold">{question.answer}</span>
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center">
                      <Clock className="mr-2" size={18} />
                      Time spent: {timeSpent} seconds
                    </p>
                    <p className="flex items-center mt-2">
                      {isCorrect ? (
                        <CheckCircle className="mr-2 text-green-500" size={18} />
                      ) : (
                        <AlertCircle className="mr-2 text-red-500" size={18} />
                      )}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </p>
                  </div>
                </div>

                {!isCorrect && question.explanation && (
                  <div className="mt-4 p-4 bg-amber-50 rounded">
                    <h4 className="font-semibold mb-2">Explanation:</h4>
                    <p>{question.explanation}</p>
                  </div>
                )}

{!isAIGenerated && question._id && (
  <div className="mt-4 pt-4 border-t border-slate-200">
    <div className="flex items-center mb-2">
      <BarChart className="h-5 w-5 text-blue-500 mr-2" />
      <h4 className="text-base font-medium text-slate-700">Question Analytics</h4>
    </div>
    
    {loadingAnalytics[question._id] ? (
      <div className="flex justify-center p-2">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Loading analytics...</span>
      </div>
    ) : questionAnalytics[question._id] ? (
      <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-3 mt-2">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-500">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="ml-2">
            <div className="text-xs text-slate-500">Total</div>
            <div className="font-medium text-slate-700">
              {questionAnalytics[question._id].totalAttempts} students attempted
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-500">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="ml-2">
            <div className="text-xs text-slate-500">Correct</div>
            <div className="font-medium text-slate-700">
              {Math.round(questionAnalytics[question._id].totalAttempts * (questionAnalytics[question._id].correctPercentage / 100))} answered correctly
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-amber-500">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="ml-2">
            <div className="text-xs text-slate-500">Response Time</div>
            <div className="font-medium text-slate-700">
              {questionAnalytics[question._id].avgResponseTime.toFixed(1)}s on average
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            questionAnalytics[question._id].correctPercentage >= 70 ? 'bg-emerald-100' : 
            questionAnalytics[question._id].correctPercentage >= 40 ? 'bg-amber-100' : 'bg-red-100'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${
              questionAnalytics[question._id].correctPercentage >= 70 ? 'text-emerald-500' : 
              questionAnalytics[question._id].correctPercentage >= 40 ? 'text-amber-500' : 'text-red-500'
            }`}>
              <line x1="19" y1="5" x2="5" y2="19"></line>
              <circle cx="6.5" cy="6.5" r="2.5"></circle>
              <circle cx="17.5" cy="17.5" r="2.5"></circle>
            </svg>
          </div>
          <div className="ml-2">
            <div className="text-xs text-slate-500">Success Rate</div>
            <div className={`font-medium ${
              questionAnalytics[question._id].correctPercentage >= 70 ? 'text-emerald-600' : 
              questionAnalytics[question._id].correctPercentage >= 40 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {questionAnalytics[question._id].correctPercentage.toFixed(1)}% get it right
            </div>
          </div>
        </div>
      </div>
    ) : (
      <p className="text-sm text-slate-500">No analytics available for this question.</p>
    )}
  </div>
)}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default TestSummary