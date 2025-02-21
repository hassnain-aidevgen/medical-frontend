"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAuthToken } from "@/utils/auth";
import axios from "axios";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

const LoginPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await axios.post("http://localhost:5000/api/auth/login", formData)

      if (response.status === 200) {
        console.log("Printing: ", response.data.token)
        setAuthToken(response.data.token)
        localStorage.setItem("authToken", response.data.token)

        console.log(response.data);
        if (response.data.role == "admin") {
          router.push("/admin")
          return
        }

        // Check if the user is new based on the response
        if (response.data.isNewUser) {
          setMessage({ type: "success", text: "New user! Redirecting to signup..." })
          setTimeout(() => router.push("/signup"), 2000) // Redirect to signup
        } else {
          setMessage({ type: "success", text: "Login successful! Redirecting..." })
          setTimeout(() => router.push("/dashboard"), 2000) // Redirect to dashboard for existing user
        }
      } else {
        setMessage({ type: "error", text: response.data.message || "Login failed, please try again." })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      console.log("Login Error:", error.response?.data?.message || "Unknown error")
      setMessage({ type: "error", text: error.response?.data?.message || "Login failed, please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    router.push("http://localhost:5000/api/auth/google")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Log  in to access your account</p>
        </div>
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
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
              <Label htmlFor="password">Password</Label>
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
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.login className="mr-2 h-4 w-4" />
            )}
            Log in
          </Button>

          <Button className="w-full" onClick={handleGoogleLogin} disabled={isLoading} type="button">
            <FcGoogle /> <span>Continue with Google</span>
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

