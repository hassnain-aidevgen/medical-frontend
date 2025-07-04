"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"
import { BarChart, PieChart, LineChart, Download, RefreshCw, PlusCircle, Info } from "lucide-react"
// import StatisticalChart from "./StatisticalChart"
import StatisticalChart from "./statisticalChart"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Define types
interface DifficultTopic {
  topic: string
  difficultyScore: number
  specialty: string
  subjectId: string
  subsectionId: string
  correctCount: number
  incorrectCount: number
  totalCount: number
}

interface PerformanceStats {
  averageScore: number
  improvementRate: number
  topMistakes: Array<{question: string, attempts: number}>
  conceptGaps: Array<{concept: string, frequency: number}>
  studyTimeDistribution: Array<{day: string, hours: number}>
  compareToPeers: {
    percentile: number
    averagePeerScore: number
  }
}

interface VisualSummary {
  id: string
  topic: string
  summaryType: "performance" | "improvement" | "comparison" | "conceptMap" | "mistakes"
  chartData: any
  insights: string[]
  createdAt: string
  specialty: string
}

export function StatisticalVisualSummaries() {
  const [difficultTopics, setDifficultTopics] = useState<DifficultTopic[]>([])
  const [visualSummaries, setVisualSummaries] = useState<VisualSummary[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [generatingVisual, setGeneratingVisual] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("topics")
  const [openDetailDialog, setOpenDetailDialog] = useState(false)
  const [selectedVisual, setSelectedVisual] = useState<VisualSummary | null>(null)
  const [performanceData, setPerformanceData] = useState<Record<string, PerformanceStats>>({})

  useEffect(() => {
    fetchWeakTopics()
    fetchExistingVisuals()
  }, [])

  const fetchWeakTopics = async () => {
    try {
      setLoadingTopics(true)
      const userId = localStorage.getItem("Medical_User_Id")
      
      // Using the weak-topics-flashcards endpoint to get weak topics
      const response = await axios.get(
        `https://medical-backend-3eek.onrender.com/api/reviews/weak-topics-flashcards/${userId}?detailed=true`
      )
      
      // Transform the data format to match our DifficultTopic interface
      const weakTopicsData = response.data?.weakTopics || []
      console.log("Fetched weak topics:", weakTopicsData)
      
      const formattedTopics: DifficultTopic[] = weakTopicsData.map((topic: any) => ({
        topic: topic.subsectionName,
        specialty: topic.subjectName,
        difficultyScore: calculateDifficultyScore(topic.correctCount, topic.totalCount),
        subjectId: topic.subjectId,
        subsectionId: topic.subsectionId,
        correctCount: topic.correctCount,
        incorrectCount: topic.incorrectCount,
        totalCount: topic.totalCount
      }))
      
      setDifficultTopics(formattedTopics)
      
      // Also fetch performance stats for each topic
      if (userId) {
        fetchPerformanceStats(formattedTopics, userId)
      } else {
        console.error("User ID is null. Unable to fetch performance stats.")
        toast.error("Failed to fetch performance stats due to missing user ID.")
      }
    } catch (error) {
      console.error("Error fetching weak topics:", error)
      // toast.error("Failed to load weak topics")
      
      // Set some mock data if the API fails for development purposes
      const mockTopics = [
        {
          topic: "Cardiovascular System",
          specialty: "Anatomy",
          difficultyScore: 4.2,
          subjectId: "anat101",
          subsectionId: "cardio",
          correctCount: 3,
          incorrectCount: 7, 
          totalCount: 10
        },
        {
          topic: "Neuroanatomy",
          specialty: "Neurology",
          difficultyScore: 4.7,
          subjectId: "neuro101",
          subsectionId: "neuroanat",
          correctCount: 2,
          incorrectCount: 8,
          totalCount: 10
        },
        {
          topic: "Pharmacokinetics",
          specialty: "Pharmacology",
          difficultyScore: 3.9,
          subjectId: "pharm101",
          subsectionId: "kinetics",
          correctCount: 4,
          incorrectCount: 6,
          totalCount: 10
        },
        {
          topic: "Acid-Base Balance",
          specialty: "Biochemistry",
          difficultyScore: 4.1,
          subjectId: "biochem101",
          subsectionId: "acidbase",
          correctCount: 3,
          incorrectCount: 6,
          totalCount: 9
        }
      ]
      
      setDifficultTopics(mockTopics)
      
      // Generate mock performance data
      const mockPerformanceData: Record<string, PerformanceStats> = {}
      
      mockTopics.forEach(topic => {
        mockPerformanceData[topic.topic] = generateMockPerformanceStats(topic)
      })
      
      setPerformanceData(mockPerformanceData)
    } finally {
      setLoadingTopics(false)
    }
  }
  
  const fetchPerformanceStats = async (topics: DifficultTopic[], userId: string) => {
    const statsData: Record<string, PerformanceStats> = {}
    
    for (const topic of topics) {
      try {
        const response = await axios.get(
          `https://medical-backend-3eek.onrender.com/api/reviews/topic-stats/${userId}/${topic.subjectId}/${topic.subsectionId}`
        )
        
        if (response.data?.stats) {
          statsData[topic.topic] = response.data.stats
        } else {
          // If no stats returned, generate mock data
          statsData[topic.topic] = generateMockPerformanceStats(topic)
        }
      } catch (error) {
        console.warn(`Error fetching stats for ${topic.topic}:`, error)
        statsData[topic.topic] = generateMockPerformanceStats(topic)
      }
    }
    
    setPerformanceData(statsData)
  }
  
  const generateMockPerformanceStats = (topic: DifficultTopic): PerformanceStats => {
    const accuracy = topic.correctCount / topic.totalCount
    
    return {
      averageScore: Math.round(accuracy * 100) / 100,
      improvementRate: Math.random() * 0.2 - 0.1, // Between -10% and +10%
      topMistakes: [
        { question: `${topic.topic} concept fundamentals`, attempts: Math.floor(Math.random() * 5) + 3 },
        { question: `${topic.topic} application in clinical scenarios`, attempts: Math.floor(Math.random() * 4) + 2 },
        { question: `${topic.topic} relationships with other systems`, attempts: Math.floor(Math.random() * 3) + 1 }
      ],
      conceptGaps: [
        { concept: `${topic.topic} core principles`, frequency: Math.floor(Math.random() * 5) + 5 },
        { concept: `${topic.topic} integrative understanding`, frequency: Math.floor(Math.random() * 5) + 3 },
        { concept: `${topic.topic} advanced applications`, frequency: Math.floor(Math.random() * 5) + 2 }
      ],
      studyTimeDistribution: [
        { day: "Monday", hours: Math.random() * 2 },
        { day: "Tuesday", hours: Math.random() * 2 },
        { day: "Wednesday", hours: Math.random() * 2 },
        { day: "Thursday", hours: Math.random() * 2 },
        { day: "Friday", hours: Math.random() * 2 },
        { day: "Saturday", hours: Math.random() * 3 },
        { day: "Sunday", hours: Math.random() * 3 }
      ],
      compareToPeers: {
        percentile: Math.round(accuracy * 100) - Math.floor(Math.random() * 10),
        averagePeerScore: 0.7 + Math.random() * 0.2
      }
    }
  }
  
  const fetchExistingVisuals = async () => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await axios.get(
        `https://medical-backend-3eek.onrender.com/api/reviews/visual-summaries/${userId}`
      )
      
      const visuals = response.data?.visualSummaries || []
      setVisualSummaries(visuals)
    } catch (error) {
      console.error("Error fetching existing visual summaries:", error)
      // Don't show an error toast here, as this is not critical
    }
  }
  
  const calculateDifficultyScore = (correct: number, total: number): number => {
    if (total === 0) return 3.0 // Default score if no attempts
    const incorrectRatio = (total - correct) / total
    return Math.min(5, Math.max(1, incorrectRatio * 5))
  }
  
  const determineSummaryType = (topic: string, stats: PerformanceStats): "performance" | "improvement" | "comparison" | "conceptMap" | "mistakes" => {
    // Logic to determine the best visualization type based on the stats
    
    if (stats.improvementRate < -0.05) {
      // If improvement is negative, focus on improvement
      return "improvement"
    } else if (stats.topMistakes.length > 0 && stats.topMistakes[0].attempts > 3) {
      // If there are frequent mistakes, focus on those
      return "mistakes"
    } else if (stats.compareToPeers.percentile < 40) {
      // If below average compared to peers, show comparison
      return "comparison"
    } else if (stats.conceptGaps.length > 0 && stats.conceptGaps[0].frequency > 4) {
      // If significant concept gaps, show concept map
      return "conceptMap"
    } else {
      // Default to overall performance
      return "performance"
    }
  }

  const generateVisualSummary = async (topic: DifficultTopic) => {
    try {
      setGeneratingVisual(topic.topic)
      setSelectedTopic(topic.topic)
      
      // First check if we already have a visual for this topic
      const existingVisual = visualSummaries.find(v => v.topic === topic.topic)
      if (existingVisual) {
        setSelectedVisual(existingVisual)
        setOpenDetailDialog(true)
        setGeneratingVisual(null)
        return
      }
      
      // Get stats for this topic
      const stats = performanceData[topic.topic] || generateMockPerformanceStats(topic)
      
      // Determine the type of summary to create
      const summaryType = determineSummaryType(topic.topic, stats)
      
      // Generate insights based on the stats
      const insights = generateInsights(topic, stats, summaryType)
      
      // Chart data depends on the summary type
      const chartData = generateChartData(topic, stats, summaryType)
      
      // Create a new visual summary
      const newVisualSummary: VisualSummary = {
        id: `visual-${Date.now()}`,
        topic: topic.topic,
        summaryType,
        chartData,
        insights,
        createdAt: new Date().toISOString(),
        specialty: topic.specialty
      }
      
      // Save to backend database if available
      const userId = localStorage.getItem("Medical_User_Id")
      try {
        await axios.post(
          `https://medical-backend-3eek.onrender.com/api/reviews/visual-summaries/save`,
          {
            userId,
            visualSummary: newVisualSummary
          }
        )
      } catch (saveError) {
        console.warn("Failed to save to backend, continuing with local state only", saveError)
      }
      
      // Update state
      setVisualSummaries(prev => [...prev, newVisualSummary])
      setSelectedVisual(newVisualSummary)
      setOpenDetailDialog(true)
      toast.success(`Visual summary for ${topic.topic} generated!`)
      
    } catch (error) {
      console.error("Error generating visual summary:", error)
      toast.error("Failed to generate visual summary")
    } finally {
      setGeneratingVisual(null)
    }
  }
  
  const generateInsights = (topic: DifficultTopic, stats: PerformanceStats, summaryType: string): string[] => {
    const insights: string[] = []
    const accuracy = topic.correctCount / topic.totalCount
    
    switch (summaryType) {
      case "performance":
        insights.push(`Your overall performance in ${topic.topic} is ${accuracy < 0.6 ? 'below average' : 'improving but still needs work'}.`)
        insights.push(`You've answered ${topic.correctCount} questions correctly out of ${topic.totalCount} attempts.`)
        if (stats.studyTimeDistribution.some(day => day.hours > 1.5)) {
          insights.push(`Your study time is well-distributed, but you might benefit from more focused sessions.`)
        } else {
          insights.push(`Consider increasing your study time for this topic to improve retention.`)
        }
        break
        
      case "improvement":
        insights.push(`Your performance in ${topic.topic} has ${stats.improvementRate < 0 ? 'decreased' : 'increased'} by ${Math.abs(Math.round(stats.improvementRate * 100))}% recently.`)
        insights.push(`Focus on strengthening your understanding of core concepts before moving to advanced applications.`)
        insights.push(`Try different study methods like spaced repetition to improve retention.`)
        break
        
      case "comparison":
        insights.push(`You're currently in the ${stats.compareToPeers.percentile}th percentile compared to your peers in ${topic.topic}.`)
        insights.push(`The average score among your peers is ${Math.round(stats.compareToPeers.averagePeerScore * 100)}%, compared to your ${Math.round(accuracy * 100)}%.`)
        insights.push(`Focus on the specific areas where your peers are performing better to catch up.`)
        break
        
      case "conceptMap":
        const weakestConcept = stats.conceptGaps[0].concept
        insights.push(`You're struggling most with "${weakestConcept}" in ${topic.topic}.`)
        insights.push(`This concept is foundational and affects understanding of related topics.`)
        insights.push(`Targeted study focusing on this concept could significantly improve your overall performance.`)
        break
        
      case "mistakes":
        const topMistake = stats.topMistakes[0].question
        insights.push(`You frequently make mistakes on questions about "${topMistake}".`)
        insights.push(`This indicates a potential gap in your understanding of this specific area.`)
        insights.push(`Review your previous answers and create targeted flashcards for this concept.`)
        break
    }
    
    return insights
  }
  
  const generateChartData = (topic: DifficultTopic, stats: PerformanceStats, summaryType: string): any => {
    // Generate appropriate chart data based on summary type
    switch (summaryType) {
      case "performance":
        return {
          type: "pie",
          data: [
            { name: "Correct", value: topic.correctCount, color: "#4ade80" },
            { name: "Incorrect", value: topic.incorrectCount, color: "#f87171" }
          ]
        }
        
      case "improvement":
        // Generate mock historical data
        const today = new Date()
        const dates = Array.from({ length: 10 }, (_, i) => {
          const date = new Date(today)
          date.setDate(date.getDate() - (9 - i))
          return date.toISOString().split('T')[0]
        })
        
        // Create a trend with the improvement rate factored in
        let score = stats.averageScore - (stats.improvementRate * 5)
        const historicalScores = dates.map(date => {
          score += (stats.improvementRate / 5) + (Math.random() * 0.1 - 0.05)
          score = Math.min(1, Math.max(0, score)) // Keep between 0 and 1
          return { date, score: Math.round(score * 100) / 100 }
        })
        
        return {
          type: "line",
          data: historicalScores
        }
        
      case "comparison":
        return {
          type: "bar",
          data: [
            { name: "Your Score", value: Math.round(stats.averageScore * 100), color: "#60a5fa" },
            { name: "Peer Average", value: Math.round(stats.compareToPeers.averagePeerScore * 100), color: "#d1d5db" },
            { name: "Top Performers", value: Math.round(Math.min(100, stats.compareToPeers.averagePeerScore * 100 + 15)), color: "#a3e635" }
          ]
        }
        
      case "conceptMap":
        return {
          type: "bar",
          data: stats.conceptGaps.map(gap => ({
            name: gap.concept,
            value: gap.frequency,
            color: "#f97316"
          }))
        }
        
      case "mistakes":
        return {
          type: "bar",
          data: stats.topMistakes.map(mistake => ({
            name: mistake.question,
            value: mistake.attempts,
            color: "#ec4899"
          }))
        }
    }
  }
  
  const downloadVisualSummary = (visual: VisualSummary) => {
    // In a real implementation, this would generate and download a chart image
    // For now, we'll just create a JSON file with the data
    
    const dataStr = JSON.stringify(visual, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    
    const link = document.createElement("a")
    link.href = dataUri
    link.download = `${visual.topic.replace(/\s+/g, "_")}_visual_summary.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("Visual summary data downloaded!")
  }

  const openVisualDetails = (visual: VisualSummary) => {
    setSelectedVisual(visual)
    setOpenDetailDialog(true)
  }
  
  // Helper to get the appropriate icon for each summary type
  const getSummaryTypeIcon = (type: string) => {
    switch (type) {
      case "performance":
        return <PieChart className="h-4 w-4" />
      case "improvement":
        return <LineChart className="h-4 w-4" />
      case "comparison":
      case "conceptMap":
      case "mistakes":
        return <BarChart className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }
  
  // Helper to get a human-readable name for each summary type
  const getSummaryTypeName = (type: string): string => {
    switch (type) {
      case "performance": return "Performance Analysis"
      case "improvement": return "Progress Over Time"
      case "comparison": return "Peer Comparison"
      case "conceptMap": return "Concept Gap Analysis"
      case "mistakes": return "Common Mistakes"
      default: return "Analysis"
    }
  }

  if (loadingTopics) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topics">
            <Info className="mr-2 h-4 w-4" />
            Challenging Topics
          </TabsTrigger>
          <TabsTrigger value="visuals">
            <BarChart className="mr-2 h-4 w-4" />
            Statistical Summaries ({visualSummaries.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="topics" className="space-y-4 mt-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium">Your Challenging Topics</h3>
            <p className="text-sm text-muted-foreground">
              Based on your test performance, these topics need extra attention. Generate visual summaries to understand your performance patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {difficultTopics.map((topic, index) => (
              <Card
                key={`${topic.topic}-${topic.specialty}-${index}`}
                className={selectedTopic === topic.topic ? "border-primary" : ""}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {topic.topic}
                    <Badge variant="outline" className="ml-2">
                      {topic.specialty}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center justify-between">
                      <span>Difficulty: {topic.difficultyScore.toFixed(1)}/5</span>
                      <span className="text-xs">
                        {topic.correctCount}/{topic.totalCount} correct
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  {performanceData[topic.topic] && (
                    <div className="text-xs text-muted-foreground">
                      <div className="flex justify-between mb-1">
                        <span>Avg. Score:</span>
                        <span>{Math.round(performanceData[topic.topic].averageScore * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Percentile:</span>
                        <span>{performanceData[topic.topic].compareToPeers.percentile}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => generateVisualSummary(topic)}
                    disabled={generatingVisual === topic.topic}
                  >
                    {generatingVisual === topic.topic ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : visualSummaries.some(v => v.topic === topic.topic) ? (
                      <>
                        <BarChart className="h-4 w-4 mr-2" />
                        View Statistics
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Generate Statistics
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="visuals" className="space-y-4 mt-4">
          {visualSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Statistical Summaries Yet</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Switch to the &quot;Challenging Topics&quot; tab and generate statistical summaries to help understand your performance patterns.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visualSummaries.map((visual) => (
                <Card key={visual.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {visual.topic}
                      <div className="flex items-center">
                        {getSummaryTypeIcon(visual.summaryType)}
                        <span className="text-sm font-normal ml-2">
                          {getSummaryTypeName(visual.summaryType)}
                        </span>
                      </div>
                    </CardTitle>
                    <CardDescription className="flex justify-between">
                      <span>{visual.specialty}</span>
                      <span>Created {new Date(visual.createdAt).toLocaleDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="cursor-pointer" onClick={() => openVisualDetails(visual)}>
                    <div className="h-40 overflow-hidden">
                      <StatisticalChart 
                        data={visual.chartData} 
                        height={150}
                      />
                      
                      {/* Show a key insight */}
                      {visual.insights && visual.insights.length > 0 && (
                        <p className="text-xs mt-2 italic text-muted-foreground px-2">
                          &quot;{visual.insights[0]}&quot;
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openVisualDetails(visual)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadVisualSummary(visual)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
        <DialogContent className="max-w-3xl">
          {selectedVisual && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {selectedVisual.topic}
                  <Badge variant="outline" className="ml-2">
                    {getSummaryTypeName(selectedVisual.summaryType)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedVisual.specialty} • Created {new Date(selectedVisual.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 space-y-6">
                <div className="bg-card rounded-md overflow-hidden">
                  <StatisticalChart 
                    data={selectedVisual.chartData} 
                    height={300}
                    title={`${getSummaryTypeName(selectedVisual.summaryType)} for ${selectedVisual.topic}`}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Insights</h4>
                  <ul className="space-y-2">
                    {selectedVisual.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex">
                        <span className="mr-2">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {selectedVisual.summaryType === "performance" && (
                      <>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Focus on understanding core concepts before moving to application questions</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Review incorrect answers and identify pattern of mistakes</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Create targeted flashcards for concepts with the lowest scores</span>
                        </li>
                      </>
                    )}
                    
                    {selectedVisual.summaryType === "improvement" && (
                      <>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Implement spaced repetition to reinforce concepts</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Set up weekly self-assessment quizzes to track progress</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Join a study group to gain different perspectives</span>
                        </li>
                      </>
                    )}
                    
                    {selectedVisual.summaryType === "comparison" && (
                      <>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Review study materials from top-performing peers</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Focus on question types where peers perform better</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Consider tutoring or additional resources in this topic</span>
                        </li>
                      </>
                    )}
                    
                    {selectedVisual.summaryType === "conceptMap" && (
                      <>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Create concept connections map to understand relationships</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Find supplemental resources focused on these gap areas</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Schedule targeted review sessions for these concepts</span>
                        </li>
                      </>
                    )}
                    
                    {selectedVisual.summaryType === "mistakes" && (
                      <>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Review each mistake and document the correct solution</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Create problem-specific notes for frequently missed questions</span>
                        </li>
                        <li className="text-sm text-muted-foreground flex">
                          <span className="mr-2">•</span>
                          <span>Identify knowledge gaps revealed by these mistakes</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadVisualSummary(selectedVisual)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StatisticalVisualSummaries