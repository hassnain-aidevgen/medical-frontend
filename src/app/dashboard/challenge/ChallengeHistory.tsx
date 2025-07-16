"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react"

// Define the shape of a session object with the new 'correctAnswer' field
interface ChallengeSession {
  _id: string
  status: "in_progress" | "completed"
  createdAt: string
  questions: {
    userAnswer: string | null
    isCorrect: boolean | null
    correctAnswer: string // Added this field
  }[]
  metrics?: {
    score?: number
  }
}

interface ChallengeHistoryProps {
  userId: string | null
  onBack?: () => void
}

export default function ChallengeHistory({ userId, onBack }: ChallengeHistoryProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<ChallengeSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const response = await axios.get(
          `https://medical-backend-3eek.onrender.com/api/challenge/history?userId=${userId}`
        )
        if (response.data.success) {
          setSessions(response.data.sessions)
        }
      } catch (error) {
        console.error("Error fetching challenge history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [userId])

  const handleToggleDetails = (sessionId: string) => {
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId)
  }

  const handleResume = (sessionId: string) => {
    router.push(`/dashboard/challenge/${sessionId}`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Challenge History</CardTitle>
          <CardDescription>Review your past challenges.</CardDescription>
        </div>
        {onBack ? (
            <Button variant="ghost" onClick={onBack}>Back to Results</Button>
        ) : (
            <History className="h-5 w-5 text-gray-500" />
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] w-full pr-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session._id} className="border p-3 rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       {session.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score: {session.metrics?.score ?? "N/A"}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleDetails(session._id)}>
                            Details
                            {expandedSessionId === session._id ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                        </Button>
                        {session.status === 'in_progress' && (
                            <Button size="sm" onClick={() => handleResume(session._id)}>
                            Resume
                            </Button>
                        )}
                    </div>
                  </div>
                  {expandedSessionId === session._id && (
                     <div className="mt-4 pt-3 border-t space-y-3">
                        <h4 className="font-semibold text-sm mb-2">Question Breakdown:</h4>
                        {session.questions.map((q, index) => (
                            <div key={index} className="text-xs p-2 bg-muted/50 rounded-md">
                               <p className="font-bold mb-1">Q{index + 1}</p>
                               <div className="flex items-center gap-2">
                                  {q.isCorrect ? <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0"/> : <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                                  <p><span className="font-medium">Your Answer:</span> {q.userAnswer ?? 'Not Answered'}</p>
                               </div>
                               {!q.isCorrect && (
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0"/>
                                    <p><span className="font-medium">Correct Answer:</span> {q.correctAnswer}</p>
                                </div>
                               )}
                            </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No challenge history found.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}