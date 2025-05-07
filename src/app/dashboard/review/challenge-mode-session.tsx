"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import axios from "axios"
import { ArrowLeft, ArrowRight, Flame, Timer, Trophy } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

// Constants for scoring
const BASE_POINTS = 100
const TIME_BONUS_MAX = 100
const COMBO_MULTIPLIER = 0.1
const FLASHCARD_TIME_LIMIT = 30 // seconds

export default function FlashcardChallengeMode() {
  // State for flashcard challenge
  const [flashcards, setFlashcards] = useState<
    Array<{
      _id: string
      question: string
      answer: string
    }>
  >([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(FLASHCARD_TIME_LIMIT)
  const [timerActive, setTimerActive] = useState(false)

  // Scoring state
  const [score, setScore] = useState({
    points: 0,
    timeBonus: 0,
    comboBonus: 0,
    totalScore: 0,
    currentCombo: 0,
    maxCombo: 0,
    cardsReviewed: 0,
    selfRatedCorrect: 0,
  })

  // User self-rating for each card
  const [ratings, setRatings] = useState<Record<string, "correct" | "incorrect" | "">>({})
  const [cardTimes, setCardTimes] = useState<number[]>([])

  // Fetch flashcards from backend
  const fetchFlashcards = useCallback(async () => {
    try {
      setLoading(true)

      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        toast.error("User ID not found. Please log in again.")
        setLoading(false)
        return
      }

      // Fetch flashcards for weak topics - backend handles all analysis
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/challenge/weak-topics-flashcards/${userId}?limit=10`)

      setFlashcards(response.data.flashcards)
      setLoading(false)

      // Start timer for first card
      setTimeRemaining(FLASHCARD_TIME_LIMIT)
      setTimerActive(true)

      toast.success("Challenge ready with flashcards for your weak topics!")
    } catch (error) {
      console.error("Error fetching flashcards:", error)

      // Mock data for testing if API fails
      const mockFlashcards = [
        {
          _id: "card1",
          question: "What is the primary function of hemoglobin?",
          answer:
            "To transport oxygen from the lungs to the tissues throughout the body. Hemoglobin is a protein in red blood cells that binds to oxygen in the lungs and releases it in tissues that need oxygen.",
        },
        {
          _id: "card2",
          question: "What are the major symptoms of measles?",
          answer:
            "High fever, cough, runny nose, red/watery eyes, and a characteristic maculopapular rash that spreads from the face downward. The rash usually appears 3-5 days after the first symptoms.",
        },
        {
          _id: "card3",
          question: "Which antibiotic class works by inhibiting bacterial cell wall synthesis?",
          answer:
            "Beta-lactams, including penicillins and cephalosporins. They inhibit bacterial cell wall synthesis by binding to penicillin-binding proteins and disrupting peptidoglycan cross-linking.",
        },
      ]

      setFlashcards(mockFlashcards)
      setLoading(false)

      // Start timer for first card
      setTimeRemaining(FLASHCARD_TIME_LIMIT)
      setTimerActive(true)

      toast.error("Failed to load flashcards from server. Using demo data.")
    }
  }, [])

  // Complete the challenge
  const completeChallenge = useCallback(async () => {
    try {
      setTimerActive(false)

      // Calculate average time per card
      const averageTime = cardTimes.length > 0 ? cardTimes.reduce((sum, time) => sum + time, 0) / cardTimes.length : 0

      // Prepare result payload
      const result = {
        userId: localStorage.getItem("Medical_User_Id"),
        challengeId: `flashcard-challenge-${Date.now()}`,
        score: {
          ...score,
          averageTimePerCard: Math.round(averageTime * 10) / 10,
        },
        ratings,
        completedAt: new Date().toISOString(),
      }

      // Send results to backend
      await axios.post(`https://medical-backend-loj4.onrender.com/api/challenge/complete-flashcards`, result)

      setCompleted(true)
      toast.success("Challenge completed!")
    } catch (error) {
      console.error("Error completing challenge:", error)
      setCompleted(true)
      toast.error("Failed to save results to server.")
    }
  }, [score, ratings, cardTimes])

  // Handle card timeout
  const handleTimeUp = useCallback(() => {
    if (flipped) {
      // If card is already flipped, move to next card
      // (user ran out of time while viewing answer)
      setFlipped(false)

      // Record the full time for this card
      const timeTaken = FLASHCARD_TIME_LIMIT
      setCardTimes((prev) => [...prev, timeTaken])

      // Update score - no self-rating, combo breaks
      setScore((prev) => ({
        ...prev,
        currentCombo: 0,
        cardsReviewed: prev.cardsReviewed + 1,
      }))

      // Set default rating to empty
      setRatings((prev) => ({
        ...prev,
        [flashcards[currentIndex]._id]: "",
      }))

      // Move to next card or complete the challenge
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setTimeRemaining(FLASHCARD_TIME_LIMIT)
        setTimerActive(true)
      } else {
        completeChallenge()
      }
    } else {
      // If card is not flipped, auto-flip it
      // (user ran out of time without flipping)
      setFlipped(true)
      setTimeRemaining(FLASHCARD_TIME_LIMIT) // Reset timer for answer side
      setTimerActive(true)
    }
  }, [flipped, currentIndex, flashcards, completeChallenge])

  // Timer effect
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null

    if (timerActive && timeRemaining > 0) {
      timerId = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerId as NodeJS.Timeout)
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [timerActive, timeRemaining, handleTimeUp])

  // Load flashcards on component mount
  useEffect(() => {
    fetchFlashcards()

    return () => {
      setTimerActive(false)
    }
  }, [fetchFlashcards])

  // Handle card flip
  const flipCard = () => {
    if (!flipped) {
      // Record time taken to view the question
      const timeTaken = FLASHCARD_TIME_LIMIT - timeRemaining
      setCardTimes((prev) => [...prev, timeTaken])

      setFlipped(true)
      setTimeRemaining(FLASHCARD_TIME_LIMIT) // Reset timer for answer side
      setTimerActive(true)
    }
  }

  // Handle user self-rating (I knew it / I didn't know it)
  const rateCard = (rating: "correct" | "incorrect") => {
    // Stop timer
    setTimerActive(false)

    // Record time taken to view the answer
    const answerTimeTaken = FLASHCARD_TIME_LIMIT - timeRemaining

    // Calculate score for this card
    const isCorrect = rating === "correct"
    const basePoints = isCorrect ? BASE_POINTS : 0
    const timeBonus = isCorrect ? Math.round(TIME_BONUS_MAX * (timeRemaining / FLASHCARD_TIME_LIMIT)) : 0

    // Update combo
    const newCombo = isCorrect ? score.currentCombo + 1 : 0
    const maxCombo = Math.max(score.maxCombo, newCombo)

    // Calculate combo bonus
    const comboBonus = isCorrect && newCombo > 1 ? Math.round(basePoints * (newCombo * COMBO_MULTIPLIER)) : 0

    // Update total score
    const cardScore = basePoints + timeBonus + comboBonus

    // Save rating
    setRatings((prev) => ({
      ...prev,
      [flashcards[currentIndex]._id]: rating,
    }))

    // Update score
    setScore((prev) => ({
      points: prev.points + basePoints,
      timeBonus: prev.timeBonus + timeBonus,
      comboBonus: prev.comboBonus + comboBonus,
      totalScore: prev.totalScore + cardScore,
      currentCombo: newCombo,
      maxCombo,
      cardsReviewed: prev.cardsReviewed + 1,
      selfRatedCorrect: isCorrect ? prev.selfRatedCorrect + 1 : prev.selfRatedCorrect,
    }))

    // Move to next card or complete challenge
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setFlipped(false)
      setTimeRemaining(FLASHCARD_TIME_LIMIT)
      setTimerActive(true)
    } else {
      completeChallenge()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading flashcards for your weak topics...</h2>
          <Progress value={100} className="w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold">Challenge Completed!</h2>
              <div className="mt-4 text-5xl font-bold">{score.totalScore}</div>
              <p className="text-muted-foreground mt-1">Total Score</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{score.points}</div>
                <p className="text-sm text-muted-foreground">Base Points</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{score.timeBonus}</div>
                <p className="text-sm text-muted-foreground">Time Bonus</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{score.comboBonus}</div>
                <p className="text-sm text-muted-foreground">Combo Bonus</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Cards Reviewed</p>
                    <p className="font-medium">{score.cardsReviewed} cards</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Self-Rated Correct</p>
                    <p className="font-medium">
                      {score.selfRatedCorrect} of {score.cardsReviewed}(
                      {score.cardsReviewed > 0 ? Math.round((score.selfRatedCorrect / score.cardsReviewed) * 100) : 0}%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Max Combo</p>
                    <p className="font-medium">{score.maxCombo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Time per Card</p>
                    <p className="font-medium">
                      {cardTimes.length > 0
                        ? Math.round((cardTimes.reduce((sum, t) => sum + t, 0) / cardTimes.length) * 10) / 10
                        : 0}
                      s
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 p-6">
            <Button className="w-full" onClick={() => (window.location.href = "/dashboard/review")}>
              Return to Dashboard
            </Button>
            <Button variant="outline" className="w-full" onClick={fetchFlashcards}>
              <Flame className="mr-2 h-4 w-4 text-orange-500" />
              Try Another Challenge
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // No flashcards found
  if (flashcards.length === 0) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No flashcards available</h2>
          <p className="mb-4">We couldn&apos;t find any flashcards for your weak topics.</p>
          <Button onClick={() => (window.location.href = "/dashboard/review")}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  // Render current flashcard
  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Flashcard Challenge</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {currentIndex + 1} of {flashcards.length}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Score: {score.totalScore}</span>
            </div>
            {score.currentCombo > 1 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">Combo: x{score.currentCombo}</span>
              </div>
            )}
          </div>
        </div>

        <Progress value={progress} className="mb-4" />

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <span className="font-medium">Time:</span>
          </div>
          <div className={`font-bold text-lg ${timeRemaining <= 5 ? "text-red-500 animate-pulse" : ""}`}>
            {timeRemaining}s
          </div>
        </div>

        <Progress
          value={(timeRemaining / FLASHCARD_TIME_LIMIT) * 100}
          className={`h-2 mb-6 ${timeRemaining <= 5 ? "bg-red-200" : ""}`}
        />

        {/* Flashcard */}
        <div className="relative w-full h-80 perspective-1000">
          {/* Question side */}
          <div
            className={`absolute w-full h-full rounded-xl p-6 flex flex-col justify-center items-center bg-white border-2 border-amber-200 shadow-lg transition-all duration-500 ${
              flipped ? "rotate-y-180 opacity-0 pointer-events-none" : "rotate-y-0 opacity-100 cursor-pointer"
            }`}
            onClick={!flipped ? flipCard : undefined}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">Question</h3>
              <p className="text-xl">{currentCard.question}</p>
            </div>
            <div className="absolute bottom-4 text-sm text-muted-foreground">Click to flip</div>
          </div>

          {/* Answer side */}
          <div
            className={`absolute w-full h-full rounded-xl p-6 flex flex-col bg-blue-50 border-2 border-blue-200 shadow-lg transition-all duration-500 ${
              flipped ? "rotate-y-0 opacity-100" : "rotate-y-180 opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex-1 overflow-auto">
              <h3 className="text-lg font-bold mb-4 text-blue-800">Answer</h3>
              <p className="text-lg whitespace-pre-line">{currentCard.answer}</p>
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <Button variant="destructive" onClick={() => rateCard("incorrect")}>
                I didn&apos;t know this
              </Button>
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => rateCard("correct")}>
                I knew this
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard/review")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Challenge
          </Button>

          {!flipped && (
            <Button onClick={flipCard} className="flex items-center gap-1">
              Flip Card
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        .rotate-y-0 {
          transform: rotateY(0deg);
        }
      `}</style>

      <Toaster position="top-right" />
    </div>
  )
}
