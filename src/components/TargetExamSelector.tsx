"use client"

import React from "react"

interface TargetExamSelectorProps {
  selectedExam: string
  onExamChange: (exam: string) => void
  examDate: string
  onDateChange: (date: string) => void
}

// Updated to include the actual exam types used in the application
const availableExams = [
  { name: "USMLE Step 1", value: "USMLE_STEP1" },
  { name: "USMLE Step 2", value: "USMLE_STEP2" },
  { name: "USMLE Step 3", value: "USMLE_STEP3" },
  { name: "NEET", value: "NEET" },
  { name: "PLAB", value: "PLAB" },
  { name: "MCAT", value: "MCAT" },
  { name: "NCLEX", value: "NCLEX" },
  { name: "COMLEX", value: "COMLEX" }
]

const TargetExamSelector: React.FC<TargetExamSelectorProps> = ({
  selectedExam,
  onExamChange,
  examDate,
  onDateChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Target Exam Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Exam Selection */}
        <div className="flex flex-col gap-4">
          <label htmlFor="examSelect" className="font-medium text-gray-700">
            Select Your Target Exam:
          </label>
          <select
            id="examSelect"
            value={selectedExam}
            onChange={(e) => onExamChange(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          >
            <option value="">-- Select an Exam --</option>
            {availableExams.map((exam) => (
              <option key={exam.name} value={exam.value}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        {/* Exam Date Picker */}
        <div className="flex flex-col gap-4">
          <label htmlFor="examDate" className="font-medium text-gray-700">
            Exam Date:
          </label>
          <input
            type="date"
            id="examDate"
            value={examDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} // One day into the future
          />
        </div>

      </div>
    </div>
  )
}

export default TargetExamSelector