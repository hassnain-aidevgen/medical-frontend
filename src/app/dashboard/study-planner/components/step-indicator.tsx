"use client"

import type React from "react"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

interface StepInfo {
  title: string
  icon: React.ReactNode
}

interface StepIndicatorProps {
  currentStep: number
  stepInfo: StepInfo[]
  setCurrentStep: (step: number) => void
  setAnimateDirection: (direction: "left" | "right") => void
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  stepInfo,
  setCurrentStep,
  setAnimateDirection,
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {stepInfo.map((step, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.1 }}
            onClick={() => {
              if (index + 1 < currentStep) {
                setAnimateDirection("left")
                setCurrentStep(index + 1)
              }
            }}
            className={`relative cursor-pointer ${index + 1 < currentStep ? "cursor-pointer" : "cursor-default"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStep > index + 1
                  ? "bg-green-500 text-white"
                  : currentStep === index + 1
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > index + 1 ? <CheckCircle size={16} /> : step.icon}
            </div>
            <div
              className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                currentStep === index + 1 ? "text-blue-700" : "text-gray-500"
              }`}
            >
              {step.title}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full mt-8">
        <motion.div
          initial={{ width: `${((currentStep - 1) / 5) * 100}%` }}
          animate={{ width: `${(currentStep / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
          className="bg-blue-600 h-2 rounded-full"
        ></motion.div>
      </div>
    </div>
  )
}

export default StepIndicator
