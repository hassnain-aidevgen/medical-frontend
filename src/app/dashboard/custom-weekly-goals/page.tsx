"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { BarChart2, Plus, Star, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "react-hot-toast"

// Types
interface Goal {
  _id: string
  subject: string
  description: string
  targetHours: number
  completedHours: number
  dueDate: string
  isCompleted: boolean
  level: number
}

const api = axios.create({
  baseURL: "https://medical-backend-loj4.onrender.com/api/test",
  withCredentials: true,
})

// Validation functions
const validateQuest = (quest: Partial<Goal>) => {
  const errors: string[] = []

  if (!quest.subject?.trim()) {
    errors.push("Subject is required")
  } else if (quest.subject.length < 2 || quest.subject.length > 100) {
    errors.push("Subject must be between 2 and 100 characters")
  }

  if (!quest.description?.trim()) {
    errors.push("Description is required")
  } else if (quest.description.length < 10 || quest.description.length > 500) {
    errors.push("Description must be between 10 and 500 characters")
  }

  if (!quest.targetHours || quest.targetHours < 1 || quest.targetHours > 168) {
    errors.push("Target hours must be between 1 and 168")
  }

  if (!quest.dueDate) {
    errors.push("Due date is required")
  } else if (new Date(quest.dueDate) <= new Date()) {
    errors.push("Due date must be in the future")
  }

  return errors
}

export default function StudyQuest() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState<Omit<Goal, "_id" | "completedHours" | "isCompleted" | "level">>({
    subject: "",
    description: "",
    targetHours: 0,
    dueDate: "",
  })
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(false)

  // Check for user authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await localStorage.getItem("Medical_User_Id")
      if (!userId) {
        toast.error("Please login to access Study Quest")
        router.push("/login") // Redirect to login page
      }
    }
    checkAuth()
  }, [router])

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      const userId = await localStorage.getItem("Medical_User_Id")
      const response = await api.get(`/quest?userId=${userId}`)
      setGoals(response.data.data)
    } catch (error) {
      console.error("Failed to fetch quests:", error)
      toast.error("Failed to fetch quests")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])



  const addGoal = async () => {
    const errors = validateQuest(newGoal)
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
      return
    }

    try {
      setLoading(true)
      const userId = await localStorage.getItem("Medical_User_Id")
      const response = await api.post("/quest", { ...newGoal, userId })
      setGoals((prev) => [response.data.data, ...prev])
      setNewGoal({ subject: "", description: "", targetHours: 0, dueDate: "" })
      toast.success("Quest created successfully")
    } catch (error) {
      console.error("Failed to create quest:", error)
      toast.error("Failed to create quest")
    } finally {
      setLoading(false)
    }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const goal = goals.find((g) => g._id === id)
    if (!goal) return

    // Optimistically update UI
    setGoals((prev) => prev.map((g) => (g._id === id ? { ...g, ...updates } : g)))

    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await api.patch(`/quest/${id}`, { ...updates, userId })

      if (!response.data.success) {
        // Revert on failure
        setGoals((prev) => prev.map((g) => (g._id === id ? goal : g)))
        throw new Error(
          Array.isArray(response.data.error) ? response.data.error[0] : response.data.error || "Failed to update quest",
        )
      }
    } catch (error) {
      console.error("Failed to update quest:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update quest")
    }
  }

  const deleteGoal = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quest?")) {
      return
    }

    try {
      setLoading(true)
      const userId = await localStorage.getItem("Medical_User_Id")
      await api.delete(`/quest/${id}?userId=${userId}`)
      setGoals((prev) => prev.filter((goal) => goal._id !== id))
      toast.success("Quest deleted successfully")
    } catch (error) {
      console.error("Failed to delete quest:", error)
      toast.error("Failed to delete quest")
    } finally {
      setLoading(false)
    }
  }

  // const updateProgress = async (id: string, hours: number) => {
  //   const goal = goals.find((g) => g._id === id)
  //   if (!goal) return

  //   const newHours = Math.min(Math.max(0, hours), goal.targetHours)
  //   await updateGoal(id, { completedHours: newHours })
  // }

  const markAsComplete = async (id: string) => {
    await updateGoal(id, { isCompleted: true, completedHours: goals.find((g) => g._id === id)?.targetHours || 0 })
  }

  return (
    <div className="container mx-auto p-4 space-y-8 bg-[#F3F4F6] max-h-[85dvh] overflow-auto">
      <h1 className="text-4xl font-bold text-center text-primary mb-8">Study Quest</h1>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>New Quest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Subject"
            value={newGoal.subject}
            onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
            className="border-input"
          />
          <Textarea
            placeholder="Description"
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            className="border-input"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Target Hours"
              value={newGoal.targetHours || ""}
              onChange={(e) => setNewGoal({ ...newGoal, targetHours: Math.max(0, Number(e.target.value)) })}
              className="border-input"
              min="0"
            />
            <Input
              type="date"
              value={newGoal.dueDate}
              onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
              className="border-input"
            />
          </div>
          <Button onClick={addGoal} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center justify-center w-full" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Start New Quest
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Active Quests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {goals.map((goal) => (
            <div key={goal._id} className="border-b pb-6 last:border-0 last:pb-0">
              {editingGoal?._id === goal._id ? (
                <div className="space-y-4">
                  <Input
                    value={editingGoal.subject}
                    onChange={(e) => setEditingGoal({ ...editingGoal, subject: e.target.value })}
                    className="border-input"
                  />
                  <Textarea
                    value={editingGoal.description}
                    onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                    className="border-input"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      value={editingGoal.targetHours}
                      onChange={(e) =>
                        setEditingGoal({ ...editingGoal, targetHours: Math.max(0, Number(e.target.value)) })
                      }
                      className="border-input"
                      min="0"
                    />
                    <Input
                      type="date"
                      value={editingGoal.dueDate}
                      onChange={(e) => setEditingGoal({ ...editingGoal, dueDate: e.target.value })}
                      className="border-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateGoal(goal._id, editingGoal)} disabled={loading}>
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingGoal(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`flex justify-between items-center mb-2 ${goal.isCompleted ? "opacity-75" : ""}`}>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {goal.subject}
                      {goal.isCompleted && (
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Completed</span>
                      )}
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGoal(goal._id)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className={`text-muted-foreground mb-4 ${goal.isCompleted ? "opacity-75" : ""}`}>
                    {goal.description}
                  </p>
                  <div className="space-y-4">
                    {!goal.isCompleted ? (
                      <>
                        <div className="flex justify-between items-center gap-4">
                          {/* <Progress value={(goal.completedHours / goal.targetHours) * 100} className="flex-1" /> */}
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <span className="max-w-20 text-right border-input">{goal.completedHours}</span>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              / {goal.targetHours}h
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              Due: {new Date(goal.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            onClick={() => {
                              markAsComplete(goal._id)
                            }}
                            disabled={loading}
                          >
                            Mark as Complete
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg">
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-muted-foreground">
                            Completed on: {new Date(goal.dueDate).toLocaleDateString()}
                          </span>
                          <span className="text-sm font-medium text-green-600">Total Hours: {goal.targetHours}h</span>
                        </div>
                        <Star className="w-6 h-6 text-yellow-500" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quest Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center text-primary">
                <BarChart2 className="w-5 h-5 mr-2" />
                Total Quests
              </h3>
              <p className="text-3xl font-bold text-primary">{goals.length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center text-green-600">
                <Star className="w-5 h-5 mr-2" />
                Completed Quests
              </h3>
              <p className="text-3xl font-bold text-green-600">{goals.filter((goal) => goal.isCompleted).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

