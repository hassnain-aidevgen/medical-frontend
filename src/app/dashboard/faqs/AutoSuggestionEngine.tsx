"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuggestionMatch {
  id: string
  title: string
  content: string
  keywords: string[]
  category: string
}

// Predefined list of common issues and their answers
const suggestionDatabase: SuggestionMatch[] = [
  {
    id: "error-simulation",
    title: "Simulation Error Troubleshooting",
    content:
      "If you're experiencing a simulation error, try refreshing your browser and clearing cache. Most simulation errors are resolved by ensuring your browser is up-to-date and you have a stable internet connection with at least 5 Mbps download speed.",
    keywords: ["simulation error", "error starting simulation", "simulation crash", "simulation not working"],
    category: "Technical",
  },
  {
    id: "payment-declined",
    title: "Payment Declined Solutions",
    content:
      "If your payment was declined, please verify your card details and ensure you have sufficient funds. Some banks may block transactions for security reasons. If the issue persists, try using a different payment method or contact your bank to authorize the transaction.",
    keywords: ["payment declined", "card declined", "payment failed", "can't pay", "payment error"],
    category: "Payments",
  },
  {
    id: "mentor-specialty",
    title: "Finding Specialty Mentors",
    content:
      "To find mentors in specialized fields like pediatric neurology or cardiothoracic surgery, use the advanced filters on the mentor search page. You can filter by specialty, sub-specialty, years of experience, and institution type to find the perfect match for your needs.",
    keywords: [
      "specialty mentor",
      "specialized mentor",
      "find specific mentor",
      "pediatric",
      "neurology",
      "cardiology",
    ],
    category: "Mentorship",
  },
  {
    id: "session-recording",
    title: "Session Recording Policy",
    content:
      "Mentorship sessions are not recorded by default to maintain confidentiality. However, if both you and your mentor agree, sessions can be recorded for educational purposes. To request a recording, discuss this with your mentor before the session starts and ensure both parties provide consent.",
    keywords: ["record session", "recording", "save session", "session video", "replay session"],
    category: "Sessions",
  },
  {
    id: "connection-issues",
    title: "Fixing Video Connection Issues",
    content:
      "If you're experiencing video connection issues, try: 1) Switching to a wired internet connection, 2) Closing other applications using bandwidth, 3) Restarting your device, 4) Using headphones to prevent audio feedback, and 5) Ensuring your browser has permission to access your camera and microphone.",
    keywords: [
      "connection issue",
      "video problem",
      "audio problem",
      "can't connect",
      "poor connection",
      "video quality",
    ],
    category: "Technical",
  },
]

interface AutoSuggestionEngineProps {
  searchQuery: string
}

export default function AutoSuggestionEngine({ searchQuery }: AutoSuggestionEngineProps) {
  const [suggestions, setSuggestions] = useState<SuggestionMatch[]>([])
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())

  // Find matching suggestions based on search query
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    const normalizedQuery = searchQuery.toLowerCase().trim()

    // Find matches in the suggestion database
    const matches = suggestionDatabase.filter((suggestion) => {
      // Skip dismissed suggestions
      if (dismissedSuggestions.has(suggestion.id)) return false

      // Check if any keyword matches
      return suggestion.keywords.some(
        (keyword) => keyword.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(keyword.toLowerCase()),
      )
    })

    // Limit to top 2 matches
    setSuggestions(matches.slice(0, 2))
  }, [searchQuery, dismissedSuggestions])

  // Dismiss a suggestion
  const dismissSuggestion = (id: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, id]))
  }

  // If no suggestions or query too short, don't render anything
  if (suggestions.length === 0 || searchQuery.length < 3) {
    return null
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span>AI-suggested answers based on your search</span>
      </div>

      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="relative border-l-4 border-l-blue-500">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => dismissSuggestion(suggestion.id)}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader className="pb-2">
            <div className="flex justify-between items-start pr-6">
              <div>
                <CardTitle className="text-base">{suggestion.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  <Badge variant="outline" className="text-xs font-normal">
                    {suggestion.category}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="text-sm">
            <p>{suggestion.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

