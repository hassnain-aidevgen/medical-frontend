"use client"

import { Card } from "@/components/ui/card"
import { Info, TrendingUp, Users, Award, Target } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

interface ProgressInsightsProps {
  userId: string | null
  score: number
  specialty?: string
  targetExam?: string
  className?: string
  rank?: number
  totalUsers?: number
}

export default function ProgressInsights({ 
  userId, 
  score, 
  specialty, 
  targetExam, 
  className = "",
  rank,
  totalUsers
}: ProgressInsightsProps) {
  const [insights, setInsights] = useState<{
    percentile: number;
    usersBelow: number;
    specialty?: string;
    targetExam?: string;
  } | null>(null)
  
  useEffect(() => {
    // Only calculate insights if we have the necessary data
    if (!userId || !rank || !totalUsers) return
    
    // Calculate actual percentile based on rank and total users
    const percentile = Math.round(((totalUsers - rank) / totalUsers) * 100)
    
    // Calculate how many users are below the current user
    const usersBelow = totalUsers - rank
    
    setInsights({
      percentile,
      usersBelow,
      specialty,
      targetExam
    })
  }, [userId, rank, totalUsers, specialty, targetExam])
  
  if (!insights) {
    return null
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          Performance Insights
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-full p-1 hover:bg-muted cursor-help">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs max-w-[200px]">
                Insights are based on your current ranking compared to other users.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Card className="p-3 bg-muted/30">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm">
                You&apos;re ahead of <span className="font-medium">{insights.percentile}%</span> of users
                {insights.specialty ? ` in ${insights.specialty}` : ''}
                {insights.targetExam ? ` preparing for ${insights.targetExam}` : ''}.
              </p>
            </div>
          </div>
          
          {insights.usersBelow > 0 && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm">
                  You&apos;re performing better than <span className="font-medium">{insights.usersBelow}</span> {insights.usersBelow === 1 ? 'user' : 'users'}.
                </p>
              </div>
            </div>
          )}
          
          {rank && (
            <div className="flex items-start gap-2">
              <Award className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm">
                  Your current rank is <span className="font-medium">#{rank}</span> out of {totalUsers} users.
                </p>
              </div>
            </div>
          )}
          
          {score > 0 && (
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm">
                  Your total score is <span className="font-medium text-green-500">{score}</span> points.
                </p>
              </div>
            </div>
          )}
          
          {insights.targetExam && (
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm">
                  Your focus area is <span className="font-medium">{insights.targetExam}</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}