"use client"

import type React from "react"
import { BookMarked, BookOpen } from 'lucide-react'
// import { saveCurrentPlanProgress } from "../path-to/plan-loader" // Adjust the path as needed
import { saveCurrentPlanProgress } from "../../smart-study/plan-loader"
interface ExistingPlanNoticeProps {
  onViewPlans: () => void
  hasPlans: boolean
}

const ExistingPlanNotice: React.FC<ExistingPlanNoticeProps> = ({ onViewPlans, hasPlans }) => {
  if (!hasPlans) return null

  // Create a new handler that saves progress before calling the original onViewPlans
  const handleViewPlans = () => {
    // Save the current plan's progress before navigating
    saveCurrentPlanProgress()
    
    // Then call the original onViewPlans function
    onViewPlans()
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BookMarked className="text-blue-600 mr-2" size={20} />
          <div>
            <h3 className="font-medium text-blue-800">You have saved study plans</h3>
            <p className="text-sm text-blue-600">You can view your previous plans or create a new one.</p>
          </div>
        </div>
        <button
          onClick={handleViewPlans} // Use the new handler instead of onViewPlans directly
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <BookOpen className="mr-2" size={16} />
          View My Plans
        </button>
      </div>
    </div>
  )
}

export default ExistingPlanNotice