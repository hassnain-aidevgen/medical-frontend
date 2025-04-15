"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import BrowseTab from "./browse-tab"
import StudyTab from "./study-tab"
import ReviewsTab from "./reviews-tab"
import StatsTab from "./stats-tab"
import FlashcardForm from "./flashcard-form"
import apiService, { type Flashcard } from "@/services/api-service"

export default function FlashcardsPage() {
  // State for flashcards and filtering
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([])
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [currentReviewCard, setCurrentReviewCard] = useState(0)

  // Filters and search state
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // UI state
  const [activeTab, setActiveTab] = useState("browse")
  const [isNewCardDialogOpen, setIsNewCardDialogOpen] = useState(false)
  const [isEditCardDialogOpen, setIsEditCardDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [studyProgress, setStudyProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isReviewLoading, setIsReviewLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [debugMode, setDebugMode] = useState(false)
  const [showAutoGenerator, setShowAutoGenerator] = useState(false)

  // Default flashcard template
  const defaultFlashcard: Partial<Flashcard> = {
    question: "",
    answer: "",
    hint: "",
    category: "",
    difficulty: "medium",
    tags: [],
    mastery: 0,
    reviewCount: 0,
    userId: "",
  }

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

      // Set a user-friendly error message for the UI
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

  // Form submission handlers
  const handleNewCardSubmit = async (data: Partial<Flashcard>) => {
    setIsSubmitting(true)

    try {
      const response = await apiService.createFlashcard({
        ...data,
        userId,
      })

      setFlashcards((prevCards) => [...prevCards, response.data])
      setFilteredCards((prevCards) => [...prevCards, response.data])
      setCurrentCard(filteredCards.length)
      setIsNewCardDialogOpen(false)

      toast.success("New flashcard created successfully")
    } catch (error) {
      apiService.handleApiError(error, "Failed to create flashcard")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit card handlers
  const openEditDialog = (card: Flashcard) => {
    setEditingCard({ ...card })
    setIsEditCardDialogOpen(true)
  }

  const handleUpdateCardSubmit = async (data: Partial<Flashcard>) => {
    if (!editingCard || !editingCard.id) {
      toast.error("Missing flashcard ID")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiService.updateFlashcard(editingCard.id, {
        ...data,
        userId,
      })

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((card) => (card.id === response.data.id ? response.data : card)))
      setFilteredCards((prevCards) => prevCards.map((card) => (card.id === response.data.id ? response.data : card)))
      setReviewCards((prevCards) => prevCards.map((card) => (card.id === response.data.id ? response.data : card)))

      setIsEditCardDialogOpen(false)
      setEditingCard(null)

      toast.success("Flashcard updated successfully")
    } catch (error) {
      apiService.handleApiError(error, "Failed to update flashcard")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      await apiService.deleteFlashcard(id)

      // Remove the card from state
      setFlashcards((prevCards) => prevCards.filter((card) => card.id !== id))
      setFilteredCards((prevCards) => prevCards.filter((card) => card.id !== id))
      setReviewCards((prevCards) => prevCards.filter((card) => card.id !== id))

      // Adjust current card index if needed
      if (currentCard >= filteredCards.length - 1) {
        setCurrentCard(Math.max(0, filteredCards.length - 2))
      }

      if (currentReviewCard >= reviewCards.length - 1) {
        setCurrentReviewCard(Math.max(0, reviewCards.length - 2))
      }

      setIsEditCardDialogOpen(false)
      setEditingCard(null)

      toast.success("Flashcard deleted successfully")
    } catch (error) {
      apiService.handleApiError(error, "Failed to delete flashcard")
    }
  }

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
      const totalMastery = filteredCards.reduce((sum, c, index) => {
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
      const totalMastery = filteredCards.reduce((sum, c, index) => {
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

  // Handle flashcards generated from the auto-generator
  const handleFlashcardsGenerated = (generatedFlashcards: Flashcard[]) => {
    setFlashcards((prevCards) => [...prevCards, ...generatedFlashcards])
    setFilteredCards((prevCards) => [...prevCards, ...generatedFlashcards])
    toast.success(`Added ${generatedFlashcards.length} auto-generated flashcards`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-4xl text-gray-700 font-bold">Flashcards</h1>
        </div>
        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            <BrowseTab
              flashcards={flashcards}
              filteredCards={filteredCards}
              currentCard={currentCard}
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              difficultyFilter={difficultyFilter}
              tagFilter={tagFilter}
              isLoading={isLoading}
              error={error}
              userId={userId}
              uniqueCategories={uniqueCategories}
              uniqueTags={uniqueTags}
              showAutoGenerator={showAutoGenerator}
              setSearchQuery={setSearchQuery}
              setCategoryFilter={setCategoryFilter}
              setDifficultyFilter={setDifficultyFilter}
              setTagFilter={setTagFilter}
              setCurrentCard={setCurrentCard}
              setIsNewCardDialogOpen={setIsNewCardDialogOpen}
              setShowAutoGenerator={setShowAutoGenerator}
              fetchFlashcards={fetchFlashcards}
              openEditDialog={openEditDialog}
              handleDeleteCard={handleDeleteCard}
              handleFlashcardsGenerated={handleFlashcardsGenerated}
            />
          </TabsContent>

          <TabsContent value="study" className="mt-6">
            <StudyTab
              filteredCards={filteredCards}
              currentCard={currentCard}
              studyProgress={studyProgress}
              isLoading={isLoading}
              error={error}
              setCurrentCard={setCurrentCard}
              setIsNewCardDialogOpen={setIsNewCardDialogOpen}
              fetchFlashcards={fetchFlashcards}
              markCardAsKnown={markCardAsKnown}
              markCardForReview={markCardForReview}
            />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
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

          <TabsContent value="stats" className="mt-6">
            <StatsTab flashcards={flashcards} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Card Dialog */}
      <Dialog open={isEditCardDialogOpen} onOpenChange={setIsEditCardDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          {editingCard && (
            <FlashcardForm
              initialData={editingCard}
              onSubmit={handleUpdateCardSubmit}
              onCancel={() => {
                setIsEditCardDialogOpen(false)
                setEditingCard(null)
              }}
              isSubmitting={isSubmitting}
              title="Edit Flashcard"
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New Card Dialog */}
      <Dialog open={isNewCardDialogOpen} onOpenChange={setIsNewCardDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <FlashcardForm
            initialData={defaultFlashcard}
            onSubmit={handleNewCardSubmit}
            onCancel={() => setIsNewCardDialogOpen(false)}
            isSubmitting={isSubmitting}
            title="Add New Flashcard"
            submitLabel="Add Card"
          />
        </DialogContent>
      </Dialog>

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
            <p>Filtered: {filteredCards.length}</p>
            <p>Review: {reviewCards.length}</p>
            <p>Current: {currentCard}</p>
            <p>Category: {categoryFilter || "All"}</p>
            <p>Error: {error || "None"}</p>
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
