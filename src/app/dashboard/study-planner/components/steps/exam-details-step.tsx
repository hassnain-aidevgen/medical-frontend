"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { motion } from "framer-motion"
import { Target, Calendar, AlertCircle, Loader2 } from "lucide-react"
import type { FormData, FormErrors } from "../../types/study-plan-types"

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
  const [examOptions, setExamOptions] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string>("")

  // Fetch exam types from API
  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        setLoading(true)
        setFetchError("")
        
        const response = await fetch('https://medical-backend-3eek.onrender.com/api/exam-type/exam-types')
        const data = await response.json()
        
        if (data.success) {
          setExamOptions(data.examTypes)
        } else {
          setFetchError(data.message || 'Failed to fetch exam types')
        }
      } catch (error) {
        console.error('Error fetching exam types:', error)
        setFetchError('Network error while fetching exam types')
      } finally {
        setLoading(false)
      }
    }

    fetchExamTypes()
  }, [])

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
        <div className="relative">
          <select
            name="targetExam"
            value={formData.targetExam}
            onChange={handleInputChange}
            className={`w-full p-2 border ${errors.targetExam ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400 ${loading ? 'pr-10' : ''}`}
            required
            disabled={loading}
          >
            <option value="">
              {loading ? "Loading exams..." : "Select an exam"}
            </option>
            {examOptions.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={18} />
          )}
        </div>
        {errors.targetExam && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            {errors.targetExam}
          </p>
        )}
        {fetchError && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            {fetchError}
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