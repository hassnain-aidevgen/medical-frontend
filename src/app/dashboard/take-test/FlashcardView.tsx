// components/FlashcardView.tsx
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { X, BookOpen, Tag, Loader2 } from "lucide-react"

type FlashcardViewProps = {
  flashcardId: string
  onClose: () => void
}

type Flashcard = {
  _id: string
  question: string
  answer: string
  hint?: string
  category: string
  tags: string[]
  difficulty: string
  reviewCount: number
  mastery: number
}

const FlashcardView = ({ flashcardId, onClose }: FlashcardViewProps) => {
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  
  useEffect(() => {
    const fetchFlashcard = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await axios.get(
          `https://medical-backend-3eek.onrender.com/api/v2/flashcards/${flashcardId}`
        )
        
        setFlashcard(response.data)
      } catch (error) {
        console.error("Error fetching flashcard:", error)
        setError("Unable to load flashcard. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (flashcardId) {
      fetchFlashcard()
    }
  }, [flashcardId])
  
  const toggleFlip = () => {
    setIsFlipped(!isFlipped)
  }
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'hard':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-amber-500 mr-2" />
          <h3 className="font-medium">Flashcard Review</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">
            {error}
          </div>
        ) : flashcard ? (
          <div 
            className={`relative perspective-1000 w-full h-64 cursor-pointer`}
            onClick={toggleFlip}
          >
            {/* Front side - Question */}
            <div 
              className={`absolute inset-0 backface-hidden transition-transform duration-500 ${
                isFlipped ? 'rotate-y-180' : 'rotate-y-0'
              }`}
            >
              <Card className="w-full h-full flex flex-col overflow-hidden">
                <CardContent className="p-5 flex-1 flex flex-col justify-center text-center overflow-auto">
                  <p className="text-lg leading-relaxed">
                    {flashcard.question}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-3 pt-3 bg-amber-50">
                  <p className="text-amber-700 text-sm font-medium">
                    Click to flip and see answer
                  </p>
                </CardFooter>
              </Card>
            </div>
            
            {/* Back side - Answer */}
            <div 
              className={`absolute inset-0 backface-hidden transition-transform duration-500 ${
                isFlipped ? 'rotate-y-0' : 'rotate-y-180'
              }`}
            >
              <Card className="w-full h-full flex flex-col overflow-hidden">
                <CardContent className="p-5 flex-1 flex flex-col justify-center text-center overflow-auto bg-green-50">
                  <p className="text-lg font-medium text-green-700 leading-relaxed">
                    {flashcard.answer}
                  </p>
                  
                  {flashcard.hint && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                      <p className="font-medium mb-1">Hint:</p>
                      <p>{flashcard.hint}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 border-t p-3 pt-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(flashcard.difficulty)}`}>
                    {flashcard.difficulty}
                  </span>
                  
                  {flashcard.tags && flashcard.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            No flashcard data available
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t">
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  )
}

export default FlashcardView