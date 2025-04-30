"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

import apiService, { type Flashcard } from "@/services/api-service"
import ReviewsTab from "../flash-cards/reviews-tab"

export default function FlashcardsPage() {
  // State for flashcards and filtering
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([])
  const [totalReviewCards, setTotalReviewCards] = useState<number>(0)
  const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(new Set())
  const [currentReviewCard, setCurrentReviewCard] = useState(0)

  // UI state
  const [isReviewLoading, setIsReviewLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [debugMode, setDebugMode] = useState(false)

  // Initialize user ID from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("Medical_User_Id")
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      // Handle case where user ID is not available
      toast.error("User ID not found. Please log in again.")
      // You could redirect to login page here
    }
  }, [])

  // Fetch cards that need review (mastery < 30%)
  const fetchReviewCards = useCallback(async () => {
    if (!userId) return

    setIsReviewLoading(true)
    setReviewError(null)

    try {
      // Get all flashcards for the user
      const response = await apiService.getFlashcards({ userId })

      // Filter cards with low mastery (marked for review)
      const cardsForReview = response.data.filter((card: Flashcard) => card.mastery < 30 || card.reviewCount === 0)

      // Store the total number of cards that need review
      setTotalReviewCards(cardsForReview.length)

      // Reset the reviewed cards set when fetching new review cards
      setReviewedCardIds(new Set())

      setReviewCards(cardsForReview)
      setCurrentReviewCard(0)
      
      // Also set the full flashcards array for reference
      setFlashcards(response.data)
    } catch (error) {
      console.error("Error fetching review cards:", error)

      if (error && typeof error === "object" && "message" in error) {
        setReviewError((error as Error).message || "Failed to load review cards")
      } else {
        setReviewError("Failed to load review cards. Please try again later.")
      }

      setReviewCards([])
      setTotalReviewCards(0)
    } finally {
      setIsReviewLoading(false)
    }
  }, [userId])

  // Add this function to handle shuffled cards
  const handleShuffleReviewCards = (shuffledCards: Flashcard[]) => {
    setReviewCards(shuffledCards)
    setCurrentReviewCard(0)
  }

  // Initial data load
  useEffect(() => {
    if (userId) {
      fetchReviewCards()
    }
  }, [fetchReviewCards, userId])

  // Scroll to specific flashcard if coming from performance tracking
  useEffect(() => {
    const reviewId = localStorage.getItem("flashcardReviewId")
    if (reviewId) {
      // Wait for cards to render (just in case)
      setTimeout(() => {
        const el = document.getElementById(`flashcard-${reviewId}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        localStorage.removeItem("flashcardReviewId")
      }, 300)
    }
  }, [])

  // Study progress tracking
  const markCardAsKnown = async (card: Flashcard) => {
    try {
      // Calculate new mastery level (increase by 10-20% based on current level)
      const masteryIncrease = card.mastery < 50 ? 20 : 10
      const newMastery = Math.min(100, card.mastery + masteryIncrease)

      const updatedCard = {
        ...card,
        mastery: newMastery,
        reviewCount: card.reviewCount + 1,
        lastReviewed: new Date(),
      }

      if (!card.id) {
        throw new Error("Card ID is missing")
      }

      const response = await apiService.updateFlashcard(card.id, updatedCard)

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      // Add this card ID to the set of reviewed cards
      if (card.id) {
        setReviewedCardIds((prev) => {
          const newSet = new Set(prev)
          newSet.add(card.id!)
          return newSet
        })
      }

      // Remove from review cards if mastery is now above threshold
      if (newMastery >= 30) {
        setReviewCards((prevCards) => prevCards.filter((c) => c.id !== response.data.id))
      } else {
        setReviewCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      }

      toast.success("Card marked as known")
      return true
    } catch (error) {
      apiService.handleApiError(error, "Failed to update card progress")
      return false
    }
  }

  const markCardForReview = async (card: Flashcard) => {
    try {
      // Set mastery to a low value to mark for review (below 30%)
      const newMastery = Math.min(25, card.mastery)

      const updatedCard = {
        ...card,
        mastery: newMastery,
        reviewCount: card.reviewCount + 1,
        lastReviewed: new Date(),
      }

      if (!card.id) {
        throw new Error("Card ID is missing")
      }

      const response = await apiService.updateFlashcard(card.id, updatedCard)

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      // Add this card ID to the set of reviewed cards
      if (card.id) {
        setReviewedCardIds((prev) => {
          const newSet = new Set(prev)
          newSet.add(card.id!)
          return newSet
        })
      }

      // Add to review cards if not already there
      if (!reviewCards.some((c) => c.id === response.data.id)) {
        setReviewCards((prevCards) => [...prevCards, response.data])
      } else {
        setReviewCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      }

      toast("Card marked for review", { icon: "📝" })
      return true
    } catch (error) {
      apiService.handleApiError(error, "Failed to update card progress")
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mt-4">
          <ReviewsTab
            reviewCards={reviewCards}
            currentReviewCard={currentReviewCard}
            isReviewLoading={isReviewLoading}
            reviewError={reviewError}
            setCurrentReviewCard={setCurrentReviewCard}
            setActiveTab={() => {}} // Empty function as we removed tabs
            fetchReviewCards={fetchReviewCards}
            markCardAsKnown={markCardAsKnown}
            markCardForReview={markCardForReview}
            handleShuffleReviewCards={handleShuffleReviewCards}
            totalReviewCards={totalReviewCards}
            reviewedCardIds={reviewedCardIds}
            userId={userId}
          />
        </div>
      </main>

      <Toaster position="top-right" />
      {debugMode && (
        <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg max-w-md max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Info</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white" onClick={() => setDebugMode(false)}>
              X
            </Button>
          </div>
          <div className="text-xs">
            <p>User ID: {userId || "Not set"}</p>
            <p>Cards: {flashcards.length}</p>
            <p>Review: {reviewCards.length}</p>
            <p>Total Review: {totalReviewCards}</p>
            <p>Reviewed IDs: {reviewedCardIds.size}</p>
            <p>Error: {reviewError || "None"}</p>
            <details>
              <summary>First Card Data</summary>
              <pre>{JSON.stringify(flashcards[0] || {}, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}