"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Flashcard } from "@/services/api-service"
import { Award, CalendarDays, Clock, TrendingUp } from "lucide-react"
import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ThemeStatisticsProps {
  flashcards: Flashcard[]
}

// Define the time filter type to include "all"
type TimeFilterType = "all" | "day" | "week" | "month" | "quarter";

export default function ThemeStatistics({ flashcards }: ThemeStatisticsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("all")
  const [activeTab, setActiveTab] = useState<string>("categories")

  // Filter flashcards based on time period
  const filteredFlashcards = useMemo(() => {
    if (timeFilter === "all") return flashcards

    const now = new Date()
    const cutoffDate = new Date()

    switch (timeFilter) {
      case "day":
        cutoffDate.setDate(now.getDate() - 1)
        break
      case "week":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      default:
        return flashcards
    }

    return flashcards.filter((card) => {
      // If the card has a lastReviewed date, use it for filtering
      if (card.lastReviewed) {
        const reviewDate = new Date(card.lastReviewed)
        return reviewDate >= cutoffDate
      }

      // If no lastReviewed date, check createdAt
      if (card.createdAt) {
        const createDate = new Date(card.createdAt)
        return createDate >= cutoffDate
      }

      // If neither date exists, include in all time but not in filtered views
      return true
    })
  }, [flashcards, timeFilter])

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; mastery: number }>()

    filteredFlashcards.forEach((card) => {
      const category = card.category || "Uncategorized"
      const existing = stats.get(category) || { count: 0, mastery: 0 }

      stats.set(category, {
        count: existing.count + 1,
        mastery: existing.mastery + (card.mastery || 0),
      })
    })

    return Array.from(stats.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      averageMastery: data.count > 0 ? Math.round(data.mastery / data.count) : 0,
    }))
  }, [filteredFlashcards])

  // Calculate difficulty statistics
  const difficultyStats = useMemo(() => {
    const stats = {
      easy: 0,
      medium: 0,
      hard: 0,
    }

    filteredFlashcards.forEach((card) => {
      if (card.difficulty && stats.hasOwnProperty(card.difficulty)) {
        stats[card.difficulty as keyof typeof stats]++
      } else {
        stats.medium++ // Default to medium if not specified
      }
    })

    return [
      { name: "Easy", value: stats.easy, color: "#10b981" },
      { name: "Medium", value: stats.medium, color: "#6366f1" },
      { name: "Hard", value: stats.hard, color: "#ef4444" },
    ]
  }, [filteredFlashcards])

  // Calculate mastery level distribution
  const masteryStats = useMemo(() => {
    const stats = {
      mastered: 0, // 80-100%
      learning: 0, // 30-79%
      needsReview: 0, // 0-29%
    }

    filteredFlashcards.forEach((card) => {
      const mastery = card.mastery || 0

      if (mastery >= 80) {
        stats.mastered++
      } else if (mastery >= 30) {
        stats.learning++
      } else {
        stats.needsReview++
      }
    })

    return [
      { name: "Mastered", value: stats.mastered, color: "#10b981" },
      { name: "Learning", value: stats.learning, color: "#6366f1" },
      { name: "Needs Review", value: stats.needsReview, color: "#ef4444" },
    ]
  }, [filteredFlashcards])

  // Calculate tag statistics
  const tagStats = useMemo(() => {
    const stats = new Map<string, number>()

    filteredFlashcards.forEach((card) => {
      if (card.tags && Array.isArray(card.tags)) {
        card.tags.forEach((tag) => {
          if (tag) {
            stats.set(tag, (stats.get(tag) || 0) + 1)
          }
        })
      }
    })

    return Array.from(stats.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 tags
  }, [filteredFlashcards])

  // Calculate recent activity statistics - show 10 most recent cards
  const activityStats = useMemo(() => {
    // Get cards with lastReviewed date or updatedAt date (for interaction tracking)
    const reviewedCards = filteredFlashcards
      .filter((card) => card.lastReviewed || card.updatedAt)
      .sort((a, b) => {
        // Use the most recent date between lastReviewed and updatedAt
        const dateA = new Date(a.lastReviewed || a.updatedAt || 0)
        const dateB = new Date(b.lastReviewed || b.updatedAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 10) // Most recent 10 cards

    return reviewedCards
  }, [filteredFlashcards])

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalCards = filteredFlashcards.length
    const reviewedCards = filteredFlashcards.filter((card) => card.reviewCount && card.reviewCount > 0).length
    const totalMastery = filteredFlashcards.reduce((sum, card) => sum + (card.mastery || 0), 0)
    const averageMastery = totalCards > 0 ? Math.round(totalMastery / totalCards) : 0
    const needsReviewCount = filteredFlashcards.filter(
      (card) => (card.mastery || 0) < 30 && card.reviewCount && card.reviewCount > 0,
    ).length

    return {
      totalCards,
      reviewedCards,
      averageMastery,
      needsReviewCount,
    }
  }, [filteredFlashcards])

  // Format date for display
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Flashcard Statistics</h2>
          <p className="text-slate-600 dark:text-slate-400">Track your progress and identify areas for improvement</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <Select value={timeFilter} onValueChange={(value: TimeFilterType) => setTimeFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.totalCards}</div>
            <p className="text-xs text-slate-500 mt-1">
              {timeFilter === "all" ? "All time" : `In the selected time period`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Cards Studied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.reviewedCards}</div>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((overallStats.reviewedCards / Math.max(1, overallStats.totalCards)) * 100)}% of total cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Average Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.averageMastery}%</div>
            <div className="w-full h-2 bg-slate-200 rounded-full mt-2">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${overallStats.averageMastery}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.needsReviewCount}</div>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((overallStats.needsReviewCount / Math.max(1, overallStats.totalCards)) * 100)}% of total cards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="mastery">Mastery</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Cards and mastery levels by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryStats.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No data available for the selected time period</div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={categoryStats} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Number of Cards" fill="#6366f1" />
                    <Bar yAxisId="right" dataKey="averageMastery" name="Average Mastery %" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Difficulty Distribution</CardTitle>
              <CardDescription>Breakdown of cards by difficulty level</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8">
              {difficultyStats.reduce((sum, item) => sum + item.value, 0) === 0 ? (
                <div className="text-center py-8 text-slate-500">No data available for the selected time period</div>
              ) : (
                <>
                  <div className="w-64 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={difficultyStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {difficultyStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} cards`, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3">
                    {difficultyStats.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium">{item.name}:</span>
                        <span>{item.value} cards</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mastery" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mastery Level Distribution</CardTitle>
              <CardDescription>Breakdown of cards by mastery level</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8">
              {masteryStats.reduce((sum, item) => sum + item.value, 0) === 0 ? (
                <div className="text-center py-8 text-slate-500">No data available for the selected time period</div>
              ) : (
                <>
                  <div className="w-64 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={masteryStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {masteryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} cards`, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3">
                    {masteryStats.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium">{item.name}:</span>
                        <span>{item.value} cards</span>
                        <span className="text-xs text-slate-500">
                          {item.name === "Mastered"
                            ? "(80-100% mastery)"
                            : item.name === "Learning"
                              ? "(30-79% mastery)"
                              : "(0-29% mastery)"}
                        </span>
                      </div>
                    ))}
                    <div className="mt-4 text-sm text-slate-600">
                      <p>
                        <strong>Mastered cards</strong> (80-100%): You know these cards well and should review them
                        occasionally.
                      </p>
                      <p>
                        <strong>Learning cards</strong> (30-79%): You&apos;re making progress with these cards but need more
                        practice.
                      </p>
                      <p>
                        <strong>Needs Review cards</strong> (0-29%): These cards require immediate attention and
                        frequent review.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Tags</CardTitle>
              <CardDescription>Most frequently used tags in your flashcards</CardDescription>
            </CardHeader>
            <CardContent>
              {tagStats.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No tags available for the selected time period</div>
              ) : (
                <>
                  <div className="mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={tagStats} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Number of Cards" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tagStats.map((tag) => (
                      <Badge key={tag.name} variant="outline" className="flex items-center gap-1 py-1.5">
                        <span>{tag.name}</span>
                        <span className="ml-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full px-1.5 py-0.5 text-xs">
                          {tag.count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your 10 most recently updated or reviewed flashcards</CardDescription>
            </CardHeader>
            <CardContent>
              {activityStats.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No activity data available for the selected time period
                </div>
              ) : (
                <div className="space-y-4">
                  {activityStats.map((card) => (
                    <div key={card.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-slate-800 dark:text-white">{card.question}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{card.answer}</p>
                        </div>
                        <Badge
                          variant={card.mastery >= 80 ? "default" : card.mastery >= 30 ? "secondary" : "destructive"}
                        >
                          {card.mastery}% Mastery
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-slate-100 text-slate-700">
                          {card.category || "Uncategorized"}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {card.lastReviewed
                            ? `Last reviewed: ${formatDate(card.lastReviewed)}`
                            : `Last updated: ${formatDate(card.updatedAt)}`}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {card.reviewCount} reviews
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {card.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
