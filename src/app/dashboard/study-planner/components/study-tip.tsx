"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Lightbulb } from "lucide-react"

interface StudyTipProps {
  tip: string
}

const StudyTip: React.FC<StudyTipProps> = ({ tip }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg max-w-xs z-10"
    >
      <div className="flex items-start">
        <Lightbulb className="mr-2 flex-shrink-0 mt-0.5" size={16} />
        <div>
          <div className="font-medium text-sm mb-1">Study Tip</div>
          <div className="text-xs">{tip}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default StudyTip
