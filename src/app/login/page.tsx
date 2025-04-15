"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setAuthToken } from "@/utils/auth"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"
import { FcGoogle } from "react-icons/fc"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

const LoginPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: "", password: "", role: "user" })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    toast.dismiss()
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prevData) => ({
      ...prevData,
      [event.target.name]: event.target.value,
    }))
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setMessage(null)
    localStorage.removeItem("authToken")

    try {
      const response = await axios.post("https://medical-backend-loj4.onrender.com/api/auth/login", formData)

      if (response.status === 200) {
        setAuthToken(response.data.token)
        localStorage.setItem("authToken", response.data.token)
        localStorage.setItem("name", response.data?.name)
        localStorage.setItem("email", response.data?.email)

        if (response.data.role === "admin") {
          toast.success("Admin login successful!")
          router.push("/admin")
          return
        }

        if (response.data.isNewUser) {
          setMessage({ type: "success", text: "New user! Redirecting to signup..." })
          toast.success("New user detected! Redirecting to complete your profile.")
          setTimeout(() => router.push("/signup"), 2000)
        } else {
          setMessage({ type: "success", text: "Login successful! Redirecting..." })
          toast.success("Login successful! Redirecting to dashboard.")
          setTimeout(() => router.push("/dashboard"), 2000)
        }
      } else {
        setMessage({ type: "error", text: response.data.message || "Login failed, please try again." })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMessage = error.response?.data?.message || "Login failed, please try again."
      setMessage({ type: "error", text: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    router.push("https://medical-backend-loj4.onrender.com/api/auth/google")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "8px",
            padding: "16px",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "white",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "white",
            },
          },
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6 bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl"
      >
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Log in to access your account</p>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg p-4 ${
                message.type === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-green-50 text-green-800 border border-green-200"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {message.type === "error" ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">{message.type === "error" ? "Error" : "Success"}</h3>
                  <div className="mt-1 text-sm">{message.text}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                required
                className="mt-1"
                placeholder="you@example.com"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                className="mt-1"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <p
                  onClick={() => router.push("/forgot")}
                  className="cursor-pointer text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Forgot Password?
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </span>
            ) : (
              <span>Log in</span>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
          >
            <FcGoogle className="mr-2 h-5 w-5" /> Google
          </Button>
        </form>

        <div className="text-sm text-center">
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
