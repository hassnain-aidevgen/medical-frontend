// app/dashboard/review/session/[sessionId]/page.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import axios from "axios"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  RotateCcw,
  Shuffle,
  Tag,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"
// import ScheduleReviewDialog from "../../schedule-review-dialog"
import ScheduleReviewDialog from "@/app/dashboard/flash-cards/schedule-review-dialog"

export default function ReviewSessionPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  interface Session {
    title: string
    stage: number
  }

  const [session, setSession] = useState<Session | null>(null)
  interface Flashcard {
    _id: string
    question: string
    answer: string
    category?: string
    tags?: string[]
    mastery?: number
    lastReviewed?: string
    hint?: string
  }

  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [skippedCards, setSkippedCards] = useState<string[]>([])
  const [reviewedCards, setReviewedCards] = useState<Record<string, boolean>>({})
  const [isReschedulingSession, setIsReschedulingSession] = useState(false)
  const [reviewFlipping, setReviewFlipping] = useState(false)
  
  // Fetch session data and flashcards
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true)
        const userId = localStorage.getItem("Medical_User_Id")
        const response = await axios.get(
          `https://medical-backend-3eek.onrender.com/api/test/reviews/session/${params.sessionId}?userId=${userId}`
        )
        
        setSession(response.data.session)
        setFlashcards(response.data.flashcards)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching session:", error)
        toast.error("Failed to load review session")
        setLoading(false)
      }
    }
    
    fetchSession()
  }, [params.sessionId])
  
  // Navigation functions
  const nextCard = () => {
    // Record that this card was skipped if answer wasn't revealed
    if (!showAnswer) {
      const cardId = flashcards[currentIndex]._id
      if (!skippedCards.includes(cardId)) {
        setSkippedCards([...skippedCards, cardId])
      }
    }
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    } else {
      // End of cards - prompt to complete session
      if (Object.keys(reviewedCards).length > 0) {
        const shouldComplete = window.confirm("You've reached the end of the cards. Would you like to end this review session?")
        if (shouldComplete) {
          endSession()
        }
      } else {
        toast.error("You haven't reviewed any cards yet!")
      }
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }

  const flipCard = () => {
    // Mark this card as reviewed when flipped
    const cardId = flashcards[currentIndex]._id
    if (!reviewedCards[cardId]) {
      setReviewedCards({
        ...reviewedCards,
        [cardId]: true
      })
    }
    
    // Remove from skipped if it was skipped before
    if (skippedCards.includes(cardId)) {
      setSkippedCards(skippedCards.filter(id => id !== cardId))
    }
    
    setReviewFlipping(true)
    setTimeout(() => {
      setShowAnswer(!showAnswer)
      setReviewFlipping(false)
    }, 150)
  }

  const shuffleCards = () => {
    if (flashcards.length <= 1) {
      toast.error("Not enough cards to shuffle")
      return
    }

    // Create a copy of the flashcards array and shuffle it
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentIndex(0)
    setShowAnswer(false)
    toast.success("Cards shuffled")
  }

  const endSession = async () => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      
      // Count reviewed cards
      const reviewedCount = Object.keys(reviewedCards).length
      
      // If no cards were reviewed, don't end the session
      if (reviewedCount === 0) {
        toast.error("You haven't reviewed any cards yet!")
        return
      }
      
      // Calculate correct percentage (in this case, all reviewed cards count as correct)
      const performance = {
        correctAnswers: reviewedCount,
        totalQuestions: flashcards.length,
        reviewedCards: Object.keys(reviewedCards),
        skippedCards
      }
      
      // Check if all cards were reviewed or not
      const allReviewed = reviewedCount === flashcards.length
      
      await axios.post(
        `https://medical-backend-3eek.onrender.com/api/test/session/${params.sessionId}/end`,
        {
          userId,
          performance,
          completed: allReviewed, // Only mark as completed if all cards were reviewed
          partial: !allReviewed // Mark if this was a partial review
        }
      )
      
      setSessionCompleted(true)
      
      if (allReviewed) {
        toast.success("Review session completed!")
      } else {
        toast.success("Review session ended. Incomplete cards will be available in your next review.")
      }
    } catch (error) {
      console.error("Error ending session:", error)
      toast.error("Failed to end session")
    }
  }

  const handleRescheduleSession = () => {
    setIsReschedulingSession(true)
  }

  const closeRescheduleDialog = () => {
    setIsReschedulingSession(false)
  }

  const rescheduleSession = async (scheduledFor: string | number | Date) => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      
      // Update the session schedule
      await axios.post(
        `https://medical-backend-3eek.onrender.com/api/test/session/${params.sessionId}/reschedule`,
        {
          userId,
          scheduledFor
        }
      )
      
      toast.success(`Session rescheduled for ${new Date(scheduledFor).toLocaleDateString()}`)
      
      // Redirect to dashboard
      // await fetchDashboardData()
      router.push('/dashboard/review')
    } catch (error) {
      console.error("Error rescheduling session:", error)
      toast.error("Failed to reschedule session")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (sessionCompleted) {
    const allReviewed = Object.keys(reviewedCards).length === flashcards.length
    
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">
              {allReviewed ? "Session Completed!" : "Session Ended"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allReviewed ? (
              <p>You&apos;ve completed this review session.</p>
            ) : (
              <p>You&apos;ve ended this review session. Incomplete cards will be available in your next review.</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Your next review will be scheduled according to the Ebbinghaus curve.
            </p>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium text-green-700">Session Summary</p>
              </div>
              <p className="mt-2 text-sm">
                You reviewed {Object.keys(reviewedCards).length} of {flashcards.length} cards.
              </p>
              {skippedCards.length > 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  {skippedCards.length} cards were skipped and will be included in your next review.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/review')}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!session || flashcards.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>No Flashcards Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There are no flashcards in this review session.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/review')}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Current flashcard
  const currentCard = flashcards[currentIndex]

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Stage {session.stage} • Card {currentIndex + 1} of {flashcards.length}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRescheduleSession}
            className="flex items-center gap-2 text-blue-500"
          >
            <Calendar className="h-4 w-4" />
            Reschedule
          </Button>
        </div>
      </div>

      <Progress value={(currentIndex / flashcards.length) * 100} className="mb-6" />

      <div className="relative">
        <div className="flex justify-between mb-4">
          <Button variant="outline" size="sm" onClick={endSession} className="text-green-600">
            <BookOpen className="h-4 w-4 mr-2" />
            End Session
          </Button>
          <Button variant="outline" size="sm" onClick={shuffleCards} className="text-amber-600">
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-auto
                ${reviewFlipping ? "scale-95 opacity-50" : ""}
                ${showAnswer ? "bg-amber-50 dark:bg-amber-950" : "bg-white dark:bg-slate-800"}`}
            >
              <CardHeader className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant="outline"
                      className="text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950"
                    >
                      {currentCard.category}
                    </Badge>
                    {session.title.includes("Test Review") && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">
                        Test Review
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Card {currentIndex + 1}/{flashcards.length}
                    </span>
                    {currentCard.mastery !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          Mastery: {currentCard.mastery}%
                        </span>
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${currentCard.mastery}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                      <div className="text-center md:text-left md:flex md:items-center md:gap-4">
                        <div className="md:flex-1">
                          <Badge className="mb-4 bg-green-500">Answer</Badge>
                          <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            {currentCard.answer}
                          </p>
                          
                          {currentCard.hint && (
                            <div className="mt-6 pt-4 border-t border-dashed border-amber-200 w-full">
                              <h4 className="font-medium mb-2 text-left">Explanation:</h4>
                              <p className="text-left">{currentCard.hint}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Badge className="mb-4 bg-amber-500">Question</Badge>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                          {currentCard.question}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>

              <CardFooter className="p-0 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentCard.tags && currentCard.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {currentCard.lastReviewed && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Last reviewed:{" "}
                      {new Date(currentCard.lastReviewed).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                
                {/* Only show the Reveal Answer button */}
                {!showAnswer ? (
                  <Button onClick={flipCard} className="bg-amber-500 hover:bg-amber-600 text-white w-full">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Reveal Answer
                  </Button>
                ) : (
                  <div className="grid grid-cols-1 gap-2 w-full">
                    <Button onClick={() => {
                      setShowAnswer(false)
                      nextCard()
                    }} className="bg-green-500 hover:bg-green-600 text-white w-full">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Next Card
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-4">
          <Button
            variant="ghost"
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Previous
          </Button>
          <Button
            variant="ghost"
            onClick={nextCard}
            className="text-slate-600 dark:text-slate-400"
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Reschedule Session Dialog */}
      <ScheduleReviewDialog
        isOpen={isReschedulingSession}
        onClose={closeRescheduleDialog}
        userId={localStorage.getItem("Medical_User_Id") || ""}
        cardCategory={session?.title || "Review Session"}
        cardQuestion={`Review Session: ${session?.title}`}
        cardDifficulty="medium"
         onSchedule={rescheduleSession} 
      />

      <Toaster position="top-right" />
    </div>
  )
}