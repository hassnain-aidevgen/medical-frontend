"use client"

import axios from "axios"
import { useCallback, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import type { JSX } from "react/jsx-runtime"

interface MotivationalStats {
    success: boolean
    userId: string
    effectiveness: number
    totalTestsTaken: number
    streak: {
        currentStreak: number
        longestStreak: number
        activity: Array<{
            date: string
            count: number
            totalScore: number
            totalTime: number
        }>
        stats: {
            totalTestsCompleted: number
            totalScoreEarned: number
            totalTimeSpent: number
        }
    }
}

// Define the type for the categories
type MessageCategory = "study" | "performance" | "challenge" | "productivity" | "support" | "admin" | "generic"

// Pre-defined motivational messages by category
const categorizedMessages: Record<MessageCategory, string[]> = {
    study: [
        "Every study session brings you one step closer to mastery.",
        "The knowledge you gain today will serve your patients tomorrow.",
        "Medical knowledge is built one concept at a time.",
        "Great doctors are always great students first.",
        "Your dedication to learning will benefit countless future patients.",
        "The more you learn, the more lives you'll be able to impact.",
        "Quality study time today means better patient care tomorrow.",
        "Each concept you master is a tool in your future medical toolkit.",
        "Learning medicine is a marathon, not a sprint. Keep going!",
        "The best investment in your medical career is the time you spend studying.",
    ],
    performance: [
        "Track your progress to celebrate how far you've come.",
        "Data-driven improvement is the hallmark of medical excellence.",
        "Your performance metrics are the roadmap to your growth.",
        "Measuring progress helps identify opportunities for improvement.",
        "Great doctors continuously evaluate and improve their performance.",
        "Your metrics tell a story of dedication and growth.",
        "Tracking your performance turns weaknesses into strengths.",
        "The data doesn't lie - see your improvement in real time!",
        "Celebrate your progress while planning your next achievement.",
        "Your performance journey is unique to you - embrace it!",
    ],
    challenge: [
        "Challenges reveal your strengths and areas for growth.",
        "Each challenge you overcome makes you a better future doctor.",
        "Testing your knowledge reinforces your learning.",
        "Embrace challenges - they're opportunities to prove your knowledge.",
        "The best growth happens outside your comfort zone.",
        "Challenge yourself today to excel tomorrow.",
        "Every test is a chance to discover what you know and what you need to learn.",
        "Challenges build the resilience needed in medical practice.",
        "The path to expertise is paved with challenges overcome.",
        "Tests don't just measure knowledge - they strengthen it.",
    ],
    productivity: [
        "Effective time management is a critical skill for medical professionals.",
        "Balance in study leads to balance in practice.",
        "Structured study time leads to efficient learning.",
        "The Pomodoro technique helps maintain focus while preventing burnout.",
        "Taking strategic breaks improves long-term retention.",
        "Productivity isn't about studying more - it's about studying smarter.",
        "Time management today prepares you for the demands of medical practice.",
        "A well-rested mind learns more effectively than an exhausted one.",
        "Balancing focus periods with rest optimizes your learning.",
        "Your future patients will benefit from your efficiency and focus.",
    ],
    support: [
        "Seeking help is a sign of strength, not weakness.",
        "Great doctors know when to consult colleagues and resources.",
        "Questions lead to deeper understanding.",
        "The best medical professionals are lifelong questioners.",
        "Mentorship accelerates growth and development.",
        "Learning from others' experience is as valuable as learning from books.",
        "Building your support network now will serve you throughout your career.",
        "Collaboration is at the heart of modern medicine.",
        "Asking questions today prevents mistakes tomorrow.",
        "Your curiosity drives medical innovation and improvement.",
    ],
    admin: [
        "Investing in your education is investing in your future.",
        "Administrative details matter in medicine - attention to detail starts now.",
        "Organization in your studies translates to organization in practice.",
        "Taking care of the details allows you to focus on what matters most.",
        "Good systems support good medicine.",
        "The business of medicine supports the practice of medicine.",
        "Attention to detail is a critical skill in both medicine and administration.",
        "Organization now leads to efficiency later.",
        "Managing the details effectively gives you more time for learning.",
        "Administrative excellence supports clinical excellence.",
    ],
    generic: [
        "Your dedication to medicine will change countless lives.",
        "Every step in your medical journey matters.",
        "Small daily improvements lead to remarkable results over time.",
        "Your commitment to excellence will make you an outstanding doctor.",
        "The path to becoming a great doctor is built one study session at a time.",
        "Your persistence will pay off in your medical career.",
        "Excellence in medicine requires daily dedication.",
        "Remember why you started this journey when facing difficult concepts.",
        "Your hard work today will make you a better doctor tomorrow.",
        "The medical knowledge you build now will serve you for a lifetime.",
    ],
}

// Icons for each category
const categoryIcons: Record<MessageCategory, string[]> = {
    study: ["📚", "🧠", "📝", "🔍", "📖"],
    performance: ["📊", "📈", "🏆", "⭐", "🎯"],
    challenge: ["💪", "🏅", "🧩", "⚡", "🔥"],
    productivity: ["⏱️", "⌛", "🗓️", "✅", "⚙️"],
    support: ["🤝", "💬", "❓", "🔔", "📢"],
    admin: ["📋", "💼", "🔐", "📑", "🗂️"],
    generic: ["💡", "✨", "🌟", "🩺", "⚕️"],
}

// Constants for localStorage keys and timing
const LAST_MESSAGE_TIMESTAMP_KEY = "Medical_Last_Motivational_Message_Time"
const NEXT_MESSAGE_TIME_KEY = "Medical_Next_Motivational_Message_Time"
const MESSAGE_INTERVAL_MS = 12 * 60 * 60 * 1000 // 12 hours in milliseconds
const CHECK_INTERVAL_MS = 5 * 60 * 1000 // Check every 5 minutes

export function MotivationalMessage(): JSX.Element {
    // Use a ref to track if messages have been shown during this mount
    const messagesShownRef = useRef<boolean>(false)

    // Display contextual motivational messages based on user stats
    const displayMotivationalMessages = useCallback((stats: MotivationalStats): void => {
        const { effectiveness, totalTestsTaken, streak } = stats
        const { currentStreak, stats: activityStats } = streak
        const { totalTimeSpent } = activityStats

        // Format time spent in hours and minutes for display
        const hours = Math.floor(totalTimeSpent / 3600)
        const minutes = Math.floor((totalTimeSpent % 3600) / 60)
        const timeSpentFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

        // Create a personalized context message based on the user's stats
        let contextMessage = ""

        // Build context message based on the most significant stat
        if (currentStreak >= 5) {
            contextMessage = `Your ${currentStreak}-day streak shows incredible dedication! `
        } else if (effectiveness >= 85) {
            contextMessage = `With ${effectiveness}% effectiveness, you're showing excellent mastery. `
        } else if (totalTestsTaken >= 10) {
            contextMessage = `You've completed ${totalTestsTaken} tests, demonstrating real commitment. `
        } else if (totalTimeSpent > 7200) {
            contextMessage = `You've invested ${timeSpentFormatted} in your studies. `
        } else {
            contextMessage = `You're making progress on your medical journey. `
        }

        // Determine which categories to show based on user's stats
        const categoriesToShow: MessageCategory[] = []

        // Add categories based on user's stats
        if (currentStreak > 0) categoriesToShow.push("study")
        if (effectiveness > 0) categoriesToShow.push("performance")
        if (totalTestsTaken > 0) categoriesToShow.push("challenge")
        if (totalTimeSpent > 0) categoriesToShow.push("productivity")

        // Always include generic as a fallback
        if (categoriesToShow.length === 0) categoriesToShow.push("generic")

        // Display messages from selected categories
        categoriesToShow.forEach((category, index) => {
            // Get a message from this category
            // Use a combination of stats to create variety but consistency
            const messageIndex = (totalTestsTaken || 0) + (currentStreak || 0) + index
            const message = getMessage(category, messageIndex)
            const icon = getRandomIcon(category)

            // Create the full message with context and the motivational message
            const fullMessage = index === 0 ? contextMessage + message : message

            // Display with slight delay between messages
            setTimeout(() => {
                toast.success(
                    () => (
                        <div className="flex items-start gap-3">
                            <div className="text-xl mt-0.5">{icon}</div>
                            <div>
                                <p className="font-medium">{fullMessage}</p>
                                {index === 0 && <p className="text-sm text-gray-500 mt-1">{getStatsHighlight(stats)}</p>}
                            </div>
                        </div>
                    ),
                    {
                        duration: 12000,
                        id: `motivational-toast-${category}-${index}`,
                        style: {
                            minWidth: "320px",
                            borderLeft: "4px solid #10b981",
                        },
                    },
                )
            }, index * 1500) // Stagger messages with 1.5 second delay between them
        })
    }, [])

    // Function to check if it's time to show a message and show it if needed
    const checkAndShowMessage = useCallback(async (): Promise<void> => {
        // Don't show messages if we've already shown them during this component mount
        if (messagesShownRef.current) {
            return
        }

        const currentTime = Date.now()
        const nextMessageTime = Number(localStorage.getItem(NEXT_MESSAGE_TIME_KEY) || "0")

        // If it's time to show a message or no next time is set
        if (nextMessageTime === 0 || currentTime >= nextMessageTime) {
            try {
                // Get user ID from localStorage
                const userId = localStorage.getItem("Medical_User_Id")

                if (!userId) {
                    console.error("User ID not found in localStorage")
                    return
                }

                // Fetch motivational stats
                const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/test/motivational-stats/${userId}`)
                const data: MotivationalStats = await response.data

                if (!data.success) {
                    console.error("Failed to fetch motivational stats:", data)
                    return
                }

                // Display personalized motivational messages
                displayMotivationalMessages(data)

                // Mark that we've shown messages during this mount
                messagesShownRef.current = true

                // Schedule next message time
                const nextTime = currentTime + MESSAGE_INTERVAL_MS
                localStorage.setItem(NEXT_MESSAGE_TIME_KEY, nextTime.toString())
                localStorage.setItem(LAST_MESSAGE_TIMESTAMP_KEY, currentTime.toString())

                console.log(`Motivational messages shown. Next messages scheduled for ${new Date(nextTime).toLocaleString()}`)
            } catch (error) {
                console.error("Error fetching motivational stats:", error)
            }
        } else {
            // Log when the next message will be shown
            console.log(`Next motivational messages scheduled for ${new Date(nextMessageTime).toLocaleString()}`)
        }
    }, [displayMotivationalMessages])

    useEffect(() => {
        // Check immediately when component mounts
        checkAndShowMessage()

        // Set up interval to check periodically while the app is open
        const intervalId = setInterval(checkAndShowMessage, CHECK_INTERVAL_MS)

        // Clean up interval on unmount
        return () => clearInterval(intervalId)
    }, [checkAndShowMessage])

    // Get a random icon from the specified category
    const getRandomIcon = (category: MessageCategory): string => {
        const icons = categoryIcons[category]
        return icons[Math.floor(Math.random() * icons.length)]
    }

    // Get a message from the specified category based on index
    const getMessage = (category: MessageCategory, index: number): string => {
        const messages = categorizedMessages[category]
        return messages[index % messages.length]
    }

    // Generate a highlight of the user's most impressive stat
    const getStatsHighlight = (stats: MotivationalStats): string => {
        const { effectiveness, totalTestsTaken, streak } = stats
        const { currentStreak, longestStreak, stats: activityStats } = streak
        const { totalTimeSpent } = activityStats

        // Find the most impressive stat to highlight
        if (currentStreak >= 5 && currentStreak === longestStreak) {
            return `You've matched your longest streak of ${longestStreak} days!`
        } else if (effectiveness >= 85) {
            return `Your effectiveness score of ${effectiveness}% is excellent!`
        } else if (totalTestsTaken >= 10) {
            // Prevent division by zero
            // const avgScore = totalTestsCompleted > 0 ? Math.round(totalScoreEarned / totalTestsCompleted) : 0
            // return `Average score: ${avgScore} points across ${totalTestsTaken} tests`
            return ``
        } else if (totalTimeSpent > 3600) {
            const hours = Math.floor(totalTimeSpent / 3600)
            const minutes = Math.floor((totalTimeSpent % 3600) / 60)
            return `Total study time: ${hours}h ${minutes}m`
        }

        return `Keep building your medical knowledge!`
    }

    // Return the Toaster component to render the toast notifications
    // return <Toaster position="bottom-right" />
    return <></> // No need to render anything in this component, as the toasts are shown directly
}
