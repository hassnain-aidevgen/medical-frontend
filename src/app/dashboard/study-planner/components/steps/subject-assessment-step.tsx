"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Book, CheckCircle, AlertCircle, Loader2, BarChart2, Lightbulb, Info } from "lucide-react"
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
  allSubjects: string[]
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
  allSubjects,
}) => {

  // Handle "Select All" for strong subjects
  const handleSelectAllStrong = () => {
    // Get only subjects that aren't already selected as weak
    const availableSubjects = allSubjects.filter(subject => !formData.weakSubjects.includes(subject))
    const areAllSelected = formData.strongSubjects.length === availableSubjects.length
    
    if (areAllSelected) {
      // Deselect all
      setFormData((prev) => ({
        ...prev,
        strongSubjects: [],
      }))
    } else {
      // Select all available subjects (excluding weak ones)
      setFormData((prev) => ({
        ...prev,
        strongSubjects: [...availableSubjects],
      }))
    }

    // Clear error if subjects are selected
    if (errors.strongSubjects && availableSubjects.length > 0) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.strongSubjects
        return newErrors
      })
    }
  }

  // Handle "Select All" for weak subjects
  const handleSelectAllWeak = () => {
    // Get only subjects that aren't already selected as strong
    const availableSubjects = allSubjects.filter(subject => !formData.strongSubjects.includes(subject))
    const areAllSelected = formData.weakSubjects.length === availableSubjects.length
    
    if (areAllSelected) {
      // Deselect all
      setFormData((prev) => ({
        ...prev,
        weakSubjects: [],
      }))
    } else {
      // Select all available subjects (excluding strong ones)
      setFormData((prev) => ({
        ...prev,
        weakSubjects: [...availableSubjects],
      }))
    }

    // Clear error if subjects are selected
    if (errors.weakSubjects && availableSubjects.length > 0) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.weakSubjects
        return newErrors
      })
    }
  }

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

      {/* Show info about performance-based selection if data exists */}
      {weakTopics.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="flex items-start">
            <BarChart2 className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" size={18} />
            <div className="flex-1">
              <h3 className="font-medium text-blue-800 mb-2">
                📊 Performance-Based Recommendations
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Based on your test performance, we&apos;ve automatically selected weak subjects below. You can modify these selections if needed.
              </p>
              
              <div className="text-xs text-blue-600 mb-3">
                <strong>Selection Criteria:</strong> Subjects with accuracy below {formData.currentLevel === 'beginner' ? '50' : formData.currentLevel === 'intermediate' ? '70' : '85'}% are marked as weak areas.
              </div>

              {/* Show detailed weak topics */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white p-3 rounded-md border border-blue-200"
              >
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  🎯 Subjects that need attention:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {weakTopics.slice(0, 10).map((topic, index) => (
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
                  {weakTopics.length > 10 && (
                    <div className="text-xs text-gray-500 col-span-full">
                      ... and {weakTopics.length - 10} more subjects
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Show message when no weak subjects are found from performance data */}
      {formData.usePerformanceData && weakTopics.length === 0 && !isLoadingPerformanceData && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <div className="flex items-start">
            <Info className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" size={18} />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800 mb-2">
                📚 No Performance Data Available
              </h3>
              <p className="text-sm text-amber-700 mb-2">
                We couldn&apos;t find sufficient test performance data to automatically identify your weak subjects.
              </p>
              <p className="text-sm text-amber-700">
                <strong>Recommendation:</strong> Complete more practice tests, then return to get personalized recommendations based on your performance. For now, please manually select your strong and weak subjects below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Subject Selection - Always Show */}
      <div className="space-y-4">
        {/* Strong Subjects Selection */}
        <div className="group">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Strong Subjects <span className="text-red-500">*</span>
              {weakTopics.length > 0 && (
                <span className="text-xs text-gray-500 font-normal ml-2">(Based on performance data)</span>
              )}
            </label>
            <button
              type="button"
              onClick={handleSelectAllStrong}
              className="text-xs py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 transition-colors"
            >
              {formData.strongSubjects.length === allSubjects.filter(s => !formData.weakSubjects.includes(s)).length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {allSubjects.map((subject) => {
              const isDisabled = formData.weakSubjects.includes(subject);
              return (
                <div
                  key={`strong-${subject}`}
                  onClick={() => {
                    if (isDisabled) return;
                    
                    const isSelected = formData.strongSubjects.includes(subject)
                    const newStrongSubjects = isSelected
                      ? formData.strongSubjects.filter((s) => s !== subject)
                      : [...formData.strongSubjects, subject]

                    setFormData((prev) => ({
                      ...prev,
                      strongSubjects: newStrongSubjects,
                    }))

                    if (errors.strongSubjects && newStrongSubjects.length > 0) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.strongSubjects
                        return newErrors
                      })
                    }
                  }}
                  className={`p-2 rounded-md border transition-all duration-300 ${
                    isDisabled 
                      ? "opacity-50 bg-gray-50 cursor-not-allowed" 
                      : "cursor-pointer " + (
                        formData.strongSubjects.includes(subject)
                          ? "border-green-500 bg-green-50"
                          : errors.strongSubjects
                            ? "border-red-200 hover:border-green-300 hover:bg-green-50/50"
                            : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                      )
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-sm mr-2 flex items-center justify-center ${
                        formData.strongSubjects.includes(subject) 
                          ? "bg-green-500 text-white" 
                          : isDisabled 
                            ? "bg-gray-200" 
                            : "border border-gray-300"
                      }`}
                    >
                      {formData.strongSubjects.includes(subject) && <CheckCircle size={12} />}
                    </div>
                    <span
                      className={`text-sm ${
                        isDisabled 
                          ? "text-gray-400" 
                          : formData.strongSubjects.includes(subject) 
                            ? "text-green-700 font-medium" 
                            : "text-gray-700"
                      }`}
                    >
                      {subject}
                      {isDisabled && <span className="text-xs ml-1">(weak)</span>}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {errors.strongSubjects && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              {errors.strongSubjects}
            </p>
          )}
        </div>

        {/* Weak Subjects Selection */}
        <div className="group">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Weak Subjects <span className="text-red-500">*</span>
              {weakTopics.length > 0 && (
                <span className="text-xs text-gray-500 font-normal ml-2">(Auto-selected based on performance)</span>
              )}
            </label>
            <button
              type="button"
              onClick={handleSelectAllWeak}
              className="text-xs py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 transition-colors"
            >
              {formData.weakSubjects.length === allSubjects.filter(s => !formData.strongSubjects.includes(s)).length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {allSubjects.map((subject) => {
              const isDisabled = formData.strongSubjects.includes(subject);
              return (
                <div
                  key={`weak-${subject}`}
                  onClick={() => {
                    if (isDisabled) return;
                    
                    const isSelected = formData.weakSubjects.includes(subject)
                    const newWeakSubjects = isSelected
                      ? formData.weakSubjects.filter((s) => s !== subject)
                      : [...formData.weakSubjects, subject]

                    setFormData((prev) => ({
                      ...prev,
                      weakSubjects: newWeakSubjects,
                    }))

                    if (errors.weakSubjects && newWeakSubjects.length > 0) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.weakSubjects
                        return newErrors
                      })
                    }
                  }}
                  className={`p-2 rounded-md border transition-all duration-300 ${
                    isDisabled 
                      ? "opacity-50 bg-gray-50 cursor-not-allowed" 
                      : "cursor-pointer " + (
                        formData.weakSubjects.includes(subject)
                          ? "border-amber-500 bg-amber-50"
                          : errors.weakSubjects
                            ? "border-red-200 hover:border-amber-300 hover:bg-amber-50/50"
                            : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                      )
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-sm mr-2 flex items-center justify-center ${
                        formData.weakSubjects.includes(subject) 
                          ? "bg-amber-500 text-white" 
                          : isDisabled 
                            ? "bg-gray-200" 
                            : "border border-gray-300"
                      }`}
                    >
                      {formData.weakSubjects.includes(subject) && <CheckCircle size={12} />}
                    </div>
                    <span
                      className={`text-sm ${
                        isDisabled 
                          ? "text-gray-400" 
                          : formData.weakSubjects.includes(subject) 
                            ? "text-amber-700 font-medium" 
                            : "text-gray-700"
                      }`}
                    >
                      {subject}
                      {isDisabled && <span className="text-xs ml-1">(strong)</span>}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {errors.weakSubjects && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              {errors.weakSubjects}
            </p>
          )}
        </div>
      </div>

      {/* Pro tip section */}
      {((formData.strongSubjects.length > 0 && formData.weakSubjects.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-start">
            <Lightbulb className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-sm text-green-800">
              <span className="font-medium">Your personalized study plan will:</span>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Focus 70% of study time on your weak subjects</li>
                <li>Use your strong subjects as building blocks for complex topics</li>
                {weakTopics.length > 0 && <li>Prioritize the specific topics where you scored lowest</li>}
                <li>Adapt to your {formData.currentLevel} level proficiency requirements</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default SubjectAssessmentStep