import axios from "axios"

// Base API URL - you may need to adjust this based on your environment
const API_BASE_URL = "http://localhost:5000/api/user-badges"

export const userApi = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/test/leaderboard`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch users",
      }
    }
  },

  // Get a specific user
  getUser: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`)
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch user",
      }
    }
  },

  // Get user progress and statistics
  getUserProgress: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/progress`)
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch user progress",
      }
    }
  },
}

