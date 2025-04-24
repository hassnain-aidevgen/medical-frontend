"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookMarked, Calendar, Clock, Trash2, Loader2, X, AlertCircle, Power, Check } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

interface StudyPlan {
    _id: string
    name?: string
    targetExam: string
    createdAt: string
    lastAccessed: string
    userId: string
    isActive?: boolean
    plan?: {
        title?: string
        overview?: string
    }
}

interface UserPlansListProps {
    plans: StudyPlan[]
    onSelectPlan: (planId: string) => void
    onClose: () => void
    onPlanDeleted: () => void
    onPlanActivated?: (planId: string) => void
    isLoading?: boolean
}

const UserPlansList: React.FC<UserPlansListProps> = ({
    plans,
    onSelectPlan,
    onClose,
    onPlanDeleted,
    onPlanActivated,
    isLoading = false,
}) => {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [localPlans, setLocalPlans] = useState<StudyPlan[]>(plans)
    const [isActivating, setIsActivating] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Update local plans when props change
    useEffect(() => {
        setLocalPlans(plans)
    }, [plans])

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        } catch (e) {
            console.error("Error formatting date:", e)
            return "Unknown date"
        }
    }

    const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering the parent click (selecting the plan)

        if (confirm("Are you sure you want to delete this study plan? This action cannot be undone.")) {
            setIsDeleting(planId)
            setError(null)

            try {
                const response = await axios.delete(
                    `https://medical-backend-loj4.onrender.com/api/ai-planner/deleteStudyPlan/${planId}`,
                )

                if (response.data.success) {
                    toast.success("Study plan deleted successfully")

                    // Remove the plan from local state
                    setLocalPlans((prev) => prev.filter((plan) => plan._id !== planId))

                    // Notify parent component
                    onPlanDeleted()
                } else {
                    setError(response.data.message || "Failed to delete plan")
                    toast.error(response.data.message || "Failed to delete plan")
                }
            } catch (error) {
                console.error("Error deleting plan:", error)
                const errorMessage = error instanceof Error ? error.message : "An error occurred while deleting the plan"
                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                setIsDeleting(null)
            }
        }
    }

    const handleActivatePlan = async (planId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering the parent click (selecting the plan)
        setIsActivating(planId)
        setError(null)

        try {
            // First, deactivate all plans
            await axios.put(`https://medical-backend-loj4.onrender.com/api/ai-planner/deactivateAllPlans`, {
                userId: localPlans[0]?.userId, // Assuming all plans belong to the same user
            })

            // Then activate the selected plan
            const response = await axios.put(`https://medical-backend-loj4.onrender.com/api/ai-planner/activatePlan/${planId}`)

            if (response.data.success) {
                toast.success("Study plan activated successfully")

                // Update local state to reflect the change
                setLocalPlans((prev) =>
                    prev.map((plan) => ({
                        ...plan,
                        isActive: plan._id === planId,
                    })),
                )

                // Notify parent component if callback exists
                if (onPlanActivated) {
                    onPlanActivated(planId)
                }
            } else {
                setError(response.data.message || "Failed to activate plan")
                toast.error(response.data.message || "Failed to activate plan")
            }
        } catch (error) {
            console.error("Error activating plan:", error)
            const errorMessage = error instanceof Error ? error.message : "An error occurred while activating the plan"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsActivating(null)
        }
    }


    const handleDeactivatePlan = async (planId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering the parent click (selecting the plan)
        setIsActivating(planId)
        setError(null)

        try {
            // Deactivate the selected plan
            const response = await axios.put(`https://medical-backend-loj4.onrender.com/api/ai-planner/deactivatePlan/${planId}`)

            if (response.data.success) {
                toast.success("Study plan deactivated successfully")

                // Update local state to reflect the change
                setLocalPlans((prev) =>
                    prev.map((plan) => ({
                        ...plan,
                        isActive: plan._id === planId ? false : plan.isActive,
                    })),
                )

                // Remove calendar tasks associated with this plan
                try {
                    const deleteResponse = await axios.delete(
                        `https://medical-backend-loj4.onrender.com/api/ai-planner/calender/byPlan/${planId}`,
                    )
                    if (deleteResponse.data.deletedCount > 0) {
                        toast.success(`Removed ${deleteResponse.data.deletedCount} tasks from your calendar`)
                    }
                } catch (error) {
                    console.error("Error removing calendar tasks:", error)
                }

                // Notify parent component if callback exists
                if (onPlanActivated) {
                    onPlanActivated(planId)
                }
            } else {
                setError(response.data.message || "Failed to deactivate plan")
                toast.error(response.data.message || "Failed to deactivate plan")
            }
        } catch (error) {
            console.error("Error deactivating plan:", error)
            const errorMessage = error instanceof Error ? error.message : "An error occurred while deactivating the plan"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsActivating(null)
        }
    }

    const getPlanName = (plan: StudyPlan) => {
        // First try to get the title from the plan object
        if (plan.plan?.title && plan.plan.title.trim() !== "") {
            return plan.plan.title
        }

        // Then try the name property
        if (plan.name && plan.name.trim() !== "") {
            return plan.name
        }

        if (plan.targetExam && plan.targetExam.trim() !== "") {
            return `${plan.targetExam} Study Plan`
        }

        return "Unnamed Study Plan"
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
                <div className="p-4 border-b flex justify-between items-center bg-blue-50">
                    <h2 className="text-xl font-semibold text-blue-800 flex items-center">
                        <BookMarked className="mr-2 text-blue-600" size={20} />
                        Your Study Plans
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border-b border-red-100 text-red-700 text-sm flex items-center">
                        <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="overflow-y-auto flex-grow">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                            <Loader2 size={32} className="animate-spin mb-3 text-blue-500" />
                            <p>Loading your study plans...</p>
                        </div>
                    ) : localPlans.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>You don&apos;t have any saved study plans yet.</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {localPlans.map((plan) => (
                                <li
                                    key={plan._id}
                                    onClick={() => onSelectPlan(plan._id)}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${plan.isActive ? "bg-blue-50" : ""
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center">
                                                <h3 className="font-medium text-gray-900">{getPlanName(plan)}</h3>
                                                {plan.isActive && (
                                                    <div className="flex items-center">
                                                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                                                            <Check size={12} className="mr-1" />
                                                            Active
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500 space-y-1">
                                                <div className="flex items-center">
                                                    <Calendar size={14} className="mr-1.5" />
                                                    Created: {formatDate(plan.createdAt)}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock size={14} className="mr-1.5" />
                                                    Last accessed: {formatDate(plan.lastAccessed)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            {plan.isActive ? (
                                                <button
                                                    onClick={(e) => handleDeactivatePlan(plan._id, e)}
                                                    disabled={isActivating === plan._id}
                                                    className={`p-2 rounded-full ${isActivating === plan._id
                                                            ? "bg-gray-100 text-gray-400"
                                                            : "bg-amber-50 text-amber-500 hover:bg-amber-100"
                                                        } transition-colors`}
                                                    title="Deactivate Plan"
                                                >
                                                    {isActivating === plan._id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Power size={16} />
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleActivatePlan(plan._id, e)}
                                                    disabled={isActivating === plan._id}
                                                    className={`p-2 rounded-full ${isActivating === plan._id
                                                        ? "bg-gray-100 text-gray-400"
                                                        : "bg-green-50 text-green-500 hover:bg-green-100"
                                                        } transition-colors`}
                                                    title="Activate Plan"
                                                >
                                                    {isActivating === plan._id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Power size={16} />
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleDeletePlan(plan._id, e)}
                                                disabled={isDeleting === plan._id}
                                                className={`p-2 rounded-full ${isDeleting === plan._id
                                                    ? "bg-gray-100 text-gray-400"
                                                    : "bg-red-50 text-red-500 hover:bg-red-100"
                                                    } transition-colors`}
                                                title="Delete Plan"
                                            >
                                                {isDeleting === plan._id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default UserPlansList
