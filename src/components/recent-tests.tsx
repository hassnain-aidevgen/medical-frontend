"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, ChevronRight } from "lucide-react"

// Types
interface TestQuestion {
  questionId: string
  questionText: string
  userAnswer: string
  correctAnswer: string
  timeSpent: number
}

interface TestResult {
  userId: string
  questions: TestQuestion[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
}

interface RecentTestsProps {
  performanceData: TestResult[]
  isLoading?: boolean
  className?: string
}

// Helper functions
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function RecentTests({ performanceData, isLoading = false, className = "" }: RecentTestsProps) {
  const [viewAllTests, setViewAllTests] = useState(false)
  const [viewAllQuestions, setViewAllQuestions] = useState(false)
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(null)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle>Recent Tests</CardTitle>
          <CardDescription>Loading your test results...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading test data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Tests</CardTitle>
            <CardDescription>Your most recent test results</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewAllTests(!viewAllTests)}>
            {viewAllTests ? "Show Less" : "View All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {performanceData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tests taken yet. Start taking tests to see your results here!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="single" collapsible className="w-full">
              {(viewAllTests ? performanceData : performanceData.slice(0, 5)).map((test, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b">
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Test {performanceData.length - index}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(test.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{test.percentage}%</p>
                          <p className="text-sm text-muted-foreground">
                            Score: {test.score}/{test.questions.length}
                          </p>
                        </div>
                        <div
                          className={`w-2 h-10 rounded-full ${test.percentage >= 70 ? "bg-green-500" : test.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        ></div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 bg-muted/30 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-background p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">Total Time</p>
                          <p className="font-medium">{formatTime(test.totalTime)}</p>
                        </div>
                        <div className="bg-background p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">Avg. Time per Question</p>
                          <p className="font-medium">{formatTime(test.totalTime / test.questions.length)}</p>
                        </div>
                        <div className="bg-background p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">Date Taken</p>
                          <p className="font-medium">{formatDate(test.createdAt)}</p>
                        </div>
                      </div>

                      <h3 className="font-semibold mt-4 mb-2">Questions:</h3>
                      <div className="space-y-3">
                        {(viewAllQuestions && selectedTestIndex === index
                          ? test.questions
                          : test.questions.slice(0, 3)
                        ).map((q, qIndex) => (
                          <div key={qIndex} className="border-b pb-3">
                            <p className="font-medium">
                              Q{qIndex + 1}: {q.questionText}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div
                                className={`p-2 rounded-md ${q.userAnswer === q.correctAnswer ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}
                              >
                                <p className="text-sm text-muted-foreground">Your Answer</p>
                                <p
                                  className={`font-medium ${q.userAnswer === q.correctAnswer ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                                >
                                  {q.userAnswer}
                                </p>
                              </div>
                              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                                <p className="text-sm text-muted-foreground">Correct Answer</p>
                                <p className="font-medium text-blue-700 dark:text-blue-400">{q.correctAnswer}</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">Time Spent: {formatTime(q.timeSpent)}</p>
                          </div>
                        ))}
                        {test.questions.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setSelectedTestIndex(index)
                              setViewAllQuestions(!viewAllQuestions)
                            }}
                          >
                            {viewAllQuestions && selectedTestIndex === index
                              ? "Show Less"
                              : `View all ${test.questions.length} questions`}{" "}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

