"use client"
import ThemeStatistics from "@/components/theme-statistics"
import type { Flashcard } from "@/services/api-service"

interface StatsTabProps {
  flashcards: Flashcard[]
}

export default function StatsTab({ flashcards }: StatsTabProps) {
  return <ThemeStatistics flashcards={flashcards} />
}
