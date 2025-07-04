"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Crown, Medal, Star, Timer, Trophy, User } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import CountryLeaderboard from "./country-leaderboard"
import ExamLeaderboard from "./exam-leaderboard"
import SpecialtyFilters from "./specialty-filters"
import StreakLeaderboard from "./streak-leaderboard"
import type { Badge, LeaderboardEntry, StreakEntry } from "./types"
import UserBadges from "./user-badges"

// Define the valid tab types
type TabType = "weekly" | "monthly" | "all-time" | "specialty" | "country" | "streaks" | "exams"

interface LeaderboardLayoutProps {
    loggedInUserId: string | null
    leaderboardData: {
        weekly: LeaderboardEntry[]
        monthly: LeaderboardEntry[]
        "all-time": LeaderboardEntry[]
    }
    userBadges: Badge[]
}

export default function LeaderboardLayout({ loggedInUserId, leaderboardData, userBadges }: LeaderboardLayoutProps) {
    const [activeTab, setActiveTab] = useState<TabType>("all-time")

    const [specialtyRankings, setSpecialtyRankings] = useState<{
        totalSpecialties: number
        lastUpdated: string
        rankings: Array<{
            specialty: string
            userCount: number
            users: Array<{
                rank: number
                userId: string
                userName: string
                successRate: number
                questionsAttempted: number
                correctAnswers: number
                averageTimePerQuestion: number
                totalTimeSpent: number
                bestTest: {
                    testId: string
                    score: number
                    timeSpent: number
                    date: string
                }
            }>
        }>
    } | null>(null)
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
    const [filteredSpecialtyRankings, setFilteredSpecialtyRankings] = useState<Array<any>>([])
    const [loadingSpecialty, setLoadingSpecialty] = useState(false)

    const formatTime = (totalTime: number) => {
        const minutes = Math.floor(totalTime / 60)
        const seconds = totalTime % 60
        return `${minutes}m ${seconds}s`
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-5 w-5 text-yellow-500" />
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />
            default:
                return null
        }
    }

    const getRowStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-950/50 dark:to-transparent"
            case 2:
                return "bg-gradient-to-r from-gray-300/10 to-transparent dark:from-gray-800/50 dark:to-transparent"
            case 3:
                return "bg-gradient-to-r from-amber-500/10 to-transparent dark:from-amber-950/50 dark:to-transparent"
            default:
                return ""
        }
    }

    // Get current data based on active tab
    const currentLeaderboard =
        activeTab === "specialty" || activeTab === "country" || activeTab === "streaks" || activeTab === "exams"
            ? []
            : leaderboardData[activeTab] || []

    const fetchSpecialtyRankings = useCallback(async () => {
        try {
            setLoadingSpecialty(true)
            const response = await fetch(`https://medical-backend-3eek.onrender.com/api/test/specialty-ranking`)

            if (!response.ok) {
                throw new Error(`Failed to fetch specialty rankings: ${response.status}`)
            }

            const data = await response.json()
            setSpecialtyRankings(data)

            // Initialize filtered rankings with all specialties
            setFilteredSpecialtyRankings(data.rankings)

            // Set the first specialty as selected by default
            if (data.rankings.length > 0 && !selectedSpecialty) {
                setSelectedSpecialty(data.rankings[0].specialty)
            }
        } catch (error) {
            console.error("Error fetching specialty rankings:", error)
        } finally {
            setLoadingSpecialty(false)
        }
    }, [selectedSpecialty])

    const handleSpecialtySelect = useCallback(
        (specialty: string) => {
            setSelectedSpecialty(specialty)

            if (specialty === "all") {
                // Reset to show all specialties
                if (specialtyRankings) {
                    setFilteredSpecialtyRankings(specialtyRankings.rankings)
                }
                return
            }

            if (specialtyRankings) {
                const filtered = specialtyRankings.rankings.filter((ranking) => ranking.specialty === specialty)
                setFilteredSpecialtyRankings(filtered)
            }
        },
        [specialtyRankings],
    )

    const getAllSpecialties = useCallback(() => {
        if (!specialtyRankings) return []
        return specialtyRankings.rankings.map((ranking) => ranking.specialty)
    }, [specialtyRankings])

    useEffect(() => {
        if (activeTab === "specialty" && !specialtyRankings) {
            fetchSpecialtyRankings()
        }
    }, [activeTab, fetchSpecialtyRankings, specialtyRankings])

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col space-y-6">
                {/* Header with title */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
                    <p className="text-muted-foreground">Track your progress and see how you compare with others</p>
                </div>

                {/* Tabs navigation */}
                <Card className="p-4">
                    <Tabs defaultValue="all-time" value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
                        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 mb-4 gap-1 overflow-x-auto">
                            <TabsTrigger value="weekly" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                                Weekly
                            </TabsTrigger>
                            <TabsTrigger value="monthly" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                                Monthly
                            </TabsTrigger>
                            <TabsTrigger value="all-time" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                                All Time
                            </TabsTrigger>
                            <TabsTrigger value="specialty" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                                Specialty
                            </TabsTrigger>
                            <TabsTrigger value="country" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                                Country
                            </TabsTrigger>
                            <TabsTrigger value="streaks" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                                Streaks
                            </TabsTrigger>
                            <TabsTrigger value="exams" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                                Exams
                            </TabsTrigger>
                        </TabsList>

                        {/* Content area with left and right columns */}
                        <div className="flex flex-col md:flex-row gap-6 mt-6">
                            {/* Main content (left column) */}
                            <div className="flex-1">
                                {activeTab !== "country" &&
                                    activeTab !== "streaks" &&
                                    activeTab !== "exams" &&
                                    activeTab !== "specialty" && (
                                        <ScrollArea className="h-[600px] w-full rounded-md border">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                                    <TableRow>
                                                        <TableHead className="w-20">Rank</TableHead>
                                                        <TableHead>Player</TableHead>
                                                        <TableHead className="text-right">Score</TableHead>
                                                        <TableHead className="text-right">Time</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {currentLeaderboard.length > 0 ? (
                                                        currentLeaderboard.map((entry, index) => (
                                                            <TableRow
                                                                key={entry._id}
                                                                className={`${getRowStyle(index + 1)} ${entry.userId === loggedInUserId ? "border-l-2 border-primary" : ""
                                                                    }`}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        {getRankIcon(index + 1)}
                                                                        {index + 1}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        {index < 3 && <Crown className="h-4 w-4 text-primary" />}
                                                                        {entry.name}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <Star className="h-4 w-4 text-primary" />
                                                                        {entry.score}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <Timer className="h-4 w-4 text-muted-foreground" />
                                                                        {formatTime(entry.totalTime)}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center py-8">
                                                                <p className="text-muted-foreground">No data available for this time period</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}

                                {activeTab === "specialty" && (
                                    <div className="relative">
                                        {loadingSpecialty && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-md">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                            </div>
                                        )}

                                        {/* Specialty Filters */}
                                        {specialtyRankings && (
                                            <SpecialtyFilters
                                                specialties={getAllSpecialties()}
                                                selectedSpecialty={selectedSpecialty}
                                                onSpecialtySelect={handleSpecialtySelect}
                                                className="mb-4"
                                            />
                                        )}

                                        <ScrollArea className="h-[600px] w-full rounded-md border">
                                            {specialtyRankings && filteredSpecialtyRankings.length > 0 ? (
                                                <div className="space-y-6 p-4">
                                                    {filteredSpecialtyRankings.map((specialtyData) => (
                                                        <div key={specialtyData.specialty} className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="text-lg font-bold">{specialtyData.specialty}</h3>
                                                                <span className="text-sm text-muted-foreground">{specialtyData.userCount} users</span>
                                                            </div>

                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-16">Rank</TableHead>
                                                                        <TableHead>Player</TableHead>
                                                                        <TableHead className="text-right">Success Rate</TableHead>
                                                                        <TableHead className="text-right">Questions</TableHead>
                                                                        <TableHead className="text-right">Avg. Time</TableHead>
                                                                        <TableHead className="text-right">Best Score</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {specialtyData.users.map(
                                                                        (user: {
                                                                            rank: number
                                                                            userId: string
                                                                            userName: string
                                                                            successRate: number
                                                                            questionsAttempted: number
                                                                            correctAnswers: number
                                                                            averageTimePerQuestion: number
                                                                            bestTest: {
                                                                                testId: string
                                                                                score: number
                                                                                timeSpent: number
                                                                                date: string
                                                                            }
                                                                        }) => (
                                                                            <TableRow
                                                                                key={`${specialtyData.specialty}-${user.userId}`}
                                                                                className={`${user.rank <= 3 ? getRowStyle(user.rank) : ""} ${user.userId === loggedInUserId ? "border-l-2 border-primary" : ""
                                                                                    }`}
                                                                            >
                                                                                <TableCell className="font-medium">
                                                                                    <div className="flex items-center gap-2">
                                                                                        {getRankIcon(user.rank)}
                                                                                        {user.rank}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <div className="flex items-center gap-2">
                                                                                        {user.rank <= 3 && <Crown className="h-4 w-4 text-primary" />}
                                                                                        {user.userName}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex items-center justify-end gap-2">
                                                                                        <span
                                                                                            className={`font-medium ${user.successRate >= 90
                                                                                                    ? "text-green-500"
                                                                                                    : user.successRate >= 70
                                                                                                        ? "text-amber-500"
                                                                                                        : "text-red-500"
                                                                                                }`}
                                                                                        >
                                                                                            {user.successRate.toFixed(1)}%
                                                                                        </span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex items-center justify-end gap-2">
                                                                                        <span>
                                                                                            {user.correctAnswers}/{user.questionsAttempted}
                                                                                        </span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex items-center justify-end gap-2">
                                                                                        <Timer className="h-4 w-4 text-muted-foreground" />
                                                                                        <span>{user.averageTimePerQuestion}s</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex items-center justify-end gap-2">
                                                                                        <Star className="h-4 w-4 text-primary" />
                                                                                        <span className="font-medium">{user.bestTest.score}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ),
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    ))}
                                                    <div className="text-xs text-muted-foreground text-right pt-2">
                                                        Last updated:{" "}
                                                        {specialtyRankings ? new Date(specialtyRankings.lastUpdated).toLocaleString() : ""}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-40">
                                                    <p className="text-muted-foreground">
                                                        {loadingSpecialty ? "Loading specialty rankings..." : "No specialty ranking data available"}
                                                    </p>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                )}

                                {activeTab === "country" && (
                                    <CountryLeaderboard
                                        timeFrame="all-time"
                                        loggedInUserId={loggedInUserId}
                                        globalLeaderboard={leaderboardData["all-time"]}
                                    />
                                )}

                                {activeTab === "streaks" && (
                                    <StreakLeaderboard
                                        timeFrame="all-time"
                                        loggedInUserId={loggedInUserId}
                                        globalLeaderboard={leaderboardData["all-time"] as unknown as StreakEntry[]}
                                    />
                                )}

                                {activeTab === "exams" && (
                                    <ExamLeaderboard loggedInUserId={loggedInUserId} globalLeaderboard={leaderboardData["all-time"]} />
                                )}
                            </div>

                            {/* Sidebar (right column) - Only show for weekly, monthly, and all-time tabs */}
                            {(activeTab === "weekly" || activeTab === "monthly" || activeTab === "all-time") && (
                                <div className="w-full md:w-96">
                                    <Card className="p-6">
                                        {loggedInUserId ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-xl font-bold">Your Stats</h3>
                                                    <p className="text-sm text-muted-foreground">Track your progress and achievements</p>
                                                </div>

                                                {/* User profile summary */}
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="p-3 rounded-full bg-primary/10">
                                                            <User className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {currentLeaderboard.find((entry) => entry.userId === loggedInUserId)?.name || "User"}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Rank #
                                                                {currentLeaderboard.findIndex((entry) => entry.userId === loggedInUserId) + 1 || "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* User badges */}
                                                {userBadges.length > 0 && <UserBadges badges={userBadges} />}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <User className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-xl font-bold mb-2">Sign in to view your stats</h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    Sign in to track your progress and see how you compare with others.
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            )}
                        </div>
                    </Tabs>
                </Card>
            </div>
        </div>
    )
}