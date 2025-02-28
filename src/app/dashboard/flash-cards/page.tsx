"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Lightbulb,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type Flashcard = {
  id?: string
  question: string
  answer: string
  hint: string
  category: string
}

type Deck = {
  id: string
  name: string
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [category, setCategory] = useState("anatomy")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("browse")
  const [decks, setDecks] = useState<Deck[]>([])
  const [newCard, setNewCard] = useState<Flashcard>({ question: "", answer: "", hint: "", category: "" })
  const [newDeck, setNewDeck] = useState({ name: "" })
  const [isNewCardDialogOpen, setIsNewCardDialogOpen] = useState(false)
  const [isNewDeckDialogOpen, setIsNewDeckDialogOpen] = useState(false)

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

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentCard(0)
    setShowAnswer(false)
  }

  const handleNewCard = async () => {
    try {
      const response = await fetch("https://medical-backend-loj4.onrender.com/api/test/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([newCard]),
      })
      if (response.ok) {
        const addedCard = await response.json()
        console.log("New card added:", addedCard)
        setFlashcards((prevCards) => [...prevCards, ...addedCard.data])
        setCurrentCard(flashcards.length)
        setNewCard({ question: "", answer: "", hint: "", category: "" })
        setIsNewCardDialogOpen(false)
      } else {
        console.error("Failed to add new card")
      }
    } catch (error) {
      console.error("Error adding new card:", error)
    }
  }

  const handleCreateDeck = async () => {
    try {
      const response = await fetch("https://medical-backend-loj4.onrender.com/api/test/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([newDeck]),
      })
      if (response.ok) {
        const addedDeck = await response.json()
        setDecks([...decks, addedDeck])
        setNewDeck({ name: "" })
        setIsNewDeckDialogOpen(false)
      } else {
        console.error("Failed to create new deck")
      }
    } catch (error) {
      console.error("Error creating new deck:", error)
    }
  }

  const fetchFlashcards = useCallback(async (selectedCategory: string) => {
    try {
      const response = await fetch(
        `https://medical-backend-loj4.onrender.com/api/test/flashcards?numFlashcards=10&category=${selectedCategory}`
      )
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched flashcards:", data); // Log the fetched data
        console.log("Selected Category:", selectedCategory);
console.log("Categories in API Response:", data.map((card: Flashcard) => card.category));
console.log("First Flashcard Object:", data[0]);
        setFlashcards(data)
        //  Filter is not working
        // setFlashcards(data.filter((card: Flashcard) => card.category.toLowerCase() === selectedCategory.toLowerCase()))
        setCurrentCard(0) // Reset to the first card when changing categories
      } else {
        console.error("Failed to fetch flashcards")
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error)
    }
  }, [])

  useEffect(() => {
    fetchFlashcards(category)
  }, [category, fetchFlashcards])

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value
    setCategory(newCategory)
    fetchFlashcards(newCategory)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-gray-800">Flashcards</h1>
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Home className="h-5 w-5 text-gray-600" />
        </Button>
      </nav>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("browse")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "browse"
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => setActiveTab("study")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "study"
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Study
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex space-x-4">
            <Dialog open={isNewDeckDialogOpen} onOpenChange={setIsNewDeckDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-blue-500 border-blue-500">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Deck
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Deck</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newDeck.name}
                      onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateDeck}>Create Deck</Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isNewCardDialogOpen} onOpenChange={setIsNewCardDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Card</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="question" className="text-right">
                      Question
                    </Label>
                    <Textarea
                      id="question"
                      value={newCard.question}
                      onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="answer" className="text-right">
                      Answer
                    </Label>
                    <Textarea
                      id="answer"
                      value={newCard.answer}
                      onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="hint" className="text-right">
                      Hint
                    </Label>
                    <Input
                      id="hint"
                      value={newCard.hint}
                      onChange={(e) => setNewCard({ ...newCard, hint: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <select
                      id="category"
                      value={newCard.category}
                      onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                      className="col-span-3"
                    >
                      <option value="anatomy">Anatomy</option>
                      <option value="pharmacology">Pharmacology</option>
                      <option value="pathology">Pathology</option>
                      <option value="physiology">Physiology</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleNewCard}>Add Card</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Category and Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => prevCard()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <select
              onChange={handleCategoryChange}
              value={category}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="anatomy">Anatomy</option>
              <option value="pharmacology">Pharmacology</option>
              <option value="pathology">Pathology</option>
              <option value="physiology">Physiology</option>
            </select>
            <Button variant="ghost" onClick={() => nextCard()}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={shuffleCards}>
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle Cards
            </Button>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Switch Deck
            </Button>
          </div>
        </div>

        {/* Flashcard */}
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
                className={`h-[28rem] p-8 flex flex-col justify-between bg-white rounded-xl shadow-md overflow-hidden
                  ${flipping ? "scale-95 opacity-50" : ""}
                  ${showAnswer ? "bg-blue-50" : "bg-white"}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-medium">
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
                      className="w-full h-full flex flex-col items-center justify-center"
                    >
                      {showAnswer ? (
                        <p className="text-2xl font-bold text-gray-800 text-center">
                          {flashcards[currentCard]?.answer}
                        </p>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-gray-800 mb-4 text-center">
                            {flashcards[currentCard]?.question}
                          </p>
                          <div className="bg-blue-50 rounded-lg p-4 inline-block">
                            <Lightbulb className="text-yellow-500 inline mr-2 h-5 w-5" />
                            <span className="text-gray-600 italic">{flashcards[currentCard]?.hint}</span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex justify-center mt-4">
                  <Button onClick={flipCard} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    {showAnswer ? "Show Question" : "Reveal Answer"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}