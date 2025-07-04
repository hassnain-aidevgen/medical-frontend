/**
 * Helper functions for API calls
 */

// Get the user ID from localStorage
export function getUserId(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("Medical_User_Id");
  }
  return null;
}

// Base URL for API calls
export const API_BASE_URL = "https://medical-backend-3eek.onrender.com/api/v3";

// Flashcards endpoint
export const FLASHCARDS_ENDPOINT = `${API_BASE_URL}/flashcards`;

// Get URL with userId parameter
export function getUrlWithUserId(endpoint: string): string {
  const userId = getUserId();
  return `${endpoint}?userId=${userId}`;
}

// Add auth header to requests
export function getAuthHeader() {
  const userId = getUserId();
  return {
    headers: {
      Authorization: `Bearer ${userId}`,
      "Content-Type": "application/json",
    },
  };
}
