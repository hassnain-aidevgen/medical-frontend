"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Book, CheckCircle, AlertCircle, Loader2, BarChart2, Lightbulb } from "lucide-react"
import type { FormData, FormErrors, TopicMasteryData } from "../../types/study-plan-types"

interface SubjectAssessmentStepProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  handleTogglePerformanceData: () => void
  weakTopics: TopicMasteryData[]
  isLoadingPerformanceData: boolean
  errors: FormErrors
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
  pageVariants: any
  animateDirection: "left" | "right"
}

const SubjectAssessmentStep: React.FC<SubjectAssessmentStepProps> = ({
  formData,
  setFormData,
  handleTogglePerformanceData,
  weakTopics,
  isLoadingPerformanceData,
  errors,
  setErrors,
  pageVariants,
  animateDirection,
}) => {
  // Lists of subjects for checkboxes
  const allSubjects = [
    "Anatomy",
    "Physiology",
    "Biochemistry",
    "Pharmacology",
    "Pathology",
    "Microbiology",
    "Immunology",
    "Behavioral Science",
    "Biostatistics",
    "Genetics",
    "Nutrition",
    "Cell Biology",
  ]

  return (
    <motion.div
      className="space-y-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      custom={animateDirection}
      key="step3"
    >
      <h2 className="text-xl font-semibold flex items-center text-blue-700">
        <Book className="mr-2 text-blue-500" size={20} />
        Subject Assessment
      </h2>

      {/* Performance Data Integration Section */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <div className="flex items-start">
          <button
            type="button"
            className={`w-5 h-5 rounded-md mr-3 flex items-center justify-center cursor-pointer ${
              formData.usePerformanceData ? "bg-blue-600 text-white" : "border border-gray-400"
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleTogglePerformanceData()
            }}
          >
            {formData.usePerformanceData && <CheckCircle size={14} />}
          </button>
          <div>
            <div className="flex items-center">
              <BarChart2 className="text-blue-600 mr-2" size={18} />
              <h3 className="font-medium text-blue-800">Use performance data to create plan</h3>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              We&apos;ll analyze your performance data to identify weak topics and create a focused study plan.
            </p>

            {formData.usePerformanceData && weakTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 bg-white p-3 rounded-md border border-blue-200"
              >
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  Detected weak topics from your performance data:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {weakTopics.map((topic, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          topic.masteryScore < 30
                            ? "bg-red-500"
                            : topic.masteryScore < 50
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                        }`}
                      ></div>
                      <span>{topic.name}</span>
                      <span className="ml-1 text-xs text-gray-500">({Math.round(topic.masteryScore)}%)</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {formData.usePerformanceData && isLoadingPerformanceData && (
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <Loader2 className="animate-spin mr-2" size={14} />
                Loading your performance data...
              </div>
            )}

            {formData.usePerformanceData && !isLoadingPerformanceData && weakTopics.length === 0 && (
              <div className="mt-2 text-sm text-amber-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                No performance data available. Please complete some assessments first.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show manual subject selection only if not using performance data */}
      {!formData.usePerformanceData && (
        <>
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
              Strong Subjects <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allSubjects.map((subject) => (
                <div
                  key={`strong-${subject}`}
                  onClick={() => {
                    // Simplified approach to toggle selection
                    const isSelected = formData.strongSubjects.includes(subject)
                    const newStrongSubjects = isSelected
                      ? formData.strongSubjects.filter((s) => s !== subject)
                      : [...formData.strongSubjects, subject]

                    setFormData((prev) => ({
                      ...prev,
                      strongSubjects: newStrongSubjects,
                    }))

                    // Clear error if at least one subject is selected
                    if (errors.strongSubjects && newStrongSubjects.length > 0) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.strongSubjects
                        return newErrors
                      })
                    }
                  }}
                  className={`cursor-pointer p-2 rounded-md border transition-all duration-300 ${
                    formData.strongSubjects.includes(subject)
                      ? "border-green-500 bg-green-50"
                      : errors.strongSubjects
                        ? "border-red-200 hover:border-green-300 hover:bg-green-50/50"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-sm mr-2 flex items-center justify-center ${
                        formData.strongSubjects.includes(subject) ? "bg-green-500 text-white" : "border border-gray-300"
                      }`}
                    >
                      {formData.strongSubjects.includes(subject) && <CheckCircle size={12} />}
                    </div>
                    <span
                      className={`text-sm ${formData.strongSubjects.includes(subject) ? "text-green-700 font-medium" : "text-gray-700"}`}
                    >
                      {subject}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {errors.strongSubjects && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.strongSubjects}
              </p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
              Weak Subjects <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allSubjects.map((subject) => (
                <div
                  key={`weak-${subject}`}
                  onClick={() => {
                    // Simplified approach to toggle selection
                    const isSelected = formData.weakSubjects.includes(subject)
                    const newWeakSubjects = isSelected
                      ? formData.weakSubjects.filter((s) => s !== subject)
                      : [...formData.weakSubjects, subject]

                    setFormData((prev) => ({
                      ...prev,
                      weakSubjects: newWeakSubjects,
                    }))

                    // Clear error if at least one subject is selected
                    if (errors.weakSubjects && newWeakSubjects.length > 0) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.weakSubjects
                        return newErrors
                      })
                    }
                  }}
                  className={`cursor-pointer p-2 rounded-md border transition-all duration-300 ${
                    formData.weakSubjects.includes(subject)
                      ? "border-amber-500 bg-amber-50"
                      : errors.weakSubjects
                        ? "border-red-200 hover:border-amber-300 hover:bg-amber-50/50"
                        : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-sm mr-2 flex items-center justify-center ${
                        formData.weakSubjects.includes(subject) ? "bg-amber-500 text-white" : "border border-gray-300"
                      }`}
                    >
                      {formData.weakSubjects.includes(subject) && <CheckCircle size={12} />}
                    </div>
                    <span
                      className={`text-sm ${formData.weakSubjects.includes(subject) ? "text-amber-700 font-medium" : "text-gray-700"}`}
                    >
                      {subject}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {errors.weakSubjects && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.weakSubjects}
              </p>
            )}
          </div>
        </>
      )}

      {((formData.strongSubjects.length > 0 && formData.weakSubjects.length > 0) || formData.usePerformanceData) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 border border-blue-100 rounded-lg"
        >
          <div className="flex items-start">
            <Lightbulb className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
            <div className="text-sm text-blue-700">
              <span className="font-medium">Pro tip:</span> Your study plan will focus more on your weak subjects while
              using your strong subjects as foundation for related concepts.
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default SubjectAssessmentStep
