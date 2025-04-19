import axios from "axios"

// Interface for the performance data returned by the API
interface UserPerformanceData {
  strongAreas: Array<{
    subjectId: string
    subjectName: string
    subsectionId: string
    subsectionName: string
    accuracy: number
    totalQuestions: number
    correctCount: number
  }>
  weakAreas: Array<{
    subjectId: string
    subjectName: string
    subsectionId: string
    subsectionName: string
    accuracy: number
    totalQuestions: number
    correctCount: number
  }>
  // Other fields from the API response
}

// Cache the performance data to avoid too many API calls
let cachedPerformance: UserPerformanceData | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches the user's performance data from the API
 */
export async function getUserPerformance(): Promise<UserPerformanceData | null> {
  try {
    // Check if we have cached data that's still fresh
    const now = Date.now()
    if (cachedPerformance && now - lastFetchTime < CACHE_DURATION) {
      console.log("Using cached performance data")
      return cachedPerformance
    }

    // Get user ID from localStorage
    const userId = localStorage.getItem("Medical_User_Id")
    if (!userId) {
      console.log("No user ID found in localStorage")
      return null
    }

    console.log("Fetching performance data for user:", userId)

    // Fetch performance data from API
    const apiUrl = `http://localhost:5000/api/test/get-performance/${userId}`
    console.log("API URL:", apiUrl)

    const response = await axios.get(apiUrl)
    console.log("API response:", response.data)

    if (response.data && response.data.success) {
      // Update cache
      cachedPerformance = response.data.data
      lastFetchTime = now
      console.log("Cached new performance data:", cachedPerformance)
      return cachedPerformance
    } else {
      console.log("API returned unsuccessful response:", response.data)
    }

    return null
  } catch (error) {
    console.error("Error fetching user performance:", error)
    return null
  }
}

/**
 * Gets a personalized message for the create-test page based on user's weak areas
 */
export async function getCreateTestMessage(): Promise<string> {
  try {
    console.log("Getting personalized create test message")
    const performance = await getUserPerformance()
    console.log("Performance data for message:", performance)

    if (!performance || !performance.weakAreas || performance.weakAreas.length === 0) {
      console.log("No performance data or weak areas available, using fallback message")
      // Fallback to default messages if no performance data or weak areas
      return "Create a test to practice and strengthen your medical knowledge."
    }

    // Get the user's weakest areas (up to 2)
    const weakestAreas = performance.weakAreas.slice(0, 2)
    console.log("Weakest areas:", weakestAreas)

    // Create personalized messages based on weak areas
    let message: string
    if (weakestAreas.length === 1) {
      const area = weakestAreas[0]
      message = `Consider focusing on ${area.subsectionName} in ${area.subjectName} - your accuracy is ${Math.round(area.accuracy)}%.`
    } else {
      message = `Your data suggests focusing on ${weakestAreas[0].subsectionName} and ${weakestAreas[1].subsectionName} to improve your performance.`
    }

    console.log("Generated personalized message:", message)
    return message
  } catch (error) {
    console.error("Error getting create test message:", error)
    return "Create a test tailored to your learning needs."
  }
}
