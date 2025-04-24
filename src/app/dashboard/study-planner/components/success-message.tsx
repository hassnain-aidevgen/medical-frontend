"use client"

import type React from "react"

import { motion } from "framer-motion"
import { CheckCircle, BookMarked } from "lucide-react"

interface SuccessMessageProps {
  onViewPlan: () => void
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ onViewPlan }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
        className="flex justify-center mb-4"
      >
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <CheckCircle size={48} className="text-white" />
            </motion.div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-500 rounded-full"
          />
        </div>
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Plan Generated Successfully!</h2>
      <p className="text-gray-600 mb-4">Your personalized study plan has been created and is ready to view.</p>
      {/* <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center mx-auto"
        onClick={onViewPlan}
      >
        <BookMarked className="mr-2" size={18} />
        View Your Plan
      </motion.button> */}
    </motion.div>
  )
}

export default SuccessMessage
