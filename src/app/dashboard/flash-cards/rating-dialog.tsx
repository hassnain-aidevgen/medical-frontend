"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { motion } from "framer-motion"
import { Star, ThumbsUp } from 'lucide-react'
import { useState } from "react"
import toast from "react-hot-toast"

interface RatingDialogProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    cardsReviewed: number
    sessionDuration?: number // in seconds
}

export default function RatingDialog({
    isOpen,
    onClose,
    userId,
    cardsReviewed,
    sessionDuration,
}: RatingDialogProps) {
    const [rating, setRating] = useState<number>(0)
    const [hoveredRating, setHoveredRating] = useState<number>(0)
    const [feedback, setFeedback] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

    const handleRatingClick = (value: number) => {
        setRating(value)
    }

    const handleMouseEnter = (value: number) => {
        setHoveredRating(value)
    }

    const handleMouseLeave = () => {
        setHoveredRating(0)
    }

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating before submitting")
            return
        }

        setIsSubmitting(true)

        try {
            await axios.post("https://medical-backend-loj4.onrender.com/api/ratings", {
                userId,
                rating,
                feedback: feedback.trim() || undefined,
                cardsReviewed,
                sessionDuration,
                date: new Date().toISOString(),
            })

            setIsSubmitted(true)
            toast.success("Thank you for your feedback!")

            // Close dialog after a short delay to show the success animation
            setTimeout(() => {
                onClose()
                setRating(0)
                setFeedback("")
                setIsSubmitted(false)
            }, 2000)
        } catch (error) {
            console.error("Error submitting rating:", error)
            toast.error("Failed to submit rating. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = () => {
        onClose()
        setRating(0)
        setFeedback("")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                {isSubmitted ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="bg-green-100 dark:bg-green-900 rounded-full p-6 mb-6"
                        >
                            <ThumbsUp className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </motion.div>
                        <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
                        <p className="text-center text-slate-600 dark:text-slate-400">
                            Your feedback helps us improve the flashcard experience.
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Rate Your Review Session</DialogTitle>
                            <DialogDescription>
                                How effective was this review session? Your feedback helps us improve.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            <div className="flex justify-center mb-8">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <motion.button
                                        key={value}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleRatingClick(value)}
                                        onMouseEnter={() => handleMouseEnter(value)}
                                        onMouseLeave={handleMouseLeave}
                                        className="mx-2 focus:outline-none"
                                    >
                                        <Star
                                            className={`h-10 w-10 ${value <= (hoveredRating || rating)
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-slate-300 dark:text-slate-600"
                                                } transition-colors duration-200`}
                                        />
                                    </motion.button>
                                ))}
                            </div>

                            <div className="text-center mb-6">
                                <span className="text-lg font-medium">
                                    {rating === 1 && "Needs Improvement"}
                                    {rating === 2 && "Fair"}
                                    {rating === 3 && "Good"}
                                    {rating === 4 && "Very Good"}
                                    {rating === 5 && "Excellent"}
                                    {rating === 0 && "Select a rating"}
                                </span>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="feedback" className="block text-sm font-medium mb-2">
                                    Additional Feedback (Optional)
                                </label>
                                <Textarea
                                    id="feedback"
                                    placeholder="Share your thoughts about this review session..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                <p>You reviewed {cardsReviewed} cards in this session.</p>
                                {sessionDuration && (
                                    <p>
                                        Session duration: {Math.floor(sessionDuration / 60)}m {sessionDuration % 60}s
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="flex justify-between">
                            <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
                                Skip
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                                {isSubmitting ? "Submitting..." : "Submit Feedback"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
