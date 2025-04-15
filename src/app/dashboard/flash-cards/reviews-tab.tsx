"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  RotateCcw,
  Shuffle,
  Tag,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import toast from "react-hot-toast"
import type { Flashcard } from "@/services/api-service"

interface ReviewsTabProps {
  reviewCards: Flashcard[]
  currentReviewCard: number
  isReviewLoading: boolean
  reviewError: string | null
  setCurrentReviewCard: (index: number) => void
  setActiveTab: (tab: string) => void
  fetchReviewCards: () => Promise<void>
  markCardAsKnown: (card: Flashcard) => Promise<boolean>
  markCardForReview: (card: Flashcard) => Promise<boolean>
}

export default function ReviewsTab({
  reviewCards,
  currentReviewCard,
  isReviewLoading,
  reviewError,
  setCurrentReviewCard,
  setActiveTab,
  fetchReviewCards,
  markCardAsKnown,
  markCardForReview,
}: ReviewsTabProps) {
  const [showReviewAnswer, setShowReviewAnswer] = useState(false)
  const [reviewFlipping, setReviewFlipping] = useState(false)

  // Navigation functions
  const nextReviewCard = () => {
    if (reviewCards.length === 0) return
    setCurrentReviewCard((currentReviewCard + 1) % reviewCards.length)
    setShowReviewAnswer(false)
  }
  
  const prevReviewCard = () => {
    if (reviewCards.length === 0) return
    setCurrentReviewCard((currentReviewCard - 1 + reviewCards.length) % reviewCards.length)
    setShowReviewAnswer(false)
  }

  const flipReviewCard = () => {
    setReviewFlipping(true)
    setTimeout(() => {
      setShowReviewAnswer((prev) => !prev)
      setReviewFlipping(false)
    }, 150)
  }

  const shuffleReviewCards = () => {
    if (reviewCards.length <= 1) {
      toast.error("Not enough cards to shuffle")
      return
    }

    const shuffled = [...reviewCards].sort(() => Math.random() - 0.5)
    setCurrentReviewCard(0)
    setShowReviewAnswer(false)
    toast.success("Review cards shuffled")
  }

  const markReviewCardAsKnown = async () => {
    if (reviewCards.length === 0) return

    const card = reviewCards[currentReviewCard]
    const success = await markCardAsKnown(card)

    if (success) {
      // If this was the last review card, show a message
      if (reviewCards.length <= 1) {
        toast.success("All cards reviewed! Great job!")
      } else {
        nextReviewCard()
        toast.success("Card mastered and removed from review")
      }
    }
  }

  const keepReviewCardForLater = async () => {
    if (reviewCards.length === 0) return

    const card = reviewCards[currentReviewCard]
    const success = await markCardForReview(card)

    if (success) {
      nextReviewCard()
      toast("Card kept for later review", { icon: "📝" })
    }
  }

  return (
    <>
      {/* Reviews Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Cards for Review</h2>
          <Badge variant="outline" className="text-amber-500">
            {reviewCards.length} Cards
          </Badge>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          These cards have been marked for review. Master them to improve your overall progress.
        </p>
      </div>

      {isReviewLoading ? (
        <div className="flex justify-center items-center h-[28rem]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : reviewError ? (
        <Card className="h-[28rem] flex items-center justify-center">
          <CardContent className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Error Loading Review Cards</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{reviewError}</p>
            <Button onClick={() => fetchReviewCards()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : reviewCards.length === 0 ? (
        <Card className="h-[28rem] flex items-center justify-center">
          <CardContent className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Cards to Review</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Great job! You have no cards marked for review at the moment.
            </p>
            <Button onClick={() => setActiveTab("study")}>Continue Studying</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={shuffleReviewCards} className="text-amber-600">
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentReviewCard}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-hidden
                  ${reviewFlipping ? "scale-95 opacity-50" : ""}
                  ${showReviewAnswer ? "bg-amber-50 dark:bg-amber-950" : "bg-white dark:bg-slate-800"}`}
              >
                <CardHeader className="p-0">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col gap-2">
                      <Badge
                        variant="outline"
                        className="text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950"
                      >
                        {reviewCards[currentReviewCard]?.category}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-500 border-red-200">
                        Needs Review
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Card {currentReviewCard + 1}/{reviewCards.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          Mastery: {reviewCards[currentReviewCard]?.mastery}%
                        </span>
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${reviewCards[currentReviewCard]?.mastery}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow flex items-center justify-center p-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showReviewAnswer ? "answer" : "question"}
                      initial={{ opacity: 0, rotateY: 180 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -180 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full flex flex-col items-center justify-center"
                    >
                      {showReviewAnswer ? (
                        <div className="text-center">
                          <Badge className="mb-4 bg-green-500">Answer</Badge>
                          <p className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                            {reviewCards[currentReviewCard]?.answer}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Badge className="mb-4 bg-amber-500">Question</Badge>
                          <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                            {reviewCards[currentReviewCard]?.question}
                          </p>
                          {reviewCards[currentReviewCard]?.hint && (
                            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 inline-block">
                              <Lightbulb className="text-amber-500 inline mr-2 h-5 w-5" />
                              <span className="text-slate-700 dark:text-slate-300 italic">
                                {reviewCards[currentReviewCard]?.hint}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>

                <CardFooter className="p-0 flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {reviewCards[currentReviewCard]?.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Last reviewed:{" "}
                      {reviewCards[currentReviewCard]?.lastReviewed
                        ? new Date(reviewCards[currentReviewCard].lastReviewed).toLocaleDateString()
                        : "Never"}
                    </Badge>
                  </div>
                  {showReviewAnswer ? (
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <Button
                        variant="outline"
                        onClick={keepReviewCardForLater}
                        className="border-amber-200 text-amber-600 hover:bg-amber-50"
                      >
                        <Clock className="h-5 w-5 mr-2" />
                        Review Later
                      </Button>
                      <Button onClick={markReviewCardAsKnown} className="bg-green-500 hover:bg-green-600 text-white">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Now I Know It
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={flipReviewCard} className="bg-amber-500 hover:bg-amber-600 text-white w-full">
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Reveal Answer
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-between mt-4">
            <Button
              variant="ghost"
              onClick={prevReviewCard}
              disabled={reviewCards.length <= 1}
              className="text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={nextReviewCard}
              disabled={reviewCards.length <= 1}
              className="text-slate-600 dark:text-slate-400"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
