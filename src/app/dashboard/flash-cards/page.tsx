"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Lightbulb, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"

type Flashcard = {
  question: string
  answer: string
  hint: string
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [flipping, setFlipping] = useState(false)
  // const [streak, setStreak] = useState(0)

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length)
    setShowAnswer(false)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    setShowAnswer(false)
  }

  const flipCard = () => {
    setFlipping(true)
    setTimeout(() => {
      setShowAnswer((prev) => !prev)
      setFlipping(false)
    }, 150)
  }

  useEffect(() => {
    const fetchFlashcards = async () => {
      const response = await fetch("https://medical-backend-loj4.onrender.com/api/test/flashcards?numFlashcards=5")
      const data = await response.json()
      setFlashcards(data)
    }

    fetchFlashcards()
  }, [])

  return (
    <div className="min-h-[85dvh] bg-gradient-to-br from-teal-50 via-blue-50/80 to-cyan-50/80 border border-slate-200 rounded-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-center text-teal-800">Medical Flashcards</h1>
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
                className={`h-[28rem] md:h-96 p-4 md:p-8 flex flex-col justify-between bg-white rounded-3xl shadow-lg overflow-hidden
                  ${flipping ? "scale-95 opacity-50" : ""}
                  ${showAnswer ? "bg-teal-50" : "bg-white"}`}
                style={{
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-teal-600 font-semibold text-sm md:text-base">
                    Card {currentCard + 1}/{flashcards.length}
                  </span>
                </div>
                <div className="flex-grow flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showAnswer ? "answer" : "question"}
                      initial={{ opacity: 0, rotateY: 180 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -180 }}
                      transition={{ duration: 0.5 }}
                      className={`w-full h-full flex flex-col items-center justify-center transition-transform duration-300 ${flipping ? "rotate-y-180" : ""}`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: flipping ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      {showAnswer ? (
                        <p className="text-xl md:text-2xl font-bold text-teal-700 text-center">
                          {flashcards[currentCard]?.answer}
                        </p>
                      ) : (
                        <>
                          <p className="text-xl md:text-2xl font-bold text-teal-700 mb-4 text-center">
                            {flashcards[currentCard]?.question}
                          </p>
                          <div className="bg-teal-100 rounded-lg p-3 md:p-4 inline-block">
                            <Lightbulb className="text-yellow-500 inline mr-2 h-4 w-4 md:h-5 md:w-5" />
                            <span className="text-teal-600 italic text-sm md:text-base">
                              {flashcards[currentCard]?.hint}
                            </span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={flipCard}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full px-4 py-2 md:px-6 md:py-3 font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <RotateCcw className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    {showAnswer ? "Show Question" : "Reveal Answer"}
                  </Button>
                </div>
              </Card>
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-2 md:p-4 flex justify-between rounded-xl mt-2 max-w-xl mx-auto">
                <Button
                  onClick={prevCard}
                  variant="ghost"
                  className="text-white hover:bg-white hover:text-teal-500 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <Button
                  onClick={nextCard}
                  variant="ghost"
                  className="text-white hover:bg-white hover:text-teal-500 rounded-full"
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

