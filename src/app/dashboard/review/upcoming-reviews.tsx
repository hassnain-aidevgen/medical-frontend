"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Tag } from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "react-hot-toast"

interface Review {
  isTestReview: any
  _id: string
  title: string
  type: "daily" | "other"
  scheduledFor: string
  stage: number
}

export function UpcomingReviews({ reviews = [] }: { reviews: Review[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedReviews, setCompletedReviews] = useState<string[]>([])

  // Load completed reviews from localStorage on component mount
  useEffect(() => {
    try {
      const savedReviews = localStorage.getItem("Medical_Completed_Reviews")
      if (savedReviews) {
        setCompletedReviews(JSON.parse(savedReviews))
      }
    } catch (error) {
      console.error("Error loading completed reviews from localStorage:", error)
    }
  }, [])

  // Update localStorage whenever completedReviews changes
  useEffect(() => {
    try {
      if (completedReviews.length > 0) {
        localStorage.setItem("Medical_Completed_Reviews", JSON.stringify(completedReviews))
      }
    } catch (error) {
      console.error("Error saving completed reviews to localStorage:", error)
    }
  }, [completedReviews])

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No upcoming reviews</h3>
        <p className="text-sm text-muted-foreground mt-2">You don&apos;t have any scheduled review sessions yet.</p>
      </div>
    )
  }

  // Filter out completed reviews
  const activeReviews = reviews.filter((review) => !completedReviews.includes(review._id))

  if (activeReviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium">All reviews completed!</h3>
        <p className="text-sm text-muted-foreground mt-2">You&apos;ve completed all your scheduled reviews.</p>
      </div>
    )
  }

  const nextReview = () => {
    if (activeReviews.length === 0) return
    setCurrentIndex((currentIndex + 1) % activeReviews.length)
    setShowAnswer(false)
  }

  const prevReview = () => {
    if (activeReviews.length === 0) return
    setCurrentIndex((currentIndex - 1 + activeReviews.length) % activeReviews.length)
    setShowAnswer(false)
  }

  const flipCard = () => {
    setFlipping(true)
    setTimeout(() => {
      setShowAnswer((prev) => !prev)
      setFlipping(false)
    }, 150)
  }

  const markAsCompleted = async (reviewId: string) => {
    try {
      setIsSubmitting(true)
      const userId = localStorage.getItem("Medical_User_Id")

      // Call the API with the exact route structure
      const response = await fetch(
        `https://medical-backend-loj4.onrender.com/api/reviews/${reviewId}/complete?userId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            performance: {
              correctAnswers: 10, // Default values for performance
              totalQuestions: 10,
              timeSpent: 300, // 5 minutes in seconds
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Mark as completed locally for immediate UI update
      const updatedCompletedReviews = [...completedReviews, reviewId]
      setCompletedReviews(updatedCompletedReviews)

      // Also directly update localStorage as a backup
      try {
        localStorage.setItem("Medical_Completed_Reviews", JSON.stringify(updatedCompletedReviews))
      } catch (error) {
        console.error("Error saving to localStorage:", error)
      }

      // Adjust current index if needed
      if (currentIndex >= activeReviews.length - 1) {
        setCurrentIndex(Math.max(0, activeReviews.length - 2))
      }

      // Reset to question side
      setShowAnswer(false)

      // Show success message
      toast.success("Review marked as completed")
    } catch (error) {
      console.error("Error marking review as completed:", error)
      toast.error("Failed to mark review as completed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-end mb-4">
        <Badge variant="outline" className="text-amber-500">
          {activeReviews.length} Scheduled Reviews
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${showAnswer ? "answer" : "question"}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-hidden
              ${flipping ? "scale-95 opacity-50" : ""}
              ${showAnswer ? "bg-amber-50 dark:bg-amber-950" : "bg-white dark:bg-slate-800"}`}
          >
            <CardHeader className="p-0">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950">
                    {activeReviews[currentIndex].type === "daily" ? "Daily Review" : "Scheduled Review"}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">
                    Stage {activeReviews[currentIndex].stage}
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Review {currentIndex + 1}/{activeReviews.length}
                  </span>
                </div>
              </div>
              {activeReviews[currentIndex].isTestReview && (
                <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200 mt-2">
                  Test Mistake Review
                </Badge>
              )}
            </CardHeader>

            <CardContent className="flex-grow flex items-center justify-center p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={showAnswer ? "answer" : "question"}
                  initial={{ opacity: 0, rotateY: 180 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -180 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  {showAnswer ? (
                    <div className="text-center">
                      <Badge className="mb-4 bg-green-500">Details</Badge>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-6">
                        Review Details
                      </p>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 inline-block shadow-sm w-full">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-amber-500 h-5 w-5" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {format(new Date(activeReviews[currentIndex].scheduledFor), "PPPP")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="text-amber-500 h-5 w-5" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {format(new Date(activeReviews[currentIndex].scheduledFor), "p")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Badge className="mb-4 bg-amber-500">Scheduled Review</Badge>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                        {activeReviews[currentIndex].title}
                      </p>
                      <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 inline-block">
                        <Clock className="text-amber-500 inline mr-2 h-5 w-5" />
                        <span className="text-slate-700 dark:text-slate-300 italic">
                          Scheduled for {format(new Date(activeReviews[currentIndex].scheduledFor), "PPP")}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <CardFooter className="p-0 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3 mr-1" />
                  {activeReviews[currentIndex].type}
                </Badge>
              </div>

              {showAnswer ? (
                <Button
                  onClick={() => markAsCompleted(activeReviews[currentIndex]._id)}
                  className="bg-green-500 hover:bg-green-600 text-white w-full"
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Processing..." : "Mark as Done"}
                </Button>
              ) : (
                <Button onClick={flipCard} className="bg-amber-500 hover:bg-amber-600 text-white w-full">
                  <Calendar className="mr-2 h-5 w-5" />
                  View Schedule
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-4">
        <Button
          variant="ghost"
          onClick={prevReview}
          disabled={activeReviews.length <= 1}
          className="text-slate-600 dark:text-slate-400"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Previous
        </Button>
        <Button
          variant="ghost"
          onClick={nextReview}
          disabled={activeReviews.length <= 1}
          className="text-slate-600 dark:text-slate-400"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}