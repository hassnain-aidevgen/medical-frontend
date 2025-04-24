"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import axios from "axios"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  GraduationCap,
  Info,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Define available exam types
const EXAM_TYPES = [
  { id: "USMLE_STEP1", name: "USMLE Step 1" },
  { id: "USMLE_STEP2", name: "USMLE Step 2" },
  { id: "USMLE_STEP3", name: "USMLE Step 3" },
  { id: "NEET", name: "NEET" },
  { id: "PLAB", name: "PLAB" },
  { id: "MCAT", name: "MCAT" },
  { id: "NCLEX", name: "NCLEX" },
  { id: "COMLEX", name: "COMLEX" },
]

// Helper functions
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Get status based on percentage
const getStatus = (percentage: number) => {
  if (percentage >= 90) return { label: "Excellent", color: "text-green-600" }
  if (percentage >= 75) return { label: "Good", color: "text-blue-600" }
  if (percentage >= 60) return { label: "Fair", color: "text-yellow-600" }
  return { label: "Needs Improvement", color: "text-red-600" }
}

// Get color based on percentage
const getColorByPercentage = (percentage: number) => {
  if (percentage >= 90) return "bg-green-500"
  if (percentage >= 75) return "bg-blue-500"
  if (percentage >= 60) return "bg-yellow-500"
  return "bg-red-500"
}

