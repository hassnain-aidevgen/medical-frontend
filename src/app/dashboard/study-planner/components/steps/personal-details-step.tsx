"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Edit3, AlertCircle } from "lucide-react"
import type { FormData, FormErrors } from "../../types/study-plan-types"

interface PersonalDetailsStepProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  errors: FormErrors
  pageVariants: any
  animateDirection: "left" | "right"
}

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  formData,
  setFormData,
  handleInputChange,
  errors,
  pageVariants,
  animateDirection,
}) => {
  // keep raw input separate
  const [rawName, setRawName] = useState(formData.name || "")

  // derive the actual name to send/display
  const displayName = rawName.trim()
    ? `${rawName.trim()} study plan`
    : ""

  // sync displayName into your formData whenever it changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: displayName,
    }))
  }, [displayName, setFormData])

  return (
    <motion.div
      className="space-y-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      custom={animateDirection}
      key="step1"
    >
      <h2 className="text-xl font-semibold flex items-center text-blue-700">
        <Edit3 className="mr-2 text-blue-500" size={20} />
        Personal Details
      </h2>
      
      {/* Editable personal information section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
            Plan Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={rawName}
            onChange={(e) => {
              setRawName(e.target.value)
            }}
            className={`w-full p-2 border ${
              errors.name ? "border-red-500" : "border-gray-300"
            } rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400`}
            required
            placeholder="Enter your plan name (e.g. Science)"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              {errors.name}
            </p>
          )}

          {/* live preview of how it will be saved */}
          {displayName && (
            <p className="mt-2 text-sm text-gray-600">
              Your plan will be saved as:&nbsp;
              <span className="font-medium text-blue-700">{displayName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Current Knowledge Level
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {["beginner", "intermediate", "advanced", "expert"].map((level, index) => (
            <div
              key={level}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  currentLevel: level as FormData["currentLevel"],
                }))
              }
              className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-300 ${
                formData.currentLevel === level
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    formData.currentLevel === level
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div
                  className={`font-medium ${
                    formData.currentLevel === level
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {level === "beginner" && "Just starting out"}
                  {level === "intermediate" && "Some knowledge"}
                  {level === "advanced" && "Solid foundation"}
                  {level === "expert" && "Focused review"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default PersonalDetailsStep
