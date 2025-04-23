"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Zap, Lightbulb } from "lucide-react"

interface GeneratingPlanProps {
  progress: number
  stage: string
  currentTip: string
  showTip: boolean
}

const GeneratingPlan: React.FC<GeneratingPlanProps> = ({ progress, stage, currentTip, showTip }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Zap className="mr-2 text-blue-600" size={24} />
        Generating Your Personalized Study Plan
      </h2>

      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-blue-700">{stage}</span>
          <span className="text-sm font-medium text-blue-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Lightbulb className="text-blue-500 mr-2 mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Study Tip</h3>
            <p className="text-sm text-blue-700">{currentTip}</p>
          </div>
        </div>
      </div>

      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </motion.div>
  )
}

export default GeneratingPlan
