// "use client"

// import axios from "axios"
// import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// // Define types for our challenge data
// export interface Question {
//     _id: string
//     question: string
//     options: string[]
//     answer: string
//     explanation?: string
//     subject?: string
//     subsection?: string
//     system?: string
//     topic?: string
//     subtopics?: string[]
//     exam_type?: string
//     year?: number
//     difficulty?: string
//     specialty?: string
//     state_specific?: string
//     clinical_setting?: string
//     question_type?: string
// }

// export interface Challenge {
//     _id: string
//     date: string
//     questions: Question[]
//     isGlobal: boolean
// }

// export interface ChallengeResults {
//     score: number
//     questions: {
//         id: string
//         question: string
//         answer: string
//         correct: boolean
//     }[]
//     date: string
// }

// // Define the context shape
// interface DailyChallengeContextType {
//     challenge: Challenge | null
//     completed: boolean
//     hasNewChallenge: boolean
//     streakCount: number
//     loading: boolean
//     error: string | null
//     results: ChallengeResults | null
//     refetchChallenge: () => Promise<void>
//     fetchResults: () => Promise<void>
//     setCompletedManually: (value: boolean) => void
// }

// // Create the context
// const DailyChallengeContext = createContext<DailyChallengeContextType | undefined>(undefined)

// // Provider component
// export function DailyChallengeProvider({ children }: { children: ReactNode }) {
//     const [challenge, setChallenge] = useState<Challenge | null>(null)
//     const [completed, setCompleted] = useState(false)
//     const [hasNewChallenge, setHasNewChallenge] = useState(false)
//     const [streakCount, setStreakCount] = useState(0)
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState<string | null>(null)
//     const [results, setResults] = useState<ChallengeResults | null>(null)

//     const fetchChallenge = async () => {
//         try {
//             setLoading(true)
//             const userId = localStorage.getItem("Medical_User_Id")
//             const response = await axios.get(`https://medical-backend-3eek.onrender.com/api/test/daily-challenge?userId=${userId}&hit=test`)

//             if (response.status === 200) {
//                 const data = response.data
//                 setChallenge(data.challenge)
//                 setCompleted(data.completed)
//                 setHasNewChallenge(!data.completed)

//                 // Get streak from localStorage or API
//                 const streak = localStorage.getItem("dailyChallengeStreak")
//                     ? Number.parseInt(localStorage.getItem("dailyChallengeStreak") || "0")
//                     : 0
//                 setStreakCount(streak)

//                 // Update last check time
//                 const now = new Date().toDateString()
//                 localStorage.setItem("lastDailyChallengeCheck", now)
//             } else {
//                 setError(response.data.error || "Failed to fetch daily challenge")
//             }
//         } catch (err) {
//             console.error("Error fetching daily challenge:", err)
//             setError("An error occurred while fetching the daily challenge")
//         } finally {
//             setLoading(false)
//         }
//     }

//     const fetchResults = async () => {
//         if (!challenge) return

//         try {
//             setLoading(true)
//             const userId = localStorage.getItem("Medical_User_Id")
//             const response = await axios.get(
//                 `https://medical-backend-3eek.onrender.com/api/test/daily-challenge/results?userId=${userId}&challengeId=${challenge._id}`,
//             )

//             if (response.status === 200) {
//                 setResults(response.data.results)
//             } else {
//                 setError(response.data.error || "Failed to fetch daily challenge results")
//             }
//         } catch (err) {
//             console.error("Error fetching daily challenge results:", err)
//             setError("An error occurred while fetching the daily challenge results")

//             // Create fallback results from localStorage if available
//             const score = localStorage.getItem("lastChallengeScore")
//             const total = localStorage.getItem("lastChallengeTotal")

//             if (score && total) {
//                 setResults({
//                     score: Number.parseInt(score),
//                     questions: Array(Number.parseInt(total)).fill({
//                         id: "fallback",
//                         question: "Question",
//                         answer: "",
//                         correct: false,
//                     }),
//                     date: new Date().toISOString(),
//                 })
//             }
//         } finally {
//             setLoading(false)
//         }
//     }

//     // Allow manual setting of completed status (used after submission)
//     const setCompletedManually = (value: boolean) => {
//         setCompleted(value)
//     }

//     // Fetch challenge data when the provider mounts
//     useEffect(() => {
//         fetchChallenge()
//     }, [])

//     // Create the context value
//     const contextValue: DailyChallengeContextType = {
//         challenge,
//         completed,
//         hasNewChallenge,
//         streakCount,
//         loading,
//         error,
//         results,
//         refetchChallenge: fetchChallenge,
//         fetchResults,
//         setCompletedManually,
//     }

//     return <DailyChallengeContext.Provider value={contextValue}>{children}</DailyChallengeContext.Provider>
// }

// // Custom hook to use the context
// export function useDailyChallenge() {
//     const context = useContext(DailyChallengeContext)
//     if (context === undefined) {
//         throw new Error("useDailyChallenge must be used within a DailyChallengeProvider")
//     }
//     return context
// }