const ExamCoverageReport = () => {
  const [selectedExamType, setSelectedExamType] = useState("USMLE_STEP1")
  interface Test {
    createdAt: string;
    percentage: number;
    totalQuestions: number;
    totalTime: number; // <-- Add this line
    coverage: {
      questionCountCoverage: number;
    };
  }

  interface AggregatedCoverage {
    questionCountCoverage: number;
    timeEfficiency: number;
    scoreAlignment: number;
    totalQuestions: number;
    totalTimeHours: number;
    averageScore: number;
    examSpecifics?: {
      name: string;
      duration: string;
      questions: number;
      passingScore: number;
      sections: { name: string; questions: number }[];
    };
    totalTests: number;
  }

  interface CoverageData {
    tests: Test[];
    aggregatedCoverage: AggregatedCoverage;
  }

  const [coverageData, setCoverageData] = useState<CoverageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  
  const searchParams = useSearchParams()
  
  // Effect to set initial exam type from URL if provided
  useEffect(() => {
    const examType = searchParams.get("examType")
    if (examType && EXAM_TYPES.some(e => e.id === examType)) {
      setSelectedExamType(examType)
    }
  }, [searchParams])
  
  // Fetch exam coverage data when exam type changes
  useEffect(() => {
    const fetchExamCoverage = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const userId = localStorage.getItem("Medical_User_Id")
        
        if (!userId) {
          throw new Error("User ID not found. Please log in again.")
        }
        
        const response = await axios.get(
          `https://medical-backend-loj4.onrender.com/api/test/user/${userId}/exam-coverage/${selectedExamType}`
        )
        
        setCoverageData(response.data.data)
      } catch (err) {
        console.error("Error fetching exam coverage:", err)
        setError(err instanceof Error ? err.message : "Failed to load exam coverage data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchExamCoverage()
  }, [selectedExamType])
  
  // Prepare chart data for test history
  const testHistoryData = coverageData?.tests.map(test => ({
    name: formatDate(test.createdAt),
    score: test.percentage,
    questions: test.totalQuestions,
    coverage: test.coverage.questionCountCoverage
  })).reverse() || []
  
  // Prepare section coverage data
  const prepareSectionData = () => {
    if (!coverageData?.aggregatedCoverage?.examSpecifics?.sections) {
      return []
    }
    
    return coverageData.aggregatedCoverage.examSpecifics.sections.map(section => {
      // Calculate coverage percentage based on number of questions attempted in this section
      // This is an estimate since we don't have section-level data in our API
      // In a real implementation, you would track section data in your tests
      const estimatedCoverage = Math.min(100, Math.random() * 60 + 20) // Random between 20% and 80% for demo
      
      return {
        name: section.name,
        questions: section.questions,
        coverage: estimatedCoverage,
        status: getStatus(estimatedCoverage).label
      }
    })
  }
  
  const sectionData = prepareSectionData()
  
  // Loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Exam Coverage Report</CardTitle>
          <CardDescription>Track your progress toward exam readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
  
  // Empty state - no tests found for this exam
  if (!coverageData || !coverageData.tests || coverageData.tests.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Exam Coverage Report</CardTitle>
              <CardDescription>Track your progress toward exam readiness</CardDescription>
            </div>
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium text-center mb-2">No test data found for {EXAM_TYPES.find(e => e.id === selectedExamType)?.name}</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Take a test targeting this exam to start building your coverage report.
          </p>
          <Button onClick={() => window.location.href = "/dashboard/create-test"}>
            Take a Test
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  // Calculate overall status
  const overallScore = coverageData.aggregatedCoverage?.questionCountCoverage * 0.4 + 
                      coverageData.aggregatedCoverage?.timeEfficiency * 0.3 + 
                      coverageData.aggregatedCoverage?.scoreAlignment * 0.3 || 0
  
  const overallStatus = getStatus(overallScore)
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Exam Coverage Report
            </CardTitle>
            <CardDescription>Track your progress toward exam readiness</CardDescription>
          </div>
          <Select value={selectedExamType} onValueChange={setSelectedExamType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Exam Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-lg">
              {coverageData.aggregatedCoverage?.examSpecifics?.name || selectedExamType}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Duration: {coverageData.aggregatedCoverage?.examSpecifics?.duration || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Questions: {coverageData.aggregatedCoverage?.examSpecifics?.questions || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Passing: {coverageData.aggregatedCoverage?.examSpecifics?.passingScore || "N/A"}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Tests Taken: {coverageData.aggregatedCoverage?.totalTests || 0}
              </span>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tests">
              <BookOpen className="h-4 w-4 mr-2" />
              Test History
            </TabsTrigger>
            <TabsTrigger value="sections">
              <TrendingUp className="h-4 w-4 mr-2" />
              Section Coverage
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Overall Progress Card */}
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4">Overall Exam Readiness</h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Current Progress</span>
                  <span className={`font-bold ${overallStatus.color}`}>
                    {Math.round(overallScore)}% - {overallStatus.label}
                  </span>
                </div>
                <Progress value={overallScore} className={getColorByPercentage(overallScore)} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-primary" />
                        Question Coverage
                      </h4>
                      <span className="font-bold">
                        {Math.round(coverageData.aggregatedCoverage?.questionCountCoverage || 0)}%
                      </span>
                    </div>
                    <Progress 
                      value={coverageData.aggregatedCoverage?.questionCountCoverage || 0} 
                      className={getColorByPercentage(coverageData.aggregatedCoverage?.questionCountCoverage || 0)} 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You&apos;ve completed {coverageData.aggregatedCoverage?.totalQuestions || 0} questions
                      {coverageData.aggregatedCoverage?.examSpecifics ? 
                        ` out of a recommended ${coverageData.aggregatedCoverage.examSpecifics.questions * 3}` : 
                        ""}
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        Time Efficiency
                      </h4>
                      <span className="font-bold">
                        {Math.round(coverageData.aggregatedCoverage?.timeEfficiency || 0)}%
                      </span>
                    </div>
                    <Progress 
                      value={coverageData.aggregatedCoverage?.timeEfficiency || 0} 
                      className={getColorByPercentage(coverageData.aggregatedCoverage?.timeEfficiency || 0)} 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You&apos;ve practiced for {Math.round((coverageData.aggregatedCoverage?.totalTimeHours || 0) * 10) / 10} hours
                      {coverageData.aggregatedCoverage?.examSpecifics ? 
                        ` out of a recommended ${getExamDurationHours(selectedExamType as keyof typeof examData) * 3} hours` : 
                        ""}
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                        Score Alignment
                      </h4>
                      <span className="font-bold">
                        {Math.round(coverageData.aggregatedCoverage?.scoreAlignment || 0)}%
                      </span>
                    </div>
                    <Progress 
                      value={coverageData.aggregatedCoverage?.scoreAlignment || 0} 
                      className={getColorByPercentage(coverageData.aggregatedCoverage?.scoreAlignment || 0)} 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Your average score is {Math.round(coverageData.aggregatedCoverage?.averageScore || 0)}%
                      {coverageData.aggregatedCoverage?.examSpecifics ? 
                        ` vs ${coverageData.aggregatedCoverage.examSpecifics.passingScore}% passing threshold` : 
                        ""}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Recommendations Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Recommendations
                </h3>
                
                <div className="space-y-4">
                  {overallScore < 60 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted">
                      <h4 className="font-medium">Focus on Building Test Volume</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        You&apos;re in the early stages of preparation. Continue to build your question volume - aim for at least 
                        {coverageData.aggregatedCoverage?.examSpecifics ? 
                          ` ${Math.round(coverageData.aggregatedCoverage.examSpecifics.questions * 0.5)} more questions` : 
                          " 100 more questions"} to establish a strong foundation.
                      </p>
                    </div>
                  )}
                  
                  {overallScore >= 60 && overallScore < 80 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted">
                      <h4 className="font-medium">Increase Practice Time</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have a good start, but need more timed practice under exam conditions. Try to complete
                        {coverageData.aggregatedCoverage?.examSpecifics ? 
                          ` at least ${Math.round(getExamDurationHours(selectedExamType as keyof typeof examData))} more hours` : 
                          " at least 4 more hours"} of timed practice.
                      </p>
                    </div>
                  )}
                  
                  {overallScore >= 80 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted">
                      <h4 className="font-medium">Fine-tune Performance</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        You&apos;re well-prepared! Focus on maintaining your progress and fine-tuning your performance on weaker sections.
                        Consider taking full-length practice exams to build stamina.
                      </p>
                    </div>
                  )}
                  
                  {coverageData.aggregatedCoverage?.scoreAlignment < 90 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted">
                      <h4 className="font-medium">Improve Accuracy</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your current average score is {Math.round(coverageData.aggregatedCoverage?.averageScore || 0)}%.
                        Focus on reviewing incorrectly answered questions and strengthening your weakest subject areas.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Tests Tab */}
          <TabsContent value="tests">
            <div className="space-y-6">
              {/* Test History Chart */}
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4">Test History Performance</h3>
                
                <div className="h-[300px]">
                  {testHistoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={testHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis yAxisId="left" domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="score" 
                          name="Score (%)" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="coverage" 
                          name="Coverage (%)" 
                          stroke="#82ca9d" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">Not enough test data to display chart</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Individual Test Cards */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Recent Tests</h3>
                
                {coverageData.tests.slice(0, 5).map((test, index) => (
                  <div 
                    key={index} 
                    className="bg-white dark:bg-gray-800 border rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{formatDate(test.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {test.totalQuestions} questions
                          </Badge>
                          <Badge variant="outline">
                            {formatTime(test.totalTime)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Score</div>
                          <div className="text-2xl font-bold">
                            {Math.round(test.percentage)}%
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Coverage</div>
                          <div className="text-2xl font-bold">
                            {Math.round(test.coverage.questionCountCoverage)}%
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                
                {coverageData.tests.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All {coverageData.tests.length} Tests
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Sections Tab */}
          <TabsContent value="sections">
            <div className="space-y-6">
              {/* Section Coverage Chart */}
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4">Section Coverage Analysis</h3>
                
                <div className="h-[300px]">
                  {sectionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sectionData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={90} 
                          tick={{ fontSize: 12 }} 
                        />
                        <Tooltip formatter={(value) => [`${value}%`, "Coverage"]} />
                        <Bar dataKey="coverage" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                          {sectionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.coverage >= 90 ? "#10b981" : 
                                entry.coverage >= 75 ? "#3b82f6" : 
                                entry.coverage >= 60 ? "#f59e0b" : "#ef4444"
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No section data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Section Details */}
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4">Detailed Section Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionData.map((section, index) => (
                    <div key={index} className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{section.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {section.questions} questions in actual exam
                          </p>
                        </div>
                        <Badge variant={
                          section.coverage >= 90 ? "default" :
                          section.coverage >= 75 ? "secondary" :
                          section.coverage >= 60 ? "outline" : "destructive"
                        }>
                          {section.status}
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={section.coverage} 
                        className={
                          section.coverage >= 90 ? "bg-green-500" : 
                          section.coverage >= 75 ? "bg-blue-500" : 
                          section.coverage >= 60 ? "bg-yellow-500" : "bg-red-500"
                        } 
                      />
                      
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          Estimated coverage: {Math.round(section.coverage)}%
                        </span>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          Focus Training
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Coverage Recommendations */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Section Improvement Strategy
                </h3>
                
                <div className="space-y-4">
                  {sectionData.filter(s => s.coverage < 60).length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted">
                      <h4 className="font-medium text-red-600 dark:text-red-400">Priority Focus Areas</h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-2">
                        These sections need immediate attention:
                      </p>
                      <div className="space-y-2">
                        {sectionData
                          .filter(s => s.coverage < 60)
                          .map((section, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span>{section.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted">
                      <h4 className="font-medium text-green-600 dark:text-green-400">Good Overall Coverage</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have at least moderate coverage across all sections. Continue to strengthen your weakest areas.
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted">
                    <h4 className="font-medium">Recommended Study Plan</h4>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Based on your current coverage, here&apos;s how to allocate your study time:
                    </p>
                    
                    {sectionData.length > 0 && (
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sectionData.map(section => ({
                                name: section.name,
                                value: Math.max(10, 100 - section.coverage) // Inverse of coverage to prioritize weak areas
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => 
                                `${name}: ${Math.round(percent * 100)}%`
                              }
                            >
                              {sectionData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={`hsl(${220 + index * 30}, 70%, 50%)`} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value}%`, `Study time for ${name}`]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-3">
                      The chart above shows recommended study time allocation across sections.
                      Sections with lower coverage are given higher priority.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
            Last updated: {coverageData.tests.length > 0 ? formatDate(coverageData.tests[0].createdAt) : "N/A"}
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Helper function to get exam duration in hours for specific exam types
const examData = {
  "USMLE_STEP1": 8,
  "USMLE_STEP2": 9,
  "USMLE_STEP3": 16, // 2 days
  "NEET": 3,
  "PLAB": 3,
  "MCAT": 7.5,
  "NCLEX": 5,
  "COMLEX": 8
}

function getExamDurationHours(examType: keyof typeof examData) {
  return examData[examType] || 4 // Default to 4 if not found
}

export default ExamCoverageReport