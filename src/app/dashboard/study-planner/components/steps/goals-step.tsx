"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Award, Sparkles, CheckCircle } from "lucide-react"
import type { FormData } from "../../types/study-plan-types"

interface GoalsStepProps {
  formData: FormData
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  pageVariants: any
  animateDirection: "left" | "right"
}

const GoalsStep: React.FC<GoalsStepProps> = ({ formData, handleInputChange, pageVariants, animateDirection }) => {
  return (
    <motion.div
      className="space-y-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      custom={animateDirection}
      key="step5"
    >
      <h2 className="text-xl font-semibold flex items-center text-blue-700">
        <Award className="mr-2 text-blue-500" size={20} />
        Goals & Additional Information
      </h2>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Specific Goals or Objectives
        </label>
        <textarea
          name="specificGoals"
          value={formData.specificGoals}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
          rows={3}
          placeholder="e.g., Improve understanding of cardiac physiology, master pharmacology concepts"
        />
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Additional Information
        </label>
        <textarea
          name="additionalInfo"
          value={formData.additionalInfo}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
          rows={3}
          placeholder="Any other information that might help us create a better plan for you"
        />
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <Sparkles className="mr-2 text-blue-500" size={18} />
          Your Study Plan Will Include:
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <span className="text-sm text-gray-700">Personalized daily and weekly schedule</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <span className="text-sm text-gray-700">Recommended resources for each subject</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <span className="text-sm text-gray-700">
              {formData.usePerformanceData
                ? "Focus on your weak topics based on performance data"
                : "Focus on your weak subjects with targeted practice"}
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <span className="text-sm text-gray-700">Progress tracking and milestone recommendations</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <span className="text-sm text-gray-700">Adaptive adjustments based on your performance</span>
          </li>
        </ul>
      </div>
    </motion.div>
  )
}

export default GoalsStep
