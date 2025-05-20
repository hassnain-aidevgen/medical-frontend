// components/progress-refresh-button.tsx
"use client"

import { useState } from "react"
import axios from "axios"
import { RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

// Props interface
interface ProgressRefreshButtonProps {
  planId: string
  onRefreshComplete: (updatedStatus: any) => void
}

const ProgressRefreshButton: React.FC<ProgressRefreshButtonProps> = ({ 
  planId, 
  onRefreshComplete 
}) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const handleRefresh = async () => {
    if (!planId) {
      toast.error("No plan ID available")
      return
    }

    setIsRefreshing(true)
    try {
      const response = await axios.put(
        `http://localhost:5000/api/ai-planner/refreshCompletionStatus/${planId}`
      )

      if (response.data.success) {
        // Call the callback with updated status
        onRefreshComplete(response.data.data.completionStatus)
        toast.success("Progress updated successfully")
      } else {
        toast.error(response.data.message || "Failed to update progress")
      }
    } catch (error) {
      console.error("Error refreshing completion status:", error)
      toast.error("Failed to refresh progress data")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
    >
      <RefreshCw size={16} className={`mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Updating..." : "Refresh Progress"}
    </button>
  )
}

export default ProgressRefreshButton