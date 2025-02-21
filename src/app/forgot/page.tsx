"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("https://medical-backend-loj4.onrender.com/api/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err: unknown) {
      console.error("Forgot Password error:", err);
      if (axios.isAxiosError(err) && err.response) {
        setMessage(err.response.data.message || "Error sending reset link.");
      } else {
        setMessage("Error sending reset link.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bio-theme">
      <div className="bio-card w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bio-button bio-button-forgot w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Reset Password"}
          </button>
        </form>
        {message && <p className="mt-4 text-green-600">{message}</p>}
        <div className="mt-4 text-sm">
          <Link href="/login" className="text-orange-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
