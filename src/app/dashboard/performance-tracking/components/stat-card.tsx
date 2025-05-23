"use client"

import { motion } from "framer-motion"
import type { StatCardProps } from "../types"

export const StatCard = ({ icon, title, value, subtitle, color = "blue" }: StatCardProps) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl shadow-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-90`}></div>
      <div className="relative p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs mt-1 opacity-80">{subtitle}</p>}
          </div>
          <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
        </div>
      </div>
    </motion.div>
  )
}
