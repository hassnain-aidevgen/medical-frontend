"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, FileText, Lightbulb, RotateCcw, Tag, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Flashcard } from "@/services/api-service"

interface StudyTabProps {
  filteredCards: Flashcard[]
  currentCard: number
  studyProgress: number
  isLoading: boolean
  error: string | null
  setCurrentCard: (index: number) => void
  setIsNewCardDialogOpen: (isOpen: boolean) => void
  fetchFlashcards: () => Promise<void>
  markCardAsKnown: (card: Flashcard) => Promise<boolean>
  markCardForReview: (card: Flashcard) => Promise<boolean>
}

export default function StudyTab({
  filteredCards,
  currentCard,
  studyProgress,
  isLoading,
  error,
  setCurrentCard,
  setIsNewCardDialogOpen,
  fetchFlashcards,
  markCardAsKnown,
  markCardForReview,
}: StudyTabProps) {
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

  const handleMarkCardAsKnown = async () => {
    if (filteredCards.length === 0) return
    const success = await markCardAsKnown(filteredCards[currentCard])
    if (success) {
      nextCard()
    }
  }

  const handleMarkCardForReview = async () => {
    if (filteredCards.length === 0) return
    const success = await markCardForReview(filteredCards[currentCard])
    if (success) {
      nextCard()
    }
  }

  return (
    <>
      {/* Study Progress */}
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
                        <span className="text-xs text-slate-500">Mastery: {filteredCards[currentCard]?.mastery}%</span>
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
                        <div className="text-center md:text-left md:flex md:items-center md:gap-4">
                          <div className="md:flex-1">
                            <Badge className="mb-4 bg-green-500">Answer</Badge>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                              {filteredCards[currentCard]?.answer}
                            </p>
                          </div>

                          {filteredCards[currentCard]?.imageUrl ? (
                            <div className="mt-4 md:mt-0 md:flex-1 md:flex md:justify-center">
                              <div className="overflow-hidden rounded-md max-h-60 md:max-h-48 lg:max-h-56 border">
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
                        onClick={handleMarkCardForReview}
                        className="border-red-200 text-red-500 hover:bg-red-50"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Mark for Review
                      </Button>
                      <Button onClick={handleMarkCardAsKnown} className="bg-green-500 hover:bg-green-600 text-white">
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
    </>
  )
}
