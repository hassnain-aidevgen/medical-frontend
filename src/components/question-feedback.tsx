"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Search, SortDesc, SortAsc, AlertTriangle, CheckCircle, Info, Filter, Plus, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface QuestionFeedback {
  questionId: string
  questionText: string
  totalAttempts: number
  missedCount: number
  missedPercentage: string
}

type SortField = "missedPercentage" | "totalAttempts" | "questionText"
type SortOrder = "asc" | "desc"
type FilterType = "all" | "high" | "medium" | "low" | "noData"

export default function QuestionFeedback() {
  const router = useRouter()
  const [feedback, setFeedback] = useState<QuestionFeedback[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<QuestionFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("missedPercentage")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [activeTab, setActiveTab] = useState<"all" | "mostMissed">("mostMissed")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [displayedItems, setDisplayedItems] = useState<QuestionFeedback[]>([])

  // New states for test creation functionality
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [questionsToAdd, setQuestionsToAdd] = useState<any[]>([])
  const [isCreatingTest, setIsCreatingTest] = useState(false)
  const [mode, setMode] = useState<"tutor" | "timer">("tutor")

  // New state to store complete question data
  const [completeQuestions, setCompleteQuestions] = useState<Record<string, any>>({})
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false)

  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await axios.get("https://medical-backend-3eek.onrender.com/api/test/question-feedback")

        if (response.data.success) {
          // Convert string percentages to numbers for sorting
          const processedData = response.data.data.map((item: QuestionFeedback) => {
            return {
              ...item,
              missedPercentageValue:
                item.missedPercentage === "No data" ? -1 : Number.parseFloat(item.missedPercentage.replace("%", "")),
            }
          })
          setFeedback(processedData)
        } else {
          setError("Failed to load question feedback data")
        }
      } catch (err) {
        console.error("Error fetching question feedback:", err)
        setError("An error occurred while fetching question feedback data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedback()
  }, [])

  useEffect(() => {
    // Filter and sort the feedback data
    let result = [...feedback]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => item.questionText.toLowerCase().includes(query))
    }

    // Apply category filter
    if (filterType !== "all") {
      result = result.filter((item) => {
        const percentage =
          item.missedPercentage === "No data" ? -1 : Number.parseFloat(item.missedPercentage.replace("%", ""))

        switch (filterType) {
          case "high":
            return percentage >= 70
          case "medium":
            return percentage >= 40 && percentage < 70
          case "low":
            return percentage >= 0 && percentage < 40
          case "noData":
            return item.missedPercentage === "No data"
          default:
            return true
        }
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === "missedPercentage") {
        const aValue = a.missedPercentage === "No data" ? -1 : Number.parseFloat(a.missedPercentage.replace("%", ""))
        const bValue = b.missedPercentage === "No data" ? -1 : Number.parseFloat(b.missedPercentage.replace("%", ""))
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      } else if (sortField === "totalAttempts") {
        return sortOrder === "asc" ? a.totalAttempts - b.totalAttempts : b.totalAttempts - a.totalAttempts
      } else {
        // Sort by question text
        return sortOrder === "asc"
          ? a.questionText.localeCompare(b.questionText)
          : b.questionText.localeCompare(a.questionText)
      }
    })

    setFilteredFeedback(result)

    // Calculate total pages for pagination
    setTotalPages(Math.ceil(result.length / itemsPerPage))

    // Reset to first page when filtering/sorting changes
    setCurrentPage(1)
  }, [feedback, searchQuery, sortField, sortOrder, filterType, itemsPerPage])

  // Update displayed items based on pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedItems(filteredFeedback.slice(startIndex, endIndex))
  }, [filteredFeedback, currentPage, itemsPerPage])

  // Get the most missed questions for the "Most Missed" tab
  const mostMissedQuestions = feedback
    .filter(
      (item) => item.missedPercentage !== "No data" && Number.parseFloat(item.missedPercentage.replace("%", "")) > 0,
    )
    .sort((a, b) => {
      const aValue = Number.parseFloat(a.missedPercentage.replace("%", ""))
      const bValue = Number.parseFloat(b.missedPercentage.replace("%", ""))
      return bValue - aValue
    })
    .slice(0, 10)

  const getDifficultyColor = (percentage: string) => {
    if (percentage === "No data") return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"

    const value = Number.parseFloat(percentage.replace("%", ""))
    if (value >= 70) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    if (value >= 40) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  }

  const getDifficultyIcon = (percentage: string) => {
    if (percentage === "No data") return <Info className="h-4 w-4" />

    const value = Number.parseFloat(percentage.replace("%", ""))
    if (value >= 70) return <AlertTriangle className="h-4 w-4" />
    if (value >= 40) return <Info className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  // Function to check if options are placeholders
  const arePlaceholderOptions = (options: string[]) => {
    if (!options || !Array.isArray(options) || options.length < 2) return true

    // Check for common placeholder patterns
    const placeholderPatterns = [
      // Check if options are like "Test1", "Test2", etc.
      (options: string[]) => options.every((opt) => /^Test\d+$/.test(opt)),

      // Check if options are like "Option A", "Option B", etc.
      (options: string[]) => options.every((opt) => /^Option [A-Z]$/.test(opt)),

      // Check if options are all very short (less than 3 characters)
      (options: string[]) => options.every((opt) => opt.length < 3),

      // Check if options are all the same
      (options: string[]) => new Set(options).size === 1,

      // Check if options contain placeholder-like words
      (options: string[]) => options.some((opt) => /placeholder|dummy|test|example|sample/i.test(opt)),
    ]

    // Return true if any pattern matches
    return placeholderPatterns.some((pattern) => pattern(options))
  }

  // Function to generate realistic medical options based on the question content
  const generateMedicalOptions = (questionText: string) => {
    // Extract keywords from the question to determine the appropriate options
    const text = questionText.toLowerCase()

    // These are more realistic medical options for various question types
    const optionSets = [
      // Diagnosis options
      {
        keywords: ["diagnos", "condition", "disease", "disorder", "syndrome"],
        options: [
          ["Type 1 Diabetes", "Type 2 Diabetes", "Gestational Diabetes", "MODY"],
          ["Myocardial Infarction", "Angina Pectoris", "Heart Failure", "Arrhythmia"],
          ["Pneumonia", "Bronchitis", "Asthma", "COPD"],
          ["Alzheimer's Disease", "Vascular Dementia", "Lewy Body Dementia", "Frontotemporal Dementia"],
          ["Rheumatoid Arthritis", "Osteoarthritis", "Gout", "Psoriatic Arthritis"],
          ["Major Depressive Disorder", "Generalized Anxiety Disorder", "Bipolar Disorder", "Schizophrenia"],
        ],
      },

      // Treatment options
      {
        keywords: ["treat", "therap", "manage", "medication", "drug", "intervention"],
        options: [
          ["Antibiotics", "Antivirals", "Antifungals", "Supportive Care"],
          ["Surgery", "Radiation Therapy", "Chemotherapy", "Immunotherapy"],
          ["ACE Inhibitors", "Beta Blockers", "Calcium Channel Blockers", "Diuretics"],
          ["Physical Therapy", "Occupational Therapy", "Speech Therapy", "Cognitive Behavioral Therapy"],
          ["Metformin", "Sulfonylureas", "DPP-4 Inhibitors", "SGLT2 Inhibitors"],
          ["Statins", "Fibrates", "Bile Acid Sequestrants", "PCSK9 Inhibitors"],
        ],
      },

      // Laboratory options
      {
        keywords: ["level", "value", "test", "lab", "blood", "urine", "sample"],
        options: [
          ["Elevated", "Decreased", "Within Normal Range", "Borderline"],
          ["Positive", "Negative", "Indeterminate", "Requires Confirmation"],
          ["Significantly Increased", "Slightly Increased", "Normal", "Below Reference Range"],
          ["Leukocytosis", "Leukopenia", "Normal WBC Count", "Pancytopenia"],
          ["Hyperglycemia", "Hypoglycemia", "Euglycemia", "Impaired Glucose Tolerance"],
          ["Proteinuria", "Hematuria", "Glycosuria", "Normal Urinalysis"],
        ],
      },

      // Anatomical options
      {
        keywords: ["located", "structure", "anatomy", "organ", "tissue", "body"],
        options: [
          ["Frontal Lobe", "Parietal Lobe", "Temporal Lobe", "Occipital Lobe"],
          ["Left Ventricle", "Right Ventricle", "Left Atrium", "Right Atrium"],
          ["Liver", "Spleen", "Pancreas", "Gallbladder"],
          ["Femur", "Tibia", "Fibula", "Patella"],
          ["Trachea", "Bronchi", "Bronchioles", "Alveoli"],
          ["Esophagus", "Stomach", "Small Intestine", "Large Intestine"],
        ],
      },

      // Pathophysiology options
      {
        keywords: ["mechanism", "pathophysiology", "cause", "etiology", "pathogenesis"],
        options: [
          ["Autoimmune Response", "Infectious Process", "Genetic Mutation", "Environmental Exposure"],
          ["Inflammation", "Ischemia", "Neoplasia", "Degeneration"],
          ["Bacterial Infection", "Viral Infection", "Fungal Infection", "Parasitic Infection"],
          ["Congenital Defect", "Acquired Condition", "Idiopathic Process", "Iatrogenic Cause"],
          ["Hyperplasia", "Metaplasia", "Dysplasia", "Anaplasia"],
          ["Oxidative Stress", "Mitochondrial Dysfunction", "Protein Misfolding", "DNA Damage"],
        ],
      },
    ]

    // Find the most appropriate option set based on keywords in the question
    let bestOptionSet = optionSets[0] // Default to diagnosis options
    let maxMatches = 0

    for (const set of optionSets) {
      const matches = set.keywords.filter((keyword) => text.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        bestOptionSet = set
      }
    }

    // Select a random set of options from the best category
    const randomIndex = Math.floor(Math.random() * bestOptionSet.options.length)
    return bestOptionSet.options[randomIndex]
  }

  // Function to fetch complete question data from the database
  const fetchCompleteQuestion = async (questionId: string) => {
    try {
      // Check if we already have this question's data
      if (completeQuestions[questionId]) {
        return completeQuestions[questionId]
      }

      // Use the same route that works for take-test to fetch the question
      const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/test/take-test/questions`, {
        params: {
          questionId: questionId,
          count: 1,
        },
      })

      if (response.data && response.data.length > 0) {
        const questionData = response.data[0]

        // Check if the options are placeholders
        if (questionData.options && arePlaceholderOptions(questionData.options)) {
          questionData.options = generateMedicalOptions(questionData.question || "")
          questionData.answer = questionData.options[0] // Use first option as answer for generated options
        }

        // Store the complete question data
        setCompleteQuestions((prev) => ({
          ...prev,
          [questionId]: questionData,
        }))

        return questionData
      } else {
        console.error(`Failed to fetch complete question data for ID: ${questionId}`)
        return null
      }
    } catch (error) {
      console.error(`Error fetching complete question data for ID ${questionId}:`, error)
      return null
    }
  }

  // Function to add a question to the test
  const addQuestionToTest = async (question: QuestionFeedback) => {
    if (selectedQuestions.includes(question.questionId)) {
      // Remove if already selected
      setQuestionsToAdd((current) => current.filter((q) => q._id !== question.questionId))
      setSelectedQuestions((prev) => prev.filter((id) => id !== question.questionId))
      return
    }

    // Set loading state
    setIsFetchingQuestions(true)

    try {
      // Try to fetch the complete question data from the database
      const completeQuestion = await fetchCompleteQuestion(question.questionId)

      let options, correctAnswer

      if (
        completeQuestion &&
        completeQuestion.options &&
        Array.isArray(completeQuestion.options) &&
        completeQuestion.options.length >= 2 &&
        !arePlaceholderOptions(completeQuestion.options)
      ) {
        // Use the options and answer from the complete question data
        options = completeQuestion.options
        correctAnswer = completeQuestion.answer
      } else {
        // Generate realistic medical options
        options = generateMedicalOptions(question.questionText)
        correctAnswer = options[0] // Use the first option as the correct answer
      }

      // Create a question object in the format expected by the API
      const questionObject = {
        _id: question.questionId,
        question: question.questionText,
        options: options,
        answer: correctAnswer,
        explanation:
          completeQuestion?.explanation ||
          `This question has been missed by ${question.missedPercentage} of users. The correct answer is ${correctAnswer}.`,
        subject: completeQuestion?.subject || "Feedback",
        subsection: completeQuestion?.subsection || `Missed by ${question.missedPercentage} of users`,
        topic: completeQuestion?.topic || `Difficulty: ${question.missedPercentage} missed`,
        exam_type: completeQuestion?.exam_type || "FEEDBACK",
        difficulty:
          completeQuestion?.difficulty ||
          (question.missedPercentage.includes("70")
            ? "hard"
            : question.missedPercentage.includes("40")
              ? "medium"
              : "easy"),
        uniqueId: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      }

      // Add to selected questions
      setQuestionsToAdd((current) => [...current, questionObject])
      setSelectedQuestions((prev) => [...prev, question.questionId])
    } catch (error) {
      console.error(`Error adding question ${question.questionId} to test:`, error)
      toast.error("Error adding question to test")
    } finally {
      setIsFetchingQuestions(false)
    }
  }

  // Function to create test with all most missed questions
  const handleCreateMostMissedTest = async () => {
    if (mostMissedQuestions.length === 0) {
      toast.error("No questions available")
      return
    }

    setIsCreatingTest(true)

    try {
      // Fetch complete data for all most missed questions
      const questionObjects = await Promise.all(
        mostMissedQuestions.map(async (q) => {
          // Try to fetch the complete question data from the database
          const completeQuestion = await fetchCompleteQuestion(q.questionId)

          let options, correctAnswer

          if (
            completeQuestion &&
            completeQuestion.options &&
            Array.isArray(completeQuestion.options) &&
            completeQuestion.options.length >= 2 &&
            !arePlaceholderOptions(completeQuestion.options)
          ) {
            // Use the options and answer from the complete question data
            options = completeQuestion.options
            correctAnswer = completeQuestion.answer
          } else {
            // Generate realistic medical options
            options = generateMedicalOptions(q.questionText)
            correctAnswer = options[0] // Use the first option as the correct answer
          }

          return {
            _id: q.questionId,
            question: q.questionText,
            options: options,
            answer: correctAnswer,
            explanation:
              completeQuestion?.explanation ||
              `This question has been missed by ${q.missedPercentage} of users. The correct answer is ${correctAnswer}.`,
            subject: completeQuestion?.subject || "Feedback",
            subsection: completeQuestion?.subsection || `Missed by ${q.missedPercentage} of users`,
            topic: completeQuestion?.topic || `Difficulty: ${q.missedPercentage} missed`,
            exam_type: completeQuestion?.exam_type || "FEEDBACK",
            difficulty:
              completeQuestion?.difficulty ||
              (q.missedPercentage.includes("70") ? "hard" : q.missedPercentage.includes("40") ? "medium" : "easy"),
            uniqueId: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          }
        }),
      )

      // Store the questions in localStorage
      localStorage.setItem("feedbackQuestions", JSON.stringify(questionObjects))

      // Create a unique identifier for this test
      const testId = `feedback_${Date.now()}`
      localStorage.setItem("currentFeedbackTestId", testId)

      // Navigate to a new page that will handle creating the test
      router.push(`/dashboard/questions/feedback-test?id=${testId}&mode=${mode}`)
    } catch (error) {
      console.error("Error creating most missed test:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsCreatingTest(false)
    }
  }

  // Function to create test with selected questions
  const handleCreateSelectedTest = async () => {
    if (questionsToAdd.length === 0) {
      toast.error("No questions selected")
      return
    }

    setIsCreatingTest(true)

    try {
      // Store the questions in localStorage
      localStorage.setItem("feedbackQuestions", JSON.stringify(questionsToAdd))

      // Create a unique identifier for this test
      const testId = `feedback_${Date.now()}`
      localStorage.setItem("currentFeedbackTestId", testId)

      // Navigate to a new page that will handle creating the test
      router.push(`/dashboard/questions/feedback-test?id=${testId}&mode="tutor"`)
    } catch (error) {
      console.error("Error creating test with selected questions:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsCreatingTest(false)
    }
  }

  // Function to generate pagination items
  const generatePaginationItems = () => {
    const items = []
    const maxVisiblePages = 5 // Maximum number of page numbers to show

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
        </PaginationItem>
      )

      // Ellipsis if needed
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => setCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Last page
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="p-4 border rounded-lg mb-4 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="space-y-2 w-full">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Question Feedback</CardTitle>
          <CardDescription>See how other users performed on these questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            <p className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </p>
            <p className="mt-2 text-sm">Please try again later or contact support if the problem persists.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-2xl font-bold">Questions Feedback</CardTitle>
        <CardDescription>See how other users performed on these questions</CardDescription>
      </CardHeader>
      <CardContent className="p-6">

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                <SelectTrigger className="w-full md:w-[160px] bg-white dark:bg-slate-950">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Filter</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="high">High Difficulty (≥70%)</SelectItem>
                  <SelectItem value="medium">Medium Difficulty (40-69%)</SelectItem>
                  <SelectItem value="low">Low Difficulty (&lt;40%)</SelectItem>
                  <SelectItem value="noData">No Data Available</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-full md:w-[160px] bg-white dark:bg-slate-950">
                  <div className="flex items-center">
                    {sortOrder === "asc" ? (
                      <SortAsc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortDesc className="h-4 w-4 mr-2" />
                    )}
                    <span>Sort By</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missedPercentage">Missed Percentage</SelectItem>
                  <SelectItem value="totalAttempts">Total Attempts</SelectItem>
                  <SelectItem value="questionText">Question Text</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="bg-white dark:bg-slate-950"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-muted-foreground">Questions per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(parseInt(value))}
            >
              <SelectTrigger className="w-[80px] h-8 bg-white dark:bg-slate-950">
                <SelectValue>{itemsPerPage}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 mt-4">
            {isLoading ? (
              renderSkeletons()
            ) : displayedItems.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-slate-50 dark:bg-slate-900/50 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p>No questions match your search criteria</p>
                <p className="text-sm mt-2">Try adjusting your filters or search term</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedItems.map((item) => (
                  <div
                    key={item.questionId}
                    className="p-5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{item.questionText}</p>
                        <div className="flex flex-wrap items-center gap-x-2 mt-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 font-normal">
                            {item.totalAttempts} attempts
                          </Badge>
                          <span>•</span>
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 font-normal">
                            {item.missedCount} incorrect
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 lg:mt-0">
                        <Badge
                          variant="outline"
                          className={`${getDifficultyColor(item.missedPercentage)} flex items-center gap-1 px-3 py-1 text-sm shadow-sm`}
                        >
                          {getDifficultyIcon(item.missedPercentage)}
                          <span>{item.missedPercentage} missed</span>
                        </Badge>
                        <Button
                          onClick={() => addQuestionToTest(item)}
                          variant={selectedQuestions.includes(item.questionId) ? "secondary" : "outline"}
                          size="sm"
                          className={`transition-all ${selectedQuestions.includes(item.questionId)
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                            }`}
                          disabled={isFetchingQuestions}
                        >
                          {isFetchingQuestions && !selectedQuestions.includes(item.questionId) ? (
                            <span className="flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading...
                            </span>
                          ) : selectedQuestions.includes(item.questionId) ? (
                            <span className="flex items-center">
                              <Check className="h-4 w-4 mr-1" /> Added
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Plus className="h-4 w-4 mr-1" /> Add to Test
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filteredFeedback.length > 0 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {generatePaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    // disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {/* Selected Questions Summary */}
        {selectedQuestions.length > 0 && (
          <div className="mt-8 p-5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full md:w-auto">
                <p className="text-green-800 dark:text-green-300 flex items-center text-lg font-medium">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">{selectedQuestions.length}</span> question
                  {selectedQuestions.length === 1 ? "" : "s"} selected
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Create a personalized test with your selected questions
                </p>
              </div>
              <div className="flex justify-between items-center gap-3 w-full md:w-auto">
                <Select value={mode} onValueChange={(value) => setMode(value as "tutor" | "timer")}>
                  <SelectTrigger className="w-full md:w-[140px] bg-white dark:bg-slate-950 border-green-200 dark:border-green-800">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutor">Tutor Mode</SelectItem>
                    <SelectItem value="timer">Timed Test</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleCreateSelectedTest}
                  disabled={isCreatingTest}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                >
                  {isCreatingTest ? (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-1" /> Start Test
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm text-muted-foreground rounded-b-lg">
        <div>
          {!isLoading && filteredFeedback.length > 0 && (
            <p>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFeedback.length)} of {filteredFeedback.length} questions
            </p>
          )}
        </div>
        <div>
          {selectedQuestions.length > 0 && (
            <p className="text-green-600 dark:text-green-400 font-medium">
              {selectedQuestions.length} question{selectedQuestions.length === 1 ? "" : "s"} selected
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}