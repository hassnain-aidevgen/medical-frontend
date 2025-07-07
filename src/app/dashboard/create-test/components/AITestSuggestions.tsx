"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { Brain, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

interface Subject {
  _id: string;
  name: string;
}

interface Subsection {
  _id: string;
  name: string;
}

interface AITestSuggestionsProps {
  mode: "tutor" | "timer"
}

const AITestSuggestions: React.FC<AITestSuggestionsProps> = ({ mode }) => {
  const router = useRouter()
  const [topic, setTopic] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<string>("10")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [difficultyDistribution, setDifficultyDistribution] = useState<string>("balanced")
  const [hasError, setHasError] = useState<boolean>(false)
  
  // Add state for subjects and subsections
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subsections, setSubsections] = useState<Subsection[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedSubsection, setSelectedSubsection] = useState<string>("")
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false)
  const [loadingSubsections, setLoadingSubsections] = useState<boolean>(false)
  const [examType, setExamType] = useState<string>("USMLE_STEP1")

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true)
      try {
        const response = await axios.get('http://localhost:5000/api/test/subjects-ai')
        setSubjects(response.data)
      } catch (error) {
        console.error("Error fetching subjects:", error)
        toast.error("Failed to load subjects")
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [])

  // Fetch subsections when a subject is selected
  useEffect(() => {
    if (!selectedSubject) {
      setSubsections([])
      setSelectedSubsection("")
      return
    }

    const fetchSubsections = async () => {
      setLoadingSubsections(true)
      try {
        const response = await axios.get(`http://localhost:5000/api/test/subjects-ai/${selectedSubject}/subsections`)
        setSubsections(response.data)
        
        // If there are subsections, select the first one by default
        if (response.data.length > 0) {
          setSelectedSubsection(response.data[0]._id)
        }
      } catch (error) {
        console.error("Error fetching subsections:", error)
        toast.error("Failed to load subsections")
      } finally {
        setLoadingSubsections(false)
      }
    }

    fetchSubsections()
  }, [selectedSubject])

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numeric values
    if (value === "" || /^\d+$/.test(value)) {
      setQuestionCount(value)
    }
  }

  const handleGenerateTest = async () => {
    // Reset error state
    setHasError(false)
    
    // Validate inputs
    if (!topic.trim()) {
      toast.error("Please enter a medical topic")
      return
    }

    if (!selectedSubject) {
      toast.error("Please select a subject")
      return
    }

    if (!selectedSubsection) {
      toast.error("Please select a subsection")
      return
    }

    const count = parseInt(questionCount, 10)
    if (isNaN(count) || count < 1 || count > 50) {
      toast.error("Please enter a valid number of questions (1-50)")
      return
    }

    setIsGenerating(true)

    try {
      // Call the API to generate and save AI test questions
      const apiUrl = 'http://localhost:5000/api/test/ai-test-suggestions';
      const { data } = await axios.post(apiUrl, {
        topic: topic.trim(),
        questionCount: count,
        difficultyDistribution,
        subjectId: selectedSubject,
        subsectionId: selectedSubsection,
        examType
      })

      // Check if the response was successful and contains question IDs
      if (data && data.success && data.questionIds && data.questionIds.length > 0) {
        // Create URL parameters for the test
        const params = new URLSearchParams({
          mode,
          topic: topic.trim(),
          count: data.questionIds.length.toString(),
          aiQuestionIds: data.questionIds.join(','),
          exam_type: examType
        })

        // Redirect to the take-test page with the AI question IDs
        router.push(`/dashboard/take-test?${params.toString()}`)
      } else {
        // Handle case where no questions were generated
        setHasError(true)
        toast.error("No questions could be generated. Please try a different topic.")
      }
    } catch (error) {
      console.error("Error generating AI test:", error)
      setHasError(true)
      
      // Check for specific error messages from the backend
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        // Show a generic user-friendly error message
        toast.error("Failed to generate test questions. Please try again later.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold flex items-center text-gray-700">
          <Brain className="mr-2" size={24} />
          AI Test Suggestions
        </CardTitle>
        <CardDescription>
          Generate a customized test focused on a specific medical topic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject Selection */}
        <div>
          <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <Select
            value={selectedSubject}
            onValueChange={setSelectedSubject}
            disabled={isGenerating || loadingSubjects}
          >
            <SelectTrigger id="subject-select">
              <SelectValue placeholder={loadingSubjects ? "Loading subjects..." : "Select a subject"} />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject._id} value={subject._id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subsection Selection (only show if subject is selected) */}
        {selectedSubject && (
          <div>
            <label htmlFor="subsection-select" className="block text-sm font-medium text-gray-700 mb-1">
              Subsection
            </label>
            <Select
              value={selectedSubsection}
              onValueChange={setSelectedSubsection}
              disabled={isGenerating || loadingSubsections}
            >
              <SelectTrigger id="subsection-select">
                <SelectValue placeholder={loadingSubsections ? "Loading subsections..." : "Select a subsection"} />
              </SelectTrigger>
              <SelectContent>
                {subsections.map((subsection) => (
                  <SelectItem key={subsection._id} value={subsection._id}>
                    {subsection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Exam Type Selection */}
        <div>
          <label htmlFor="exam-type" className="block text-sm font-medium text-gray-700 mb-1">
            Exam Type
          </label>
          <Select
            value={examType}
            onValueChange={setExamType}
            disabled={isGenerating}
          >
            <SelectTrigger id="exam-type">
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USMLE_STEP1">USMLE Step 1</SelectItem>
              <SelectItem value="USMLE_STEP2">USMLE Step 2</SelectItem>
              <SelectItem value="USMLE_STEP3">USMLE Step 3</SelectItem>
              <SelectItem value="NEET">NEET</SelectItem>
              <SelectItem value="PLAB">PLAB</SelectItem>
              <SelectItem value="MCAT">MCAT</SelectItem>
              <SelectItem value="NCLEX">NCLEX</SelectItem>
              <SelectItem value="COMLEX">COMLEX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Topic Input */}
        <div>
          <label htmlFor="medical-topic" className="block text-sm font-medium text-gray-700 mb-1">
            Medical Topic
          </label>
          <Input
            id="medical-topic"
            type="text"
            placeholder="e.g., Cardiovascular Physiology, Diabetes Management"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full"
            disabled={isGenerating}
          />
        </div>

        {/* Question Count and Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
            </label>
            <Input
              id="question-count"
              type="text"
              placeholder="10"
              value={questionCount}
              onChange={handleQuestionCountChange}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 5-30 questions
            </p>
          </div>

          <div>
            <label htmlFor="difficulty-distribution" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Distribution
            </label>
            <Select
              value={difficultyDistribution}
              onValueChange={setDifficultyDistribution}
              disabled={isGenerating}
            >
              <SelectTrigger id="difficulty-distribution">
                <SelectValue placeholder="Select difficulty distribution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanced (33% each)</SelectItem>
                <SelectItem value="easy-focused">Easy Focused (50% easy, 30% medium, 20% hard)</SelectItem>
                <SelectItem value="challenge">Challenging (20% easy, 30% medium, 50% hard)</SelectItem>
                <SelectItem value="exam-prep">Exam Prep (25% easy, 50% medium, 25% hard)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error display */}
        {hasError && (
          <div className="rounded-md bg-red-50 p-4 mt-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  We couldn't generate questions at this time. Please try again or try a different topic.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerateTest}
          disabled={isGenerating || !selectedSubject || !selectedSubsection}
          className="w-full bg-primary text-white hover:bg-primary-dark h-10 py-2 mt-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Test...
            </>
          ) : (
            "Generate Topic-Focused Test"
          )}
        </Button>

        <p className="text-xs text-gray-500 italic text-center">
          The AI will generate questions focused specifically on {topic || "your chosen topic"} with varying difficulty levels.
        </p>
      </CardContent>
    </Card>
  )
}

export default AITestSuggestions