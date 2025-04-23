"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Clock, Eye, Headphones, BookOpen, Layers } from "lucide-react"
import type { FormData } from "../../types/study-plan-types"

interface StudyPreferencesStepProps {
  formData: FormData
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  pageVariants: any
  animateDirection: "left" | "right"
}

const StudyPreferencesStep: React.FC<StudyPreferencesStepProps> = ({
  formData,
  handleInputChange,
  setFormData,
  pageVariants,
  animateDirection,
}) => {
  return (
    <motion.div
      className="space-y-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      custom={animateDirection}
      key="step4"
    >
      <h2 className="text-xl font-semibold flex items-center text-blue-700">
        <Clock className="mr-2 text-blue-500" size={20} />
        Study Preferences
      </h2>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Hours Available for Study Daily
        </label>
        <div className="flex items-center">
          <input
            type="range"
            name="availableHours"
            min="1"
            max="6"
            value={formData.availableHours}
            onChange={handleInputChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="ml-3 w-8 text-center font-medium text-blue-600">{formData.availableHours}h</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1h</span>
          <span>2h</span>
          <span>3h</span>
          <span>4h</span>
          <span>5h</span>
          <span>6h+</span>
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Days Per Week for Study
        </label>
        <div className="flex flex-wrap gap-2">
          {[3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              onClick={() => setFormData((prev) => ({ ...prev, daysPerWeek: day }))}
              className={`cursor-pointer w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                formData.daysPerWeek === day
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-100"
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {formData.daysPerWeek} days per week × {formData.availableHours} hours ={" "}
          {formData.daysPerWeek * formData.availableHours} hours total per week
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Preferred Time of Day
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {["morning", "afternoon", "evening", "night", "mixed"].map((time) => (
            <div
              key={time}
              onClick={() =>
                setFormData((prev) => ({ ...prev, preferredTimeOfDay: time as FormData["preferredTimeOfDay"] }))
              }
              className={`cursor-pointer p-2 rounded-md border text-center transition-all duration-300 ${
                formData.preferredTimeOfDay === time
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
            >
              <span
                className={`text-sm ${formData.preferredTimeOfDay === time ? "text-blue-700 font-medium" : "text-gray-700"}`}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Preferred Learning Style
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          {[
            { value: "visual", label: "Visual", icon: <Eye size={18} /> },
            { value: "auditory", label: "Auditory", icon: <Headphones size={18} /> },
            { value: "reading", label: "Reading", icon: <BookOpen size={18} /> },
            { value: "kinesthetic", label: "Kinesthetic", icon: <HandsClapping size={18} /> },
            { value: "mixed", label: "Mixed", icon: <Layers size={18} /> },
          ].map((style) => (
            <div
              key={style.value}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  preferredLearningStyle: style.value as FormData["preferredLearningStyle"],
                }))
              }
              className={`cursor-pointer p-3 rounded-md border transition-all duration-300 ${
                formData.preferredLearningStyle === style.value
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    formData.preferredLearningStyle === style.value
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {style.icon}
                </div>
                <span
                  className={`text-sm ${formData.preferredLearningStyle === style.value ? "text-purple-700 font-medium" : "text-gray-700"}`}
                >
                  {style.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Missing HandsClapping icon, so we'll create a simple one
const HandsClapping = (props: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11 9.5V7c0-.8-.5-1-1-1H3c-.5 0-1 .2-1 1v7c0 .8.5 1 1 1h7c.5 0 1-.2 1-1v-2.5" />
      <path d="M13 7v2.5" />
      <path d="M13 14.5V17c0 .8.5 1 1 1h7c.5 0 1-.2 1-1v-7c0-.8-.5-1-1-1h-7c-.5 0-1 .2-1 1v2.5" />
      <path d="M11 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0Z" />
    </svg>
  )
}

export default StudyPreferencesStep
