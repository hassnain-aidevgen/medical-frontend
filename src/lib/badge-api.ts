import type { Badge } from "@/types/badge"
import axios from "axios"

const BASE_API_URL = "http://localhost:5000/api/badges"

// Add request and response timeout
const api = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error("API Request Error:", error)
    return Promise.reject(error)
  },
)

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network Error:", error.message)
      return Promise.reject({
        success: false,
        error: "Network error. Please check your connection.",
      })
    }

    // Handle API errors
    console.error("API Error:", error.response?.data)
    return Promise.reject({
      success: false,
      error: error.response?.data?.message || "An error occurred",
      errors: error.response?.data?.errors || [],
      status: error.response?.status,
    })
  },
)

export const badgeApi = {
  // Get all badges
  getAllBadges: async () => {
    try {
      const response = await api.get(BASE_API_URL)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: any) {
      console.error("Error fetching badges:", error)
      return {
        success: false,
        error: error.error || "Failed to fetch badges",
      }
    }
  },

  // Get a single badge
  getBadge: async (id: string) => {
    try {
      const response = await api.get(`${BASE_API_URL}/${id}`)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: any) {
      console.error(`Error fetching badge ${id}:`, error)
      return {
        success: false,
        error: error.error || `Failed to fetch badge ${id}`,
      }
    }
  },

  // Create a new badge
  createBadge: async (badgeData: Omit<Badge, "_id">) => {
    try {
      const response = await api.post(BASE_API_URL, badgeData)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: any) {
      console.error("Error creating badge:", error)
      return {
        success: false,
        error: error.error || "Failed to create badge",
        errors: error.errors || [],
      }
    }
  },

  // Update a badge
  updateBadge: async (id: string, badgeData: Partial<Badge>) => {
    try {
      const response = await api.put(`${BASE_API_URL}/${id}`, badgeData)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: any) {
      console.error(`Error updating badge ${id}:`, error)
      return {
        success: false,
        error: error.error || `Failed to update badge ${id}`,
        errors: error.errors || [],
      }
    }
  },

  // Delete a badge
  deleteBadge: async (id: string) => {
    try {
      const response = await api.delete(`${BASE_API_URL}/${id}`)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: any) {
      console.error(`Error deleting badge ${id}:`, error)
      return {
        success: false,
        error: error.error || `Failed to delete badge ${id}`,
      }
    }
  },
}
