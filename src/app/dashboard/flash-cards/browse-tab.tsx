"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
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
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"

import AutoFlashcardGenerator from "@/components/auto-flashcard-generator"
import ChallengeMode from "@/components/challenge-mode"
import type { Flashcard } from "@/services/api-service"

interface BrowseTabProps {
  flashcards: Flashcard[]
  filteredCards: Flashcard[]
  currentCard: number
  searchQuery: string
  categoryFilter: string
  difficultyFilter: string
  tagFilter: string
  isLoading: boolean
  error: string | null
  userId: string
  uniqueCategories: string[]
  uniqueTags: string[]
  showAutoGenerator: boolean
  setSearchQuery: (query: string) => void
  setCategoryFilter: (category: string) => void
  setDifficultyFilter: (difficulty: string) => void
  setTagFilter: (tag: string) => void
  setCurrentCard: (index: number) => void
  setIsNewCardDialogOpen: (isOpen: boolean) => void
  setShowAutoGenerator: (show: boolean) => void
  fetchFlashcards: () => Promise<void>
  openEditDialog: (card: Flashcard) => void
  handleDeleteCard: (id: string) => Promise<void>
  handleFlashcardsGenerated: (flashcards: Flashcard[]) => void
}

export default function BrowseTab({
  flashcards,
  filteredCards,
  currentCard,
  searchQuery,
  categoryFilter,
  difficultyFilter,
  tagFilter,
  isLoading,
  error,
  userId,
  uniqueCategories,
  uniqueTags,
  showAutoGenerator,
  setSearchQuery,
  setCategoryFilter,
  setDifficultyFilter,
  setTagFilter,
  setCurrentCard,
  setIsNewCardDialogOpen,
  setShowAutoGenerator,
  fetchFlashcards,
  openEditDialog,
  handleDeleteCard,
  handleFlashcardsGenerated,
}: BrowseTabProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [flipping, setFlipping] = useState(false)

  // Navigation functions
  const nextCard = () => {
    if (filteredCards.length === 0) return
    setCurrentCard((currentCard + 1) % filteredCards.length)
    setShowAnswer(false)
  }

  const prevCard = () => {
    if (filteredCards.length === 0) return
    setCurrentCard((currentCard - 1 + filteredCards.length) % filteredCards.length)
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

  return (
    <>
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
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                onClick={() => setIsNewCardDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Card
              </Button>
            </DialogTrigger>
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

      {showAutoGenerator && (
        <div className="mb-8">
          <AutoFlashcardGenerator userId={userId} onFlashcardsGenerated={handleFlashcardsGenerated} />
        </div>
      )}

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
                  className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-auto
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
                          <div className="text-center md:text-left md:flex md:items-center md:gap-4">
                            <div className="md:flex-1">
                              <Badge className="mb-4 bg-green-500">Answer</Badge>
                              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {filteredCards[currentCard]?.answer || "No answer provided"}
                              </p>
                            </div>

                            {filteredCards[currentCard]?.imageUrl ? (
                              <div className="mt-4 md:mt-0 md:flex-1 md:flex md:justify-center border">
                                <div className="overflow-hidden rounded-md max-h-60 md:max-h-48 lg:max-h-56">
                                  <img
                                    src={filteredCards[currentCard]?.imageUrl}
                                    alt="Answer illustration"
                                    className="object-contain w-full h-full"
                                    onError={(e) => {
                                      const parentDiv = e.currentTarget.parentElement;
                                      if (parentDiv) {
                                        parentDiv.innerHTML = '<p class="text-gray-500 text-xs m-1">Unable to load image</p>';
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-2 italic md:hidden">No image provided</p>
                            )}
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
                    <div className="flex flex-wrap justify-between items-center w-full gap-2">
                      <Button
                        variant="ghost"
                        onClick={prevCard}
                        disabled={filteredCards.length <= 1}
                        className="text-slate-600 dark:text-slate-400 text-sm sm:text-base px-2 sm:px-4"
                      >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Previous
                      </Button>

                      <Button
                        onClick={flipCard}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 sm:px-6 text-sm sm:text-base order-first sm:order-none w-full sm:w-auto mb-2 sm:mb-0"
                      >
                        <RotateCcw className="mr-2 h-5 w-5" />
                        {showAnswer ? "Show Question" : "Reveal Answer"}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={nextCard}
                        disabled={filteredCards.length <= 1}
                        className="text-slate-600 dark:text-slate-400 text-sm sm:text-base px-2 sm:px-4"
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
      <div className="flex gap-3 mt-6">
        <ChallengeMode flashcards={flashcards} />
        <Button
          onClick={() => setShowAutoGenerator(!showAutoGenerator)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          {showAutoGenerator ? "Hide Generator" : "Auto-Generate Flashcards"}
        </Button>
      </div>
    </>
  )
}
