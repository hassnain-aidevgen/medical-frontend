"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Trophy, Star, Zap, BarChart2, TrendingUp } from "lucide-react"
import confetti from "canvas-confetti"

interface Goal {
  id: number
  subject: string
  description: string
  targetHours: number
  completedHours: number
  dueDate: string
  streak: number
  level: number
}

const CustomWeeklyGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState<Omit<Goal, "id" | "completedHours" | "streak" | "level">>({
    subject: "",
    description: "",
    targetHours: 0,
    dueDate: "",
  })
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    const savedGoals = localStorage.getItem("weeklyGoals")
    const savedXp = localStorage.getItem("xp")
    const savedLevel = localStorage.getItem("level")
    if (savedGoals) setGoals(JSON.parse(savedGoals))
    if (savedXp) setXp(JSON.parse(savedXp))
    if (savedLevel) setLevel(JSON.parse(savedLevel))
  }, [])

  useEffect(() => {
    localStorage.setItem("weeklyGoals", JSON.stringify(goals))
    localStorage.setItem("xp", JSON.stringify(xp))
    localStorage.setItem("level", JSON.stringify(level))
  }, [goals, xp, level])

  const addGoal = () => {
    if (newGoal.subject && newGoal.description && newGoal.targetHours > 0 && newGoal.dueDate) {
      setGoals([...goals, { ...newGoal, id: Date.now(), completedHours: 0, streak: 0, level: 1 }])
      setNewGoal({ subject: "", description: "", targetHours: 0, dueDate: "" })
      addXp(50) // Reward XP for adding a new goal
    }
  }

  const updateGoal = (id: number, updatedGoal: Partial<Goal>) => {
    setGoals(goals.map((goal) => (goal.id === id ? { ...goal, ...updatedGoal } : goal)))
  }

  const deleteGoal = (id: number) => {
    setGoals(goals.filter((goal) => goal.id !== id))
  }

  const addXp = (amount: number) => {
    const newXp = xp + amount
    setXp(newXp)
    if (newXp >= level * 100) {
      setLevel(level + 1)
      setShowLevelUp(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
      setTimeout(() => setShowLevelUp(false), 3000)
    }
  }

  const completeStudySession = (goalId: number, hours: number) => {
    const goal = goals.find((g) => g.id === goalId)
    if (goal) {
      const newCompletedHours = Math.min(goal.completedHours + hours, goal.targetHours)
      const newStreak = newCompletedHours > goal.completedHours ? goal.streak + 1 : goal.streak
      const xpGained = hours * 10 + (newStreak > goal.streak ? 20 : 0)

      updateGoal(goalId, {
        completedHours: newCompletedHours,
        streak: newStreak,
        level: Math.floor(newStreak / 5) + 1,
      })

      addXp(xpGained)

      if (newCompletedHours === goal.targetHours) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
    }
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-indigo-600">Study Quest</h1>

      {/* User Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Level {level}</h2>
            <div className="w-64 bg-gray-200 rounded-full h-4">
              <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${xp % 100}%` }}></div>
            </div>
            <p className="mt-1 text-sm text-gray-600">{xp % 100} / 100 XP</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600">{xp} XP</p>
            <p className="text-sm text-gray-600">Total Experience</p>
          </div>
        </div>
      </div>

      {showLevelUp && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Level Up!</h2>
            <p className="text-xl">You&apos;ve reached level {level}!</p>
            <button
              onClick={() => setShowLevelUp(false)}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Add New Goal Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">New Quest</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Subject"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newGoal.subject}
            onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Target Hours"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newGoal.targetHours || ""}
            onChange={(e) => setNewGoal({ ...newGoal, targetHours: Number.parseInt(e.target.value) || 0 })}
          />
          <input
            type="date"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newGoal.dueDate}
            onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
          />
        </div>
        <button
          onClick={addGoal}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center w-full"
        >
          <Plus size={20} className="mr-2" />
          Start New Quest
        </button>
      </div>

      {/* Goals List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Active Quests</h2>
        <div className="space-y-6">
          {goals.map((goal) => (
            <div key={goal.id} className="border-b pb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{goal.subject}</h3>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingGoalId(goal.id)} className="text-indigo-500 hover:text-indigo-700">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteGoal(goal.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {editingGoalId === goal.id ? (
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    value={goal.description}
                    onChange={(e) => updateGoal(goal.id, { description: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={goal.targetHours}
                      onChange={(e) => updateGoal(goal.id, { targetHours: Number.parseInt(e.target.value) || 0 })}
                      className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="date"
                      value={goal.dueDate}
                      onChange={(e) => updateGoal(goal.id, { dueDate: e.target.value })}
                      className="w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => setEditingGoalId(null)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-2">{goal.description}</p>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-48 bg-gray-200 rounded-full h-2 mr-4">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${(goal.completedHours / goal.targetHours) * 100}%` }}
                        ></div>
                      </div>
                      <span>
                        {goal.completedHours} / {goal.targetHours} hours
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy size={18} className="text-yellow-500 mr-1" />
                      <span className="font-semibold">Level {goal.level}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-600 mr-4">
                        Due: {new Date(goal.dueDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-indigo-600 font-semibold">
                        <Zap size={16} className="inline mr-1" />
                        Streak: {goal.streak}
                      </span>
                    </div>
                    <button
                      onClick={() => completeStudySession(goal.id, 1)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                    >
                      Complete 1 Hour
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Quest Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <BarChart2 size={20} className="mr-2 text-indigo-600" />
              Total Quests
            </h3>
            <p className="text-3xl font-bold text-indigo-600">{goals.length}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Star size={20} className="mr-2 text-green-600" />
              Completed Quests
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {goals.filter((goal) => goal.completedHours >= goal.targetHours).length}
            </p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <TrendingUp size={20} className="mr-2 text-yellow-600" />
              Highest Streak
            </h3>
            <p className="text-3xl font-bold text-yellow-600">{Math.max(...goals.map((goal) => goal.streak), 0)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomWeeklyGoals

