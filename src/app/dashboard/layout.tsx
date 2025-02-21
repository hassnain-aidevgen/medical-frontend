"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Inter } from "next/font/google"
import "../globals.css"

import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ... (keep the existing useEffect and state logic)

  const [isOpen, setIsShowSidebar] = useState(true)

  const toggleSidebar = () => {
    setIsShowSidebar((prev) => !prev)
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-100">
          <div className="flex-shrink-0">
            <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar toggleSidebar={toggleSidebar} />
            <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}

