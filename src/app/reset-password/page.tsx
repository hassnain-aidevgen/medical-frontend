"use client";

import { useState } from "react"; // Removed useEffect
import { useSearchParams } from "next/navigation";
import axios from "axios";

const ResetPasswordPage = () => {
  
  // const token = localStorage.getItem("authToken");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    console.log("Sending request with:", { email, token, newPassword }); // ✅ Add this line


    try {
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        token,
        newPassword,
      });

      setMessage(res.data.message);
    } catch (err) {
      console.error("Reset Password error:", err);
      if (axios.isAxiosError(err) && err.response) {
        setMessage(err.response.data.message);
      } else {
        setMessage("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bio-theme">
      <div className="bio-card w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Reset Password</h2>
        <form onSubmit={handleResetPassword} className="space-y-4">
        <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New password"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className="bio-button bio-button-reset w-full">Reset Password</button>
        </form>
        {message && <p className="mt-4 text-green-600">{message}</p>}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
