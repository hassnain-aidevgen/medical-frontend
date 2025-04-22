"use client"

import { FlashcardChallenge } from "@/components/flashcard-challenge"
import { Button, type ButtonProps } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { useState } from "react"
import { Toaster } from "react-hot-toast"

interface FlashcardChallengeButtonProps extends ButtonProps {
    label?: string
}

export function FlashcardChallengeButton({
    label = "Daily Flashcards",
    ...buttonProps
}: FlashcardChallengeButtonProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false)

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className={cn("bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2", buttonProps.className)}
                {...buttonProps}
            >
                <BookOpen className="h-4 w-4" />
                {label}
            </Button>

            <FlashcardChallenge isOpen={isOpen} onClose={() => setIsOpen(false)} />

            {/* Add Toaster component for toast notifications */}
            <Toaster position="top-center" />
        </>
    )
}

// Helper function to merge class names
function cn(...classes: (string | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}
