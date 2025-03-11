"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Award, BadgeCheck, Star, TrendingUp, Trophy, Users } from "lucide-react"
import { useState } from "react"

// Mock data for the dashboard
const mockStats = {
    totalUsers: 1248,
    activeBadges: 32,
    badgesAwarded: 8745,
    engagementRate: 78,
    recentActivity: [
        { id: 1, user: "John Doe", action: "Earned 'First Quiz' badge", time: "2 minutes ago" },
        { id: 2, user: "Jane Smith", action: "Completed 10 quizzes", time: "15 minutes ago" },
        { id: 3, user: "Alex Johnson", action: "Reached rank #1 on weekly leaderboard", time: "1 hour ago" },
        { id: 4, user: "Sarah Williams", action: "Earned 'Perfect Score' badge", time: "2 hours ago" },
        { id: 5, user: "Michael Brown", action: "Completed 5 quizzes in a row", time: "3 hours ago" },
    ],
    topBadges: [
        { id: 1, name: "First Quiz", awarded: 985, icon: "🏆" },
        { id: 2, name: "Perfect Score", awarded: 342, icon: "⭐" },
        { id: 3, name: "Weekly Champion", awarded: 124, icon: "🥇" },
        { id: 4, name: "Quiz Master", awarded: 87, icon: "🧠" },
    ],
    topUsers: [
        { id: 1, name: "Alex Johnson", badges: 24, score: 9850 },
        { id: 2, name: "Sarah Williams", badges: 22, score: 9200 },
        { id: 3, name: "Michael Brown", badges: 19, score: 8750 },
        { id: 4, name: "Jane Smith", badges: 18, score: 8500 },
    ],
}

export function DashboardOverview() {
    const [timeRange, setTimeRange] = useState("week")

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground">Monitor your gamification system performance and user engagement.</p>
                </div>
                <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange} className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                        <TabsTrigger value="year">Year</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockStats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">+12% from last {timeRange}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Badges</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockStats.activeBadges}</div>
                        <p className="text-xs text-muted-foreground">+2 new badges this {timeRange}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Badges Awarded</CardTitle>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockStats.badgesAwarded}</div>
                        <p className="text-xs text-muted-foreground">+24% from last {timeRange}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockStats.engagementRate}%</div>
                        <p className="text-xs text-muted-foreground">+5% from last {timeRange}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity and insights */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest user achievements and badge awards</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockStats.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <Activity className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{activity.user}</p>
                                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Badges</CardTitle>
                        <CardDescription>Most frequently awarded badges</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockStats.topBadges.map((badge) => (
                                <div key={badge.id} className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2 rounded-full flex items-center justify-center w-10 h-10">
                                        <span className="text-xl">{badge.icon}</span>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{badge.name}</p>
                                        <p className="text-xs text-muted-foreground">Awarded {badge.awarded} times</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top users */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Users</CardTitle>
                    <CardDescription>Users with the highest engagement and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {mockStats.topUsers.map((user, index) => (
                            <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg border">
                                <div className="relative">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Trophy className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="flex items-center">
                                            <Award className="h-3 w-3 mr-1" />
                                            {user.badges}
                                        </div>
                                        <div className="flex items-center">
                                            <Star className="h-3 w-3 mr-1" />
                                            {user.score}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

