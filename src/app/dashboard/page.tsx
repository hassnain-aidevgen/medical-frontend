"use client"

import { BarChart2, BookOpen, Clock, Dna, Settings, Users } from "lucide-react"
import { PiRankingDuotone } from "react-icons/pi"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const featureCards = [
  { name: "Create Test", icon: BookOpen, href: "/dashboard/create-test", color: "bg-blue-500" },
  { name: "Flash Cards", icon: Users, href: "/dashboard/flash-cards", color: "bg-green-500" },
  { name: "Leaderboard", icon: PiRankingDuotone, href: "/dashboard/leaderboard", color: "bg-yellow-500" },
  { name: "Performance", icon: BarChart2, href: "/dashboard/performance-tracking", color: "bg-purple-500" },
  { name: "Smart Study", icon: BookOpen, href: "/dashboard/smart-study", color: "bg-pink-500" },
  { name: "Weekly Goals", icon: Settings, href: "/dashboard/custom-weekly-goals", color: "bg-indigo-500" },
  { name: "Error Notebook", icon: Users, href: "/dashboard/digital-error-notebook", color: "bg-red-500" },
  { name: "Pomodoro", icon: Clock, href: "/dashboard/pomodoro-timer", color: "bg-orange-500" },
]


export default function DashboardPage() {

  return (
    <div className="flex-1 space-y-4 p-4 md:pl-8 md:pr-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, Student!</h2>
        {/* <Button>Start Studying</Button> */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Dna className="h-6 w-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 Days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal Progress</CardTitle>
            <Settings className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <Progress value={75} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Pomodoro</CardTitle>
            <Clock className="h-6 w-6 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25:00</div>
            <p className="text-xs text-muted-foreground">Click to start</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
            <PiRankingDuotone className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#12</div>
            <p className="text-xs text-muted-foreground">Top 5% this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Study Time This Week</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studyTimeData}>
                <Bar dataKey="hours" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}
        <Card className="col-span-4 md:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access key features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featureCards.map((feature) => (
                <Button
                  key={feature.name}
                  variant="outline"
                  className="h-24 w-full flex flex-col items-center justify-center text-center p-2"
                  asChild
                >
                  <a href={feature.href}>
                    <div className={`${feature.color} rounded-full p-3 mb-2`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-xs font-medium">{feature.name}</span>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
