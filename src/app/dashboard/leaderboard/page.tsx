"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronUp, User } from "lucide-react"
import { useEffect, useState } from "react"

type Participant = {
  id: string
  name: string
  score: number
  avatar: string
  totalTime: number
}

export default function LeaderboardPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expandedList, setExpandedList] = useState(false)

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch("https://medical-backend-loj4.onrender.com/api/test/leaderboard")
        const data = await response.json()
        console.log(data);
        setParticipants(data)
      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
      }
    }

    fetchParticipants()
  }, [])

  // Determine how many participants to show based on expanded state
  const displayedParticipants = expandedList ? participants : participants.slice(0, 4)

  const renderParticipant = (participant: Participant, index: number) => (
    <motion.div
      key={participant.id}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex items-center p-3 sm:p-4 border-b border-gray-200 last:border-b-0 hover:bg-teal-50 transition-colors"
    >
      <span className="text-base sm:text-lg font-semibold text-gray-500 w-6 sm:w-8">{index + 1}</span>
      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 mx-2 sm:mx-4">
        <AvatarImage src={participant.avatar} alt={participant.name} />
        <AvatarFallback>
          <User className="w-6 h-6" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <p className="font-semibold text-teal-800 text-sm sm:text-base">{participant.name}</p>
        <p className="text-xs sm:text-sm text-gray-500">{participant.score} points</p>
      </div>
      {
        participant.totalTime && (
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-gray-600">Time Spent:</span>
            {
              !isNaN(participant.totalTime) && Math.floor(participant.totalTime / 60)}m {participant.totalTime % 60
            }s
          </div>
        )
      }
    </motion.div>
  )

  return (
    <div className="max-h-[85dvh] overflow-y-auto rounded-md bg-gradient-to-br from-gray-100/60 via-amber-100/40 to-gray-100/60 border border-slate-200 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-8 text-center text-teal-800">Leaderboard</h1>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <AnimatePresence mode="wait">
              {displayedParticipants.map((participant, index) => renderParticipant(participant, index))}
            </AnimatePresence>
          </motion.div>
        </Card>

        {participants.length > 4 && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => setExpandedList(!expandedList)}
              variant="outline"
              className="bg-sky-500 hover:bg-sky-600 text-neutral-200 hover:text-white text-sm sm:text-base py-1 px-3 sm:py-2 sm:px-4"
            >
              {expandedList ? (
                <>
                  Show Less <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Show More <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

