"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { BookOpen, Lightbulb, BookMarked, ArrowRight } from 'lucide-react'
import DailyChallengeButton from '@/components/daily-challenge-button'
import ExamSimulation from "@/components/exam-simulation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Recommendation {
  questionText: string
  correctAnswer: string
  topic: string
}

interface TopicGroup {
  topic: string
  count: number
  questions: Recommendation[]
}

export default function QuestionsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"topics" | "daily">("topics")

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true)
      try {
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          console.log("No user ID found in localStorage")
          setIsLoading(false)
          return
        }

        const { data } = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/recommendations3/${userId}`)
        
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations)
          
          // Group recommendations by topic
          const groupedByTopic = data.recommendations.reduce((acc: Record<string, Recommendation[]>, item: Recommendation) => {
            const topic = item.topic || "Unknown Topic"
            if (!acc[topic]) {
              acc[topic] = []
            }
            acc[topic].push(item)
            return acc
          }, {})
          
          // Convert to array of topic groups
          const topicGroupsArray = Object.entries(groupedByTopic).map(([topic, questions]) => ({
            topic,
            count: (questions as Recommendation[]).length,
            questions: questions as Recommendation[]
          }))
          
          // Sort by count (most questions first)
          topicGroupsArray.sort((a, b) => b.count - a.count)
          
          setTopicGroups(topicGroupsArray)
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  // Function to get a study resource suggestion based on topic
  const getStudyResourceSuggestion = (topic: string) => {
    // This is a placeholder - in a real app, you would have a mapping of topics to actual resources
    const suggestions = [
      "Review the chapter on this topic in your textbook",
      "Watch video lectures on this subject",
      "Practice with flashcards focused on this area",
      "Join a study group discussion on this topic",
      "Complete practice questions in this subject area"
    ]
    
    // Use the topic string to generate a consistent but seemingly random suggestion
    const index = topic.length % suggestions.length
    return suggestions[index]
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="topics" className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="topics">Topic Recommendations</TabsTrigger>
            <TabsTrigger value="daily">Daily Challenge</TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="mt-0">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Topic Recommendations</h2>
              <p className="text-muted-foreground mb-8">
                Based on your recent test performance, we recommend focusing on these topics to improve your knowledge.
              </p>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p>Loading recommendations...</p>
                </div>
              ) : topicGroups.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No recommendations yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      Complete more tests to get personalized topic recommendations based on your performance.
                    </p>
                    <Button onClick={() => window.location.href = "/dashboard/create-test"}>
                      Take a Test
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {topicGroups.map((group, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="flex items-center">
                              <BookMarked className="mr-2 h-5 w-5 text-primary" />
                              {group.topic}
                            </CardTitle>
                            <CardDescription>
                              You missed {group.count} {group.count === 1 ? 'question' : 'questions'} in this topic
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-primary/10">
                            Priority {index + 1}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <h4 className="font-medium flex items-center text-amber-800 dark:text-amber-300 mb-2">
                              <Lightbulb className="h-4 w-4 mr-2" />
                              Study Recommendation
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                              {getStudyResourceSuggestion(group.topic)}
                            </p>
                          </div>
                          
                          <h4 className="font-medium">Sample Questions You Missed:</h4>
                          <ul className="space-y-3">
                            {group.questions.slice(0, 2).map((question, qIndex) => (
                              <li key={qIndex} className="bg-muted/50 p-3 rounded-lg">
                                <p className="font-medium text-sm">{question.questionText}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Correct answer: {question.correctAnswer}
                                </p>
                              </li>
                            ))}
                          </ul>
                          
                          <div className="flex justify-between items-center pt-2">
                            <Button variant="outline" size="sm" className="text-xs">
                              View Study Materials
                            </Button>
                            <Button size="sm" className="text-xs">
                              Practice This Topic <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick Test Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Quick Test</h2>
              <ExamSimulation />
            </div>
          </TabsContent>

          <TabsContent value="daily" className="mt-0">
            <div className="flex flex-col items-center justify-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-center">
                Daily Challenge
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Auto-generate 10 questions based on performance and weaknesses.
              </p>
              <DailyChallengeButton />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}