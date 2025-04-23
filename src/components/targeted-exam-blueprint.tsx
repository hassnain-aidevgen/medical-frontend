  "use client"

  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
  import { Progress } from "@/components/ui/progress"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { AlertCircle, Clock, FileText, GraduationCap, Info, Loader2, Target } from "lucide-react"
  import { useEffect, useState } from "react"

  // Define a constant for client-side check to prevent hydration issues
  const isClient = typeof window !== "undefined"

  // Define exam blueprint structure
  interface ExamBlueprint {
    id: string
    name: string
    duration: string
    questions: number
    format: string
    sections: {
      name: string
      questions: number
      duration?: string
      topics?: string[]
      weight?: number
    }[]
    passingScore?: number
    description: string
  }

  // Define test result structure for the component
  interface TestResultData {
    score: number
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    totalTime: number // in seconds
    targetExam?: string
  }

  interface TargetedExamBlueprintProps {
    testResult: TestResultData
    className?: string
  }

  // Exam blueprints data
  const examBlueprints: ExamBlueprint[] = [
    {
      id: "USMLE_STEP1",
      name: "USMLE Step 1",
      duration: "8 hours",
      questions: 280,
      format: "7 blocks of 40 MCQs each",
      sections: [
        { name: "Basic Sciences", questions: 70 },
        { name: "Pathology", questions: 60 },
        { name: "Pharmacology", questions: 40 },
        { name: "Physiology", questions: 40 },
        { name: "Biochemistry", questions: 30 },
        { name: "Microbiology", questions: 25 },
        { name: "Immunology", questions: 15 },
      ],
      passingScore: 60,
      description: "8-hour CBT, 280 MCQs in 7 blocks; assesses basic sciences.",
    },
    {
      id: "USMLE_STEP2",
      name: "USMLE Step 2 CK",
      duration: "9 hours",
      questions: 318,
      format: "8 blocks of ~40 MCQs each",
      sections: [
        { name: "Internal Medicine", questions: 90 },
        { name: "Surgery", questions: 50 },
        { name: "Pediatrics", questions: 45 },
        { name: "Obstetrics & Gynecology", questions: 45 },
        { name: "Psychiatry", questions: 35 },
        { name: "Family Medicine", questions: 30 },
        { name: "Emergency Medicine", questions: 23 },
      ],
      passingScore: 60,
      description: "9-hour CBT, ~318 MCQs in 8 blocks; evaluates clinical knowledge.",
    },
    {
      id: "USMLE_STEP3",
      name: "USMLE Step 3",
      duration: "2 days",
      questions: 412,
      format: "Day 1: 232 MCQs; Day 2: 180 MCQs + 13 CCS cases",
      sections: [
        { name: "Day 1 - Foundation of Independent Practice", questions: 232 },
        { name: "Day 2 - Advanced Clinical Medicine", questions: 180 },
        { name: "Day 2 - Computer-based Case Simulations", questions: 13 },
      ],
      passingScore: 60,
      description: "2-day CBT; Day 1: 232 MCQs; Day 2: 180 MCQs + 13 CCS cases.",
    },
    {
      id: "NEET",
      name: "NEET",
      duration: "3 hours",
      questions: 200,
      format: "OMR-based, 180 questions to be attempted",
      sections: [
        { name: "Physics", questions: 50 },
        { name: "Chemistry", questions: 50 },
        { name: "Biology (Botany & Zoology)", questions: 100 },
      ],
      passingScore: 50,
      description: "3-hour OMR-based exam, 200 MCQs (180 to be attempted) in Physics, Chemistry, Biology.",
    },
    {
      id: "PLAB",
      name: "PLAB 1",
      duration: "3 hours",
      questions: 180,
      format: "Computer-based test with 180 MCQs",
      sections: [{ name: "Clinical Sciences", questions: 180 }],
      passingScore: 60,
      description: "3-hour CBT, 180 MCQs; PLAB 2: OSCE with 18 clinical stations.",
    },
    {
      id: "MCAT",
      name: "MCAT",
      duration: "7.5 hours",
      questions: 230,
      format: "Computer-based test with 4 sections",
      sections: [
        { name: "Chemical and Physical Foundations", questions: 59 },
        { name: "Critical Analysis and Reasoning Skills", questions: 53 },
        { name: "Biological and Biochemical Foundations", questions: 59 },
        { name: "Psychological, Social, and Biological Foundations", questions: 59 },
      ],
      passingScore: 70,
      description: "7.5-hour CBT, 230 MCQs across 4 sections; tests scientific knowledge and reasoning.",
    },
    {
      id: "NCLEX",
      name: "NCLEX",
      duration: "Variable (up to 5 hours)",
      questions: 145,
      format: "Computer Adaptive Test, 75-145 questions",
      sections: [
        { name: "Safe and Effective Care Environment", questions: 40 },
        { name: "Health Promotion and Maintenance", questions: 30 },
        { name: "Psychosocial Integrity", questions: 30 },
        { name: "Physiological Integrity", questions: 45 },
      ],
      passingScore: 60,
      description: "CAT format, 75–145 questions; assesses nursing competencies.",
    },
    {
      id: "COMLEX",
      name: "COMLEX",
      duration: "8 hours",
      questions: 352,
      format: "Computer-based test with 8 sections",
      sections: [
        { name: "Basic Sciences", questions: 176 },
        { name: "Clinical Sciences", questions: 176 },
      ],
      passingScore: 60,
      description: "8-hour CBT, 352 MCQs in 8 sections; focuses on basic sciences and osteopathic principles.",
    },
  ]

  export default function TargetedExamBlueprint({ testResult, className = "" }: TargetedExamBlueprintProps) {
    const [selectedExamId, setSelectedExamId] = useState<string>(testResult.targetExam || "USMLE_STEP1")
    const [currentBlueprint, setCurrentBlueprint] = useState<ExamBlueprint | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    // Update current blueprint when selected exam changes
    useEffect(() => {
      if (!isClient) return

      setLoading(true)
      try {
        const selected = examBlueprints.find((exam) => exam.id === selectedExamId)
        if (selected) {
          setCurrentBlueprint(selected)
        } else {
          setError("Selected exam blueprint not found")
        }
      } catch (error) {
        console.error("Error setting exam blueprint:", error)
        setError("Failed to load exam blueprint")
      } finally {
        setLoading(false)
      }
    }, [selectedExamId])

    // Set initial exam type based on test result
    useEffect(() => {
      if (!isClient || !testResult.targetExam) return

      const examId = testResult.targetExam
      if (examBlueprints.some((exam) => exam.id === examId)) {
        setSelectedExamId(examId)
      }
    }, [testResult.targetExam])

    // Calculate alignment scores
    const calculateAlignment = () => {
      if (!currentBlueprint || !testResult) return null

      // Calculate question count alignment
      const questionCountAlignment = Math.min(100, (testResult.totalQuestions / currentBlueprint.questions) * 100)

      // Calculate time efficiency
      // Convert test duration from seconds to hours for comparison
      const testDurationHours = testResult.totalTime / 3600
      // Extract hours from blueprint duration string (e.g., "8 hours" -> 8)
      const blueprintDurationHours = Number.parseFloat(currentBlueprint.duration.split(" ")[0])
      // If blueprint duration is in days, estimate hours (e.g., "2 days" -> 16 hours)
      const estimatedBlueprintHours = currentBlueprint.duration.includes("days")
        ? Number.parseFloat(currentBlueprint.duration.split(" ")[0]) * 8
        : blueprintDurationHours

      const timeEfficiency =
        estimatedBlueprintHours > 0 ? Math.min(100, (testDurationHours / estimatedBlueprintHours) * 100) : 0

      // Calculate score alignment with passing score
      const scoreAlignment = currentBlueprint.passingScore
        ? Math.min(100, (((testResult.score / testResult.totalQuestions) * 100) / currentBlueprint.passingScore) * 100)
        : 0

      // Calculate overall alignment (weighted average)
      const overallAlignment = questionCountAlignment * 0.3 + timeEfficiency * 0.3 + scoreAlignment * 0.4

      return {
        questionCountAlignment,
        timeEfficiency,
        scoreAlignment,
        overallAlignment,
      }
    }

    const alignment = calculateAlignment()

    // Helper function to format exam name for display
    const formatExamName = (examType: string) => {
      if (!examType) return ""
      return examType.replace("_", " ").replace(/USMLE/g, "USMLE ").trim()
    }

    // Get status based on alignment percentage
    const getAlignmentStatus = (percentage: number) => {
      if (percentage >= 90) return "excellent"
      if (percentage >= 75) return "good"
      if (percentage >= 60) return "needs-work"
      return "low"
    }

    // Get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case "excellent":
          return "text-green-600 dark:text-green-400"
        case "good":
          return "text-blue-600 dark:text-blue-400"
        case "needs-work":
          return "text-yellow-600 dark:text-yellow-400"
        case "low":
          return "text-red-600 dark:text-red-400"
        default:
          return "text-muted-foreground"
      }
    }


    if (loading) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle>Target Exam Blueprint</CardTitle>
            <CardDescription>Loading exam blueprint...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      )
    }

    if (error) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle>Target Exam Blueprint</CardTitle>
            <CardDescription>There was a problem loading the exam blueprint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-500 mb-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!currentBlueprint || !testResult) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle>Target Exam Blueprint</CardTitle>
            <CardDescription>Compare your test with standardized exam formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No exam blueprint or test result available</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Target Exam Blueprint
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </CardTitle>
              <CardDescription>Compare your test with standardized exam formats</CardDescription>
            </div>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {examBlueprints.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {formatExamName(exam.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Blueprint */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-4">Exam Blueprint: {currentBlueprint.name}</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-xs text-muted-foreground">{currentBlueprint.duration}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Format</p>
                    <p className="text-xs text-muted-foreground">{currentBlueprint.format}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Sections</p>
                  <div className="space-y-2">
                    {currentBlueprint.sections.map((section, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded-md text-xs">
                        <div className="flex justify-between">
                          <span>{section.name}</span>
                          <span>{section.questions} questions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {currentBlueprint.passingScore && (
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Passing Score</p>
                      <p className="text-xs text-muted-foreground">{currentBlueprint.passingScore}%</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-muted">
                  <p className="text-xs text-muted-foreground">{currentBlueprint.description}</p>
                </div>
              </div>
            </div>

            {/* Alignment Analysis */}
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Your Test Alignment</h3>

              {alignment && (
                <div className="space-y-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Overall Alignment</p>
                      <span
                        className={`text-sm font-medium ${getStatusColor(getAlignmentStatus(alignment.overallAlignment))}`}
                      >
                        {Math.round(alignment.overallAlignment)}%
                      </span>
                    </div>
                    <Progress
                      value={alignment.overallAlignment}
                      className={
                        getAlignmentStatus(alignment.overallAlignment) === "excellent"
                          ? "bg-green-500"
                          : getAlignmentStatus(alignment.overallAlignment) === "good"
                            ? "bg-blue-500"
                            : getAlignmentStatus(alignment.overallAlignment) === "needs-work"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getAlignmentStatus(alignment.overallAlignment) === "excellent"
                        ? "Your test closely matches this exam format"
                        : getAlignmentStatus(alignment.overallAlignment) === "good"
                          ? "Your test is well-aligned with this exam format"
                          : getAlignmentStatus(alignment.overallAlignment) === "needs-work"
                            ? "Your test partially aligns with this exam format"
                            : "Your test differs significantly from this exam format"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Question Count Alignment</span>
                        <span>{Math.round(alignment.questionCountAlignment)}%</span>
                      </div>
                      <Progress value={alignment.questionCountAlignment} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your test: {testResult.totalQuestions} questions / Exam: {currentBlueprint.questions} questions
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Time Efficiency</span>
                        <span>{Math.round(alignment.timeEfficiency)}%</span>
                      </div>
                      <Progress value={alignment.timeEfficiency} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your test: {Math.round((testResult.totalTime / 3600) * 10) / 10} hours / Exam:{" "}
                        {currentBlueprint.duration}
                      </p>
                    </div>

                    {currentBlueprint.passingScore && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Score Alignment</span>
                          <span>{Math.round(alignment.scoreAlignment)}%</span>
                        </div>
                        <Progress value={alignment.scoreAlignment} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your score: {Math.round((testResult.score / testResult.totalQuestions) * 100)}% / Passing score:{" "}
                          {currentBlueprint.passingScore}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This comparison is an approximation based on general exam formats. Actual exams may
              vary in content distribution and difficulty.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
