"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { Flashcard } from "@/services/api-service"
import axios from "axios"
import { addMonths, isBefore } from "date-fns"
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
import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import RatingDialog from "./rating-dialog"
import ScheduleReviewDialog from "./schedule-review-dialog"

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
  handleShuffleReviewCards?: (shuffledCards: Flashcard[]) => void
  totalReviewCards: number
  reviewedCardIds: Set<string>
  userId: string
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
  handleShuffleReviewCards,
  totalReviewCards,
  reviewedCardIds,
  userId,
}: ReviewsTabProps) {
  const [showReviewAnswer, setShowReviewAnswer] = useState(false)
  const [reviewFlipping, setReviewFlipping] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [sessionDuration, setSessionDuration] = useState<number>(0)
  const [cardsReviewedCount, setCardsReviewedCount] = useState(0)
  const [isCheckingLastRating, setIsCheckingLastRating] = useState(false)

  // Use refs for values that shouldn't trigger re-renders
  const sessionStartTimeRef = useRef<Date | null>(null)
  const hasShownRatingDialogRef = useRef<boolean>(false)
  const previousReviewedCountRef = useRef<number>(0)
  const lastRatingDateRef = useRef<Date | null>(null)

  // Check if a month has passed since the last rating
  const shouldShowRatingDialog = useCallback(async () => {
    if (!userId) return false

    try {
      setIsCheckingLastRating(true)
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/ratings/last-rating/${userId}`)

      if (response.data.lastRatingDate) {
        // Parse the date and add one month
        const lastRatingDate = new Date(response.data.lastRatingDate)
        const nextEligibleDate = addMonths(lastRatingDate, 1)

        // Store the last rating date in the ref
        lastRatingDateRef.current = lastRatingDate

        // Only show dialog if a month has passed
        return isBefore(nextEligibleDate, new Date())
      } else {
        // No previous rating, so we should show the dialog
        return true
      }
    } catch (error) {
      console.error("Error checking last rating date:", error)
      // If there's an error, default to not showing the dialog
      return false
    } finally {
      setIsCheckingLastRating(false)
    }
  }, [userId])

  // Start session timer when component mounts or when cards are loaded
  useEffect(() => {
    if (reviewCards.length > 0 && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date()
      hasShownRatingDialogRef.current = false
    }
  }, [reviewCards.length])

  // Reset refs when component unmounts
  useEffect(() => {
    return () => {
      sessionStartTimeRef.current = null
      hasShownRatingDialogRef.current = false
    }
  }, [])

  // Check if all cards have been reviewed - using a separate effect with minimal dependencies
  useEffect(() => {
    // Only check if we have cards to review and haven't shown the dialog yet
    if (
      totalReviewCards > 0 &&
      reviewedCardIds.size > 0 &&
      reviewedCardIds.size >= totalReviewCards &&
      !hasShownRatingDialogRef.current &&
      !isRatingDialogOpen &&
      !isCheckingLastRating
    ) {
      // Calculate session duration
      if (sessionStartTimeRef.current) {
        const duration = Math.floor((new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000)
        setSessionDuration(duration)
      }

      setCardsReviewedCount(reviewedCardIds.size)

      // Check if we should show the rating dialog (based on last rating date)
      const checkAndShowRatingDialog = async () => {
        const shouldShow = await shouldShowRatingDialog()

        if (shouldShow) {
          hasShownRatingDialogRef.current = true
          // Use setTimeout to break the render cycle
          setTimeout(() => {
            setIsRatingDialogOpen(true)
          }, 100)
        } else {
          // If we're not showing the dialog, still mark as shown to prevent rechecking
          hasShownRatingDialogRef.current = true
          console.log("Rating dialog skipped - less than a month since last rating")
        }
      }

      checkAndShowRatingDialog()
    }

    // Track the previous count to detect changes
    previousReviewedCountRef.current = reviewedCardIds.size
  }, [reviewedCardIds.size, totalReviewCards, isRatingDialogOpen, isCheckingLastRating, shouldShowRatingDialog])

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

    // Create a copy of the review cards array
    const shuffled = [...reviewCards].sort(() => Math.random() - 0.5)

    // If the parent component provided a handler, use it
    if (handleShuffleReviewCards) {
      handleShuffleReviewCards(shuffled)
    } else {
      // Otherwise just reset the current card index
      setCurrentReviewCard(0)
    }

    setShowReviewAnswer(false)
    toast.success("Review cards shuffled")
  }

  const markReviewCardAsKnown = async () => {
    if (reviewCards.length === 0) return;
  
    const card = reviewCards[currentReviewCard];
    
    try {
      // Call the existing markCardAsKnown function passed as prop
      const success = await markCardAsKnown(card);
    
      if (success) {
        // Reset the flip state for next card
        setShowReviewAnswer(false); 
        
        // Update the localStorage review later count
        const currentCount = parseInt(localStorage.getItem("review_later_count") || "0", 10);
        if (!isNaN(currentCount) && currentCount > 0) {
          // Make API call to check if card was marked for review and update the database
          try {
            const response = await axios.post("http://localhost:5000/api/reviews/remove-from-review-later", {
              userId,
              cardId: card._id
            });
            
            if (response.data.success && response.data.wasMarkedForReview) {
              // If the card was marked for review, update the count
              const newCount = Math.max(0, currentCount - 1);
              localStorage.setItem("review_later_count", newCount.toString());
              
              // Trigger update to notify other components
              const triggerValue = localStorage.getItem("review_later_update_trigger") || "0";
              const newTriggerValue = (parseInt(triggerValue, 10) + 1).toString();
              localStorage.setItem("review_later_update_trigger", newTriggerValue);
            }
          } catch (error) {
            console.error("Error updating review-later status:", error);
          }
        }
  
        // Continue with existing logic
        if (reviewCards.length <= 1) {
          toast.success("All cards reviewed! Great job!");
        } else {
          const isLastCard = currentReviewCard === reviewCards.length - 1;
    
          if (isLastCard) {
            setCurrentReviewCard(currentReviewCard - 1);
          } else {
            setCurrentReviewCard(currentReviewCard);
          }
    
          toast.success("Card mastered and removed from review");
        }
      }
    } catch (error) {
      console.error("Error marking card as known:", error);
      toast.error("Failed to mark card as known");
    }
  };
  
  const openScheduleDialog = () => {
    setIsScheduleDialogOpen(true)
  }

  const closeScheduleDialog = () => {
    setIsScheduleDialogOpen(false)
  }

  const closeRatingDialog = () => {
    setIsRatingDialogOpen(false)
    // Reset session tracking after rating is complete
    sessionStartTimeRef.current = null
    if (reviewCards.length > 0) {
      sessionStartTimeRef.current = new Date()
    }
  }

  // Replace the existing keepReviewCardForLater function
const keepReviewCardForLater = async () => {
  if (reviewCards.length === 0) return;

  const card = reviewCards[currentReviewCard];
  
  try {
    // Make a direct API call to mark the card for review
    const response = await axios.post(
      "http://localhost:5000/api/reviews/add-to-review-later",
      {
        userId,
        cardId: card._id
      }
    );
    
    if (response.data.success) {
      // Store the updated count in localStorage
      localStorage.setItem("review_later_count", response.data.reviewLaterCount.toString());
      
      // Try to trigger a storage event to notify other components
      const originalValue = localStorage.getItem("review_later_update_trigger") || "0";
      const newValue = (parseInt(originalValue, 10) + 1).toString();
      localStorage.setItem("review_later_update_trigger", newValue);
      
      // Continue with the existing logic
      nextReviewCard();
      toast("Card kept for later review", { icon: "📝" });
      
      // Still call the prop function if it exists (for compatibility)
      if (typeof markCardForReview === 'function') {
        markCardForReview(card).catch(err => 
          console.error("Error in original markCardForReview:", err)
        );
      }
      
      return true;
    } else {
      toast.error("Failed to mark card for review");
      return false;
    }
  } catch (error) {
    console.error("Error marking card for review:", error);
    toast.error("Failed to mark card for review");
    return false;
  }
};

  // Calculate review progress percentage
  const calculateReviewProgress = () => {
    if (totalReviewCards === 0) return 0
    return Math.round((reviewedCardIds.size / totalReviewCards) * 100)
  }

  // Get current card
  const currentCard = reviewCards.length > 0 ? reviewCards[currentReviewCard] : null

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

      {!isReviewLoading && !reviewError && totalReviewCards > 0 && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Review Progress</h3>
          <div className="flex items-center gap-4">
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${calculateReviewProgress()}%`,
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {calculateReviewProgress()}% Reviewed
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {reviewedCardIds.size} of {totalReviewCards} cards have been reviewed
          </p>
        </div>
      )}

      {isReviewLoading || isCheckingLastRating ? (
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
              id={`flashcard-${reviewCards[currentReviewCard]?.question}`} // 👈 add this line
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
                    {reviewCards[currentReviewCard]?.tags?.map((tag) => (
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
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <Button
                        variant="outline"
                        onClick={openScheduleDialog}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                      <Button
                        variant="outline"
                        onClick={keepReviewCardForLater}
                        className="border-amber-200 text-amber-600 hover:bg-amber-50"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Review Later
                      </Button>
                      <Button onClick={markReviewCardAsKnown} className="bg-green-500 hover:bg-green-600 text-white">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Got It
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

      {/* Schedule Review Dialog */}
      {currentCard && (
        <ScheduleReviewDialog
          isOpen={isScheduleDialogOpen}
          onClose={closeScheduleDialog}
          userId={userId}
          cardCategory={currentCard.category || "Uncategorized"}
          cardQuestion={currentCard.question}
          cardDifficulty={currentCard.difficulty || "medium"}
        />
      )}

      {/* Rating Dialog */}
      <RatingDialog
        isOpen={isRatingDialogOpen}
        onClose={closeRatingDialog}
        userId={userId}
        cardsReviewed={cardsReviewedCount}
        sessionDuration={sessionDuration}
      />
    </>
  )
}
