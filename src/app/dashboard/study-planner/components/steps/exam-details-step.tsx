"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Target, Calendar, AlertCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import type { FormData, FormErrors } from "../../types/study-plan-types"

// Define an interface for the exam type data structure
interface ExamType {
  _id: string
  name: string
  createdAt: string
  __v: number
}

interface ExamDetailsStepProps {
  formData: FormData
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  errors: FormErrors
  pageVariants: any
  animateDirection: "left" | "right"
}

const ExamDetailsStep: React.FC<ExamDetailsStepProps> = ({
  formData,
  handleInputChange,
  errors,
  pageVariants,
  animateDirection,
}) => {
  // State for dynamically fetched exam types
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Fetch exam types from the API when component mounts
  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        setIsLoading(true)
        setFetchError(null)

        // Use the API endpoint provided
        const response = await axios.get("https://medical-backend-loj4.onrender.com/api/test/examtypes")

        // Check if we have data and it's an array
        if (response.data && Array.isArray(response.data)) {
          setExamTypes(response.data)
        } else {
          // Fallback to local endpoint if the production one doesn't work
          const localResponse = await axios.get("http://localhost:5000/api/test/examtypes")
          if (localResponse.data && Array.isArray(localResponse.data)) {
            setExamTypes(localResponse.data)
          } else {
            throw new Error("Invalid data format received from API")
          }
        }
      } catch (error) {
        console.error("Failed to fetch exam types:", error)
        setFetchError("Failed to load exam types. Using default options.")

        // Fallback to hardcoded options if API fails
        setExamTypes([
          { _id: "1", name: "USMLE_STEP1", createdAt: "", __v: 0 },
          { _id: "2", name: "USMLE_STEP2", createdAt: "", __v: 0 },
          { _id: "3", name: "USMLE_STEP3", createdAt: "", __v: 0 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamTypes()
  }, [])

  // Format exam name for display (replace underscores with spaces)
  const formatExamName = (name: string): string => {
    return name.replace(/_/g, " ")
  }

  const calculateDaysRemaining = (dateString: string): number => {
    const targetDate = new Date(dateString)
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getDaysRemainingColor = (dateString: string): string => {
    const days = calculateDaysRemaining(dateString)
    if (days < 30) return "bg-red-500"
    if (days < 90) return "bg-amber-500"
    return "bg-green-500"
  }

  return (
    <motion.div
      className="space-y-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      custom={animateDirection}
      key="step2"
    >
      <h2 className="text-xl font-semibold flex items-center text-blue-700">
        <Target className="mr-2 text-blue-500" size={20} />
        Exam Details
      </h2>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Target Exam <span className="text-red-500">*</span>
        </label>
        {isLoading ? (
          <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md">
            <Loader2 className="animate-spin text-blue-500" size={18} />
            <span className="text-gray-500">Loading exam types...</span>
          </div>
        ) : (
          <>
            <select
              name="targetExam"
              value={formData.targetExam}
              onChange={handleInputChange}
              className={`w-full p-2 border ${errors.targetExam ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400`}
              required
            >
              {examTypes.map((exam) => (
                <option key={exam._id} value={formatExamName(exam.name)}>
                  {formatExamName(exam.name)}
                </option>
              ))}
            </select>
            {fetchError && (
              <p className="mt-1 text-sm text-amber-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {fetchError}
              </p>
            )}
          </>
        )}
        {errors.targetExam && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            {errors.targetExam}
          </p>
        )}
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Target Exam Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="date"
            name="examDate"
            value={formData.examDate}
            onChange={handleInputChange}
            className={`w-full p-2 pl-10 border ${errors.examDate ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400`}
            required
          />
        </div>
        {errors.examDate && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            {errors.examDate}
          </p>
        )}
        {formData.examDate && !errors.examDate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm">
            <div className="flex items-center">
              <span className="text-blue-600 font-medium">
                {calculateDaysRemaining(formData.examDate)} days remaining
              </span>
              <div className="ml-2 h-2 bg-gray-200 rounded-full flex-grow">
                <div
                  className={`h-2 rounded-full ${getDaysRemainingColor(formData.examDate)}`}
                  style={{ width: `${Math.min(100, calculateDaysRemaining(formData.examDate) / 3)}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Target Score/Percentile
        </label>
        <input
          type="text"
          name="targetScore"
          value={formData.targetScore}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
          placeholder="e.g., 250+, 90th percentile"
        />
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Previous Scores (if any)
        </label>
        <textarea
          name="previousScores"
          value={formData.previousScores}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
          rows={2}
          placeholder="e.g., NBME 25: 230, UWorld: 65%"
        />
      </div>
    </motion.div>
  )
}

export default ExamDetailsStep
