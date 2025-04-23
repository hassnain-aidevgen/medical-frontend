    "use client"

    import { Clock } from "lucide-react"
    import { useState, useEffect } from "react"

    interface EstimatedTimeProps {
    questionCount: number
    mode: "tutor" | "timer"
    difficulty: "easy" | "medium" | "hard" | "ALL_DIFFICULTY_LEVELS"
    }

    const EstimatedTime: React.FC<EstimatedTimeProps> = ({ questionCount, mode, difficulty }) => {
    const [estimatedTime, setEstimatedTime] = useState({ minutes: 0, hours: 0 })

    useEffect(() => {
        let timePerQuestion = 0.5 // Default to short estimate
      
        if (difficulty === "easy") timePerQuestion = 1
        else if (difficulty === "medium") timePerQuestion = 0.75
        else if (difficulty === "hard") timePerQuestion = 0.5
        else if (difficulty === "ALL_DIFFICULTY_LEVELS") timePerQuestion = 0.5
      
        if (questionCount > 0) {
          const totalMinutes = Math.max(0, Math.ceil(questionCount * timePerQuestion))
          const hours = Math.floor(totalMinutes / 60)
          const minutes = totalMinutes % 60
      
          setEstimatedTime({ minutes, hours })
        }
      }, [questionCount, mode, difficulty])
      

    if (questionCount <= 0) {
        return (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center">
            <Clock className="text-amber-600 mr-2" size={18} />
            <p className="text-sm font-medium text-amber-800">
            Try giving a test first to boost your skills and knowledge!
            </p>
        </div>
        )
    }

    return (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center">
        <Clock className="text-blue-600 mr-2" size={18} />
        <div>
            <p className="text-sm font-medium text-blue-800">
            Estimated completion time as per difficulty level: 
            {estimatedTime.hours > 0 && (
                <span className="font-semibold"> {estimatedTime.hours} hour{estimatedTime.hours !== 1 ? 's' : ''}</span>
            )}
            {estimatedTime.minutes > 0 && (
                <span className="font-semibold">
                {estimatedTime.hours > 0 ? ' and' : ''} {estimatedTime.minutes} minute{estimatedTime.minutes !== 1 ? 's' : ''}
                </span>
            )}
            </p>
        </div>
        </div>
    )
    }

    export default EstimatedTime