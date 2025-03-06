"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Filter,
  Lightbulb,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Tag,
  Trash2,
  X,
  XCircle
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import apiService, { type Flashcard } from "@/services/api-service"
import FlashcardForm from "./flashcard-form"

export default function FlashcardsPage() {
  // State for flashcards and filtering
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [flipping, setFlipping] = useState(false)

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [debugMode, setDebugMode] = useState(false)

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

  // Initial data load
  useEffect(() => {
    if (userId) {
      fetchFlashcards()
    }
  }, [fetchFlashcards, userId])

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

  // Navigation functions
  const nextCard = () => {
    if (filteredCards.length === 0) return
    setCurrentCard((prev) => (prev + 1) % filteredCards.length)
    setShowAnswer(false)
  }

  const prevCard = () => {
    if (filteredCards.length === 0) return
    setCurrentCard((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
    setShowAnswer(false)
  }

  const flipCard = () => {
    setFlipping(true)
    setTimeout(() => {
      setShowAnswer((prev) => !prev)
      setFlipping(false)
    }, 150)
  }

  const shuffleCards = () => {
    if (filteredCards.length <= 1) {
      toast.error("Not enough cards to shuffle")
      return
    }

    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
    setFilteredCards(shuffled)
    setCurrentCard(0)
    setShowAnswer(false)
    toast.success("Cards shuffled")
  }

  // Handle filter changes
  const handleFilterCategoryChange = (value: string) => {
    setCategoryFilter(value === "all_categories" ? "" : value)
  }

  const handleFilterDifficultyChange = (value: string) => {
    setDifficultyFilter(value === "all_difficulties" ? "" : value)
  }

  const handleFilterTagChange = (value: string) => {
    setTagFilter(value === "all_tags" ? "" : value)
  }

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

      // Adjust current card index if needed
      if (currentCard >= filteredCards.length - 1) {
        setCurrentCard(Math.max(0, filteredCards.length - 2))
      }

      setIsEditCardDialogOpen(false)
      setEditingCard(null)

      toast.success("Flashcard deleted successfully")
    } catch (error) {
      apiService.handleApiError(error, "Failed to delete flashcard")
    }
  }

  // Study progress tracking
  const markCardAsKnown = async () => {
    if (filteredCards.length === 0) return

    const card = filteredCards[currentCard]

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

      // Update overall study progress
      const totalMastery = filteredCards.reduce((sum, card, index) => {
        return sum + (index === currentCard ? newMastery : card.mastery)
      }, 0)

      const newProgress = totalMastery / filteredCards.length
      setStudyProgress(newProgress)

      nextCard()
      toast.success("Card marked as known")
    } catch (error) {
      apiService.handleApiError(error, "Failed to update card progress")
      nextCard() // Still move to next card even if there was an error
    }
  }

  const markCardAsUnknown = async () => {
    if (filteredCards.length === 0) return

    const card = filteredCards[currentCard]

    try {
      // Decrease mastery level (by 5-10% based on current level)
      const masteryDecrease = card.mastery > 50 ? 10 : 5
      const newMastery = Math.max(0, card.mastery - masteryDecrease)

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

      // Update overall study progress
      const totalMastery = filteredCards.reduce((sum, card, index) => {
        return sum + (index === currentCard ? newMastery : card.mastery)
      }, 0)

      const newProgress = totalMastery / filteredCards.length
      setStudyProgress(newProgress)

      nextCard()
      toast("Card marked for review", { icon: "📝" })
    } catch (error) {
      apiService.handleApiError(error, "Failed to update card progress")
      nextCard() // Still move to next card even if there was an error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation Bar */}
      {/* <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-indigo-500" />
              <h1 className="text-xl font-semibold text-slate-800 dark:text-white">MedCards</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-600 dark:text-slate-300"
                    onClick={() => setDebugMode(!debugMode)}
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Debug Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Saved cards</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
                    <Home className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Home</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Avatar className="h-8 w-8">
              <AvatarImage src="https://randomuser.me/api/portraits/men/42.jpg" alt="User" />
              <AvatarFallback>MD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav> */}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-4xl text-gray-700 font-bold">Flashcards</h1>
        </div>
        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-slate-400"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex space-x-3 w-full md:w-auto">
                <Dialog open={isNewCardDialogOpen} onOpenChange={setIsNewCardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      New Card
                    </Button>
                  </DialogTrigger>
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
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
              </div>

              <div className="flex flex-wrap gap-3 w-full">
                <Select value={categoryFilter} onValueChange={handleFilterCategoryChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_categories">All categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={handleFilterDifficultyChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_difficulties">All difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tagFilter} onValueChange={handleFilterTagChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_tags">All tags</SelectItem>
                    {uniqueTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" size="icon" onClick={shuffleCards}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Flashcard */}
            {isLoading ? (
              <div className="flex justify-center items-center h-[28rem]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Error Loading Cards</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={() => fetchFlashcards()}>Try Again</Button>
                </CardContent>
              </Card>
            ) : filteredCards.length === 0 ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Cards Found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {searchQuery ? "No cards match your search criteria." : "There are no cards in this category."}
                  </p>
                  <Button onClick={() => setIsNewCardDialogOpen(true)}>Create New Card</Button>
                </CardContent>
              </Card>
            ) : (
              // Add defensive checks for card rendering
              filteredCards.length > 0 &&
              currentCard < filteredCards.length && (
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCard}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card
                        className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-hidden
                          ${flipping ? "scale-95 opacity-50" : ""}
                          ${showAnswer ? "bg-indigo-50 dark:bg-indigo-950" : "bg-white dark:bg-slate-800"}`}
                      >
                        <CardHeader className="p-0">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col gap-2">
                              <Badge
                                variant="outline"
                                className="text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-950"
                              >
                                {filteredCards[currentCard]?.category || "Uncategorized"}
                              </Badge>
                              <Badge
                                variant={
                                  filteredCards[currentCard]?.difficulty === "easy"
                                    ? "default"
                                    : filteredCards[currentCard]?.difficulty === "hard"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="w-fit"
                              >
                                {(filteredCards[currentCard]?.difficulty || "medium").charAt(0).toUpperCase() +
                                  (filteredCards[currentCard]?.difficulty || "medium").slice(1)}
                              </Badge>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">
                                Card {currentCard + 1}/{filteredCards.length}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(filteredCards[currentCard])}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                      <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Delete Card</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Are you sure you want to delete this card? This action cannot be undone.
                                        </p>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        {/* <Button variant="outline" size="sm">
                                          Cancel
                                        </Button> */}
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            filteredCards[currentCard]?.id &&
                                            handleDeleteCard(filteredCards[currentCard].id as string)
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
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
                                <div className="text-center">
                                  <Badge className="mb-4 bg-green-500">Answer</Badge>
                                  <p className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                                    {filteredCards[currentCard]?.answer || "No answer provided"}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Badge className="mb-4 bg-indigo-500">Question</Badge>
                                  <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                                    {filteredCards[currentCard]?.question || "No question provided"}
                                  </p>
                                  {filteredCards[currentCard]?.hint && (
                                    <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 inline-block">
                                      <Lightbulb className="text-amber-500 inline mr-2 h-5 w-5" />
                                      <span className="text-slate-700 dark:text-slate-300 italic">
                                        {filteredCards[currentCard]?.hint}
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
                            {filteredCards[currentCard]?.tags &&
                              Array.isArray(filteredCards[currentCard]?.tags) &&
                              filteredCards[currentCard]?.tags.map((tag, index) => (
                                <Badge key={`${tag}-${index}`} variant="outline" className="flex items-center gap-1">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                          </div>
                          <div className="flex justify-between items-center w-full">
                            <Button
                              variant="ghost"
                              onClick={prevCard}
                              disabled={filteredCards.length <= 1}
                              className="text-slate-600 dark:text-slate-400"
                            >
                              <ChevronLeft className="h-5 w-5 mr-1" />
                              Previous
                            </Button>

                            <Button onClick={flipCard} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6">
                              <RotateCcw className="mr-2 h-5 w-5" />
                              {showAnswer ? "Show Question" : "Reveal Answer"}
                            </Button>

                            <Button
                              variant="ghost"
                              onClick={nextCard}
                              disabled={filteredCards.length <= 1}
                              className="text-slate-600 dark:text-slate-400"
                            >
                              Next
                              <ChevronRight className="h-5 w-5 ml-1" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="study" className="mt-6">
            {/* Study Mode */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Study Progress</h2>
                <Badge variant="outline" className="text-indigo-500">
                  {Math.round(studyProgress)}% Mastery
                </Badge>
              </div>
              <Progress value={studyProgress} className="h-2" />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[28rem]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Error Loading Cards</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={() => fetchFlashcards()}>Try Again</Button>
                </CardContent>
              </Card>
            ) : filteredCards.length === 0 ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Cards to Study</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Select a different category or create new cards to study.
                  </p>
                  <Button onClick={() => setIsNewCardDialogOpen(true)}>Create New Card</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCard}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-hidden
                        ${flipping ? "scale-95 opacity-50" : ""}
                        ${showAnswer ? "bg-indigo-50 dark:bg-indigo-950" : "bg-white dark:bg-slate-800"}`}
                    >
                      <CardHeader className="p-0">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex flex-col gap-2">
                            <Badge
                              variant="outline"
                              className="text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-950"
                            >
                              {filteredCards[currentCard]?.category}
                            </Badge>
                            <Badge
                              variant={
                                filteredCards[currentCard]?.difficulty === "easy"
                                  ? "default"
                                  : filteredCards[currentCard]?.difficulty === "hard"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="w-fit"
                            >
                              {filteredCards[currentCard]?.difficulty.charAt(0).toUpperCase() +
                                filteredCards[currentCard]?.difficulty.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              Card {currentCard + 1}/{filteredCards.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                Mastery: {filteredCards[currentCard]?.mastery}%
                              </span>
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${filteredCards[currentCard]?.mastery}%` }}
                                ></div>
                              </div>
                            </div>
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
                              <div className="text-center">
                                <Badge className="mb-4 bg-green-500">Answer</Badge>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                                  {filteredCards[currentCard]?.answer}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Badge className="mb-4 bg-indigo-500">Question</Badge>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                                  {filteredCards[currentCard]?.question}
                                </p>
                                {filteredCards[currentCard]?.hint && (
                                  <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 inline-block">
                                    <Lightbulb className="text-amber-500 inline mr-2 h-5 w-5" />
                                    <span className="text-slate-700 dark:text-slate-300 italic">
                                      {filteredCards[currentCard]?.hint}
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
                          {filteredCards[currentCard]?.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="flex items-center gap-1">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {showAnswer ? (
                          <div className="grid grid-cols-2 gap-4 w-full">
                            <Button
                              variant="outline"
                              onClick={markCardAsUnknown}
                              className="border-red-200 text-red-500 hover:bg-red-50"
                            >
                              <XCircle className="h-5 w-5 mr-2" />
                              Still Learning
                            </Button>
                            <Button onClick={markCardAsKnown} className="bg-green-500 hover:bg-green-600 text-white">
                              <CheckCircle2 className="h-5 w-5 mr-2" />
                              Got It
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={flipCard} className="bg-indigo-500 hover:bg-indigo-600 text-white w-full">
                            <RotateCcw className="mr-2 h-5 w-5" />
                            Reveal Answer
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
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

      <Toaster position="top-right" />
      {debugMode && (
        <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg max-w-md max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Info</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white" onClick={() => setDebugMode(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs">
            <p>User ID: {userId || "Not set"}</p>
            <p>Cards: {flashcards.length}</p>
            <p>Filtered: {filteredCards.length}</p>
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