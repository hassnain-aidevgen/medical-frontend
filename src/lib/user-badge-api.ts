import axios from "axios"

// Base API URL - you may need to adjust this based on your environment
const API_BASE_URL = "http://localhost:5000/api/user-badges"

export const userBadgeApi = {
  // Get all badges for a specific user
  getUserBadges: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getUserBadges/user/${userId}`)
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch user badges",
      }
    }
  },

  // Assign a badge to a user
  assignBadge: async (userId: string, badgeId: string, awardReason?: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/assignBadge`, {
        userId,
        badgeId,
        awardReason,
      })
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to assign badge",
      }
    }
  },

  // Revoke a badge from a user
  revokeBadge: async (userBadgeId: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/revokeBadge/user-badges/${userBadgeId}`)
      return {
        success: true,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to revoke badge",
      }
    }
  },

  // Check if a user has a specific badge
  checkUserBadge: async (userId: string, badgeId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/checkUserBadge/${userId}/${badgeId}`)
      return {
        success: true,
        hasBadge: response.data.data.hasBadge,
        badgeDetails: response.data.data.badgeDetails,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to check badge status",
      }
    }
  },

  // Get badge award statistics
  getBadgeStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getBadgeAwardStats`)
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch badge statistics",
      }
    }
  },

  // Get users who have a specific badge
  getBadgeUsers: async (badgeId: string, page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getBadgeUsers/badge/${badgeId}?page=${page}&limit=${limit}`)
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch badge users",
      }
    }
  },
}

