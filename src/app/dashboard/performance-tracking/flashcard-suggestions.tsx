"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import StudyTab from "../flash-cards/study-tab"
import ReviewsTab from "../flash-cards/reviews-tab"
import apiService, { type Flashcard } from "@/services/api-service"

export default function FlashcardSuggestions() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([])
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [currentReviewCard, setCurrentReviewCard] = useState(0)

  // Filters state
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // UI state
  const [activeTab, setActiveTab] = useState("study")
  const [studyProgress, setStudyProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isReviewLoading, setIsReviewLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")

  // Initialize user ID from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("Medical_User_Id")
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      toast.error("User ID not found. Please log in again.")
    }
  }, [])

  // Extract unique categories from flashcards
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set<string>()
    flashcards.forEach((card) => {
      if (card && card.category) categorySet.add(card.category)
    })
    return Array.from(categorySet)
  }, [flashcards])

  // Extract unique tags from flashcards
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>()
    flashcards.forEach((card) => {
      if (card && card.tags && Array.isArray(card.tags)) {
        card.tags.forEach((tag) => {
          if (tag) tagSet.add(tag)
        })
      }
    })
    return Array.from(tagSet)
  }, [flashcards])

  // Fetch flashcards based on selected filters
  const fetchFlashcards = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // Prepare filter parameters
      const params: Record<string, string> = {}

      if (categoryFilter) {
        params.category = categoryFilter
      }

      if (difficultyFilter) {
        params.difficulty = difficultyFilter
      }

      if (tagFilter) {
        params.tag = tagFilter
      }

      const response = await apiService.getFlashcards(params)
      setFlashcards(response.data)
      setFilteredCards(response.data)
      setCurrentCard(0)
    } catch (error) {
      console.error("Error fetching flashcards:", error)

      if (error && typeof error === "object" && "message" in error) {
        setError((error as Error).message || "Failed to load flashcards")
      } else {
        setError("Failed to load flashcards. Please try again later.")
      }

      setFlashcards([])
      setFilteredCards([])
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, difficultyFilter, tagFilter, userId])

  // Fetch cards that need review (mastery < 30%)
  const fetchReviewCards = useCallback(async () => {
    if (!userId) return

    setIsReviewLoading(true)
    setReviewError(null)

    try {
      // Get all flashcards for the user
      const response = await apiService.getFlashcards({ userId })

      // Filter cards with low mastery (marked for review)
      const cardsForReview = response.data.filter((card: Flashcard) => card.mastery < 30 && card.reviewCount > 0)

      setReviewCards(cardsForReview)
      setCurrentReviewCard(0)
    } catch (error) {
      console.error("Error fetching review cards:", error)

      if (error && typeof error === "object" && "message" in error) {
        setReviewError((error as Error).message || "Failed to load review cards")
      } else {
        setReviewError("Failed to load review cards. Please try again later.")
      }

      setReviewCards([])
    } finally {
      setIsReviewLoading(false)
    }
  }, [userId])

  // Initial data load
  useEffect(() => {
    if (userId) {
      fetchFlashcards()
    }
  }, [fetchFlashcards, userId])

  // Load review cards when the reviews tab is selected
  useEffect(() => {
    if (activeTab === "reviews" && userId) {
      fetchReviewCards()
    }
  }, [activeTab, fetchReviewCards, userId])

  // Filter cards when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCards(flashcards)
    } else {
      const lowercaseQuery = searchQuery.toLowerCase()

      const filtered = flashcards.filter((card) => {
        const questionMatch = card.question && card.question.toLowerCase().includes(lowercaseQuery)
        const answerMatch = card.answer && card.answer.toLowerCase().includes(lowercaseQuery)
        const tagsMatch =
          card.tags &&
          Array.isArray(card.tags) &&
          card.tags.some((tag) => tag && tag.toLowerCase().includes(lowercaseQuery))
        const categoryMatch = card.category && card.category.toLowerCase().includes(lowercaseQuery)

        return questionMatch || answerMatch || tagsMatch || categoryMatch
      })

      setFilteredCards(filtered)
      setCurrentCard(0)
    }
  }, [searchQuery, flashcards])

  // Calculate overall study progress
  useEffect(() => {
    if (filteredCards.length > 0) {
      const totalMastery = filteredCards.reduce((sum, card) => sum + (card.mastery || 0), 0)
      const progress = totalMastery / filteredCards.length
      setStudyProgress(progress)
    } else {
      setStudyProgress(0)
    }
  }, [filteredCards])

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
      setFilteredCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      // Remove from review cards if mastery is now above threshold
      if (newMastery >= 30) {
        setReviewCards((prevCards) => prevCards.filter((c) => c.id !== response.data.id))
      } else {
        setReviewCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      }

      // Update overall study progress
      const totalMastery = filteredCards.reduce((sum, c) => {
        return sum + (c.id === card.id ? newMastery : c.mastery)
      }, 0)

      const newProgress = totalMastery / filteredCards.length
      setStudyProgress(newProgress)

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
      setFilteredCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      // Add to review cards if not already there
      if (!reviewCards.some((c) => c.id === response.data.id)) {
        setReviewCards((prevCards) => [...prevCards, response.data])
      } else {
        setReviewCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      }

      // Update overall study progress
      const totalMastery = filteredCards.reduce((sum, c) => {
        return sum + (c.id === card.id ? newMastery : c.mastery)
      }, 0)

      const newProgress = totalMastery / filteredCards.length
      setStudyProgress(newProgress)

      toast("Card marked for review", { icon: "📝" })
      return true
    } catch (error) {
      apiService.handleApiError(error, "Failed to update card progress")
      return false
    }
  }

  return (
    <Card className="w-full shadow-md border-0">
      <CardContent className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-primary">Review & Flashcard Suggestions</h2>
          <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="study" className="text-base py-2.5">
                  Study
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-base py-2.5">
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="study" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                <StudyTab
                  filteredCards={filteredCards}
                  currentCard={currentCard}
                  studyProgress={studyProgress}
                  isLoading={isLoading}
                  error={error}
                  setCurrentCard={setCurrentCard}
                  fetchFlashcards={fetchFlashcards}
                  markCardAsKnown={markCardAsKnown}
                  markCardForReview={markCardForReview} setIsNewCardDialogOpen={function (isOpen: boolean): void {
                    throw new Error("Function not implemented.")
                  } }                />
              </TabsContent>

              <TabsContent value="reviews" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                <ReviewsTab
                  reviewCards={reviewCards}
                  currentReviewCard={currentReviewCard}
                  isReviewLoading={isReviewLoading}
                  reviewError={reviewError}
                  setCurrentReviewCard={setCurrentReviewCard}
                  setActiveTab={setActiveTab}
                  fetchReviewCards={fetchReviewCards}
                  markCardAsKnown={markCardAsKnown}
                  markCardForReview={markCardForReview}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </CardContent>
    </Card>
  )
}
