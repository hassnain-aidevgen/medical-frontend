"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, DonutChart, LineChart, PieChart } from "@/components/ui/charts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, BarChart3, Calendar, Download, LineChartIcon, PieChartIcon, TrendingUp, Users } from "lucide-react"
import { useState } from "react"

// Mock data for charts
const mockEngagementData = [
    { name: "Jan", value: 400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: 500 },
    { name: "Apr", value: 280 },
    { name: "May", value: 590 },
    { name: "Jun", value: 800 },
    { name: "Jul", value: 810 },
    { name: "Aug", value: 700 },
    { name: "Sep", value: 900 },
    { name: "Oct", value: 870 },
    { name: "Nov", value: 950 },
    { name: "Dec", value: 1100 },
]

const mockBadgeDistributionData = [
    { name: "First Quiz", value: 985 },
    { name: "Perfect Score", value: 342 },
    { name: "Weekly Champion", value: 124 },
    { name: "Quiz Master", value: 87 },
    { name: "Speed Demon", value: 256 },
    { name: "Consistency King", value: 78 },
    { name: "Medical Expert", value: 45 },
    { name: "Rising Star", value: 12 },
]

const mockUserRetentionData = [
    { name: "Week 1", value: 100 },
    { name: "Week 2", value: 85 },
    { name: "Week 3", value: 75 },
    { name: "Week 4", value: 70 },
    { name: "Week 5", value: 65 },
    { name: "Week 6", value: 60 },
    { name: "Week 7", value: 58 },
    { name: "Week 8", value: 55 },
]

const mockBadgeImpactData = [
    { name: "With Badges", engagement: 85, retention: 72, completion: 68 },
    { name: "Without Badges", engagement: 45, retention: 38, completion: 32 },
]

// Mock data for top badges report
const mockTopBadgesReport = [
    { rank: 1, name: "First Quiz", awarded: 985, conversion: "98.5%", engagement: "High" },
    { rank: 2, name: "Speed Demon", awarded: 256, conversion: "25.6%", engagement: "Medium" },
    { rank: 3, name: "Perfect Score", awarded: 342, conversion: "34.2%", engagement: "High" },
    { rank: 4, name: "Weekly Champion", awarded: 124, conversion: "12.4%", engagement: "Very High" },
    { rank: 5, name: "Consistency King", awarded: 78, conversion: "7.8%", engagement: "Very High" },
]

// Mock data for user engagement report
const mockUserEngagementReport = [
    { metric: "Average Quizzes Per User", value: "12.5", change: "+15%", trend: "up" },
    { metric: "Average Badges Per User", value: "4.2", change: "+22%", trend: "up" },
    { metric: "Average Session Duration", value: "8m 45s", change: "+10%", trend: "up" },
    { metric: "Return Rate", value: "68%", change: "+5%", trend: "up" },
    { metric: "Quiz Completion Rate", value: "92%", change: "+3%", trend: "up" },
]

export function ReportsAnalytics() {
    const [timeRange, setTimeRange] = useState("year")

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Analyze the performance of your gamification system.</p>
                </div>
                <div className="flex gap-2">
                    <Select defaultValue={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="badges">Badge Analytics</TabsTrigger>
                    <TabsTrigger value="users">User Engagement</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,248</div>
                                <p className="text-xs text-muted-foreground">+12% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Badges Awarded</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">8,745</div>
                                <p className="text-xs text-muted-foreground">+24% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Badges/User</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">7.0</div>
                                <p className="text-xs text-muted-foreground">+8% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">78%</div>
                                <p className="text-xs text-muted-foreground">+5% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Engagement</CardTitle>
                                <CardDescription>Monthly user engagement metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <LineChart
                                        data={mockEngagementData}
                                        index="name"
                                        categories={["value"]}
                                        colors={["primary"]}
                                        valueFormatter={(value) => `${value} users`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Badge Distribution</CardTitle>
                                <CardDescription>Most frequently awarded badges</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <PieChart
                                        data={mockBadgeDistributionData}
                                        index="name"
                                        categories={["value"]}
                                        colors={[
                                            "primary",
                                            "secondary",
                                            "accent",
                                            "destructive",
                                            "muted",
                                            "primary",
                                            "secondary",
                                            "accent",
                                        ]}
                                        valueFormatter={(value) => `${value} awards`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Badge Impact Analysis</CardTitle>
                            <CardDescription>Comparing metrics for users with and without badges</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <BarChart
                                    data={mockBadgeImpactData}
                                    index="name"
                                    categories={["engagement", "retention", "completion"]}
                                    colors={["primary", "secondary", "accent"]}
                                    valueFormatter={(value) => `${value}%`}
                                    className="h-full w-full"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Badge Analytics Tab */}
                <TabsContent value="badges" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">32</div>
                                <p className="text-xs text-muted-foreground">+2 from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Badges Awarded</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">8,745</div>
                                <p className="text-xs text-muted-foreground">+24% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">First Quiz</div>
                                <p className="text-xs text-muted-foreground">985 times awarded</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rarest Badge</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Rising Star</div>
                                <p className="text-xs text-muted-foreground">12 times awarded</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Badge Distribution</CardTitle>
                                <CardDescription>Breakdown of badge awards</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <DonutChart
                                        data={mockBadgeDistributionData}
                                        index="name"
                                        categories={["value"]}
                                        colors={[
                                            "primary",
                                            "secondary",
                                            "accent",
                                            "destructive",
                                            "muted",
                                            "primary",
                                            "secondary",
                                            "accent",
                                        ]}
                                        valueFormatter={(value) => `${value} awards`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Badge Awards Over Time</CardTitle>
                                <CardDescription>Monthly badge award trends</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <LineChart
                                        data={mockEngagementData}
                                        index="name"
                                        categories={["value"]}
                                        colors={["primary"]}
                                        valueFormatter={(value) => `${value} badges`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Badges Report</CardTitle>
                            <CardDescription>Most effective badges by engagement and conversion</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Badge Name</TableHead>
                                        <TableHead>Times Awarded</TableHead>
                                        <TableHead>User Conversion</TableHead>
                                        <TableHead>Engagement Impact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockTopBadgesReport.map((badge) => (
                                        <TableRow key={badge.rank}>
                                            <TableCell className="font-medium">#{badge.rank}</TableCell>
                                            <TableCell>{badge.name}</TableCell>
                                            <TableCell>{badge.awarded}</TableCell>
                                            <TableCell>{badge.conversion}</TableCell>
                                            <TableCell>{badge.engagement}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* User Engagement Tab */}
                <TabsContent value="users" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">876</div>
                                <p className="text-xs text-muted-foreground">+8% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">8m 45s</div>
                                <p className="text-xs text-muted-foreground">+15% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">15,642</div>
                                <p className="text-xs text-muted-foreground">+22% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">68%</div>
                                <p className="text-xs text-muted-foreground">+5% from last {timeRange}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Retention</CardTitle>
                                <CardDescription>Weekly user retention rates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <LineChart
                                        data={mockUserRetentionData}
                                        index="name"
                                        categories={["value"]}
                                        colors={["primary"]}
                                        valueFormatter={(value) => `${value}%`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Badge Impact on Engagement</CardTitle>
                                <CardDescription>Comparing users with and without badges</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <BarChart
                                        data={mockBadgeImpactData}
                                        index="name"
                                        categories={["engagement", "retention", "completion"]}
                                        colors={["primary", "secondary", "accent"]}
                                        valueFormatter={(value) => `${value}%`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>User Engagement Metrics</CardTitle>
                            <CardDescription>Key performance indicators for user engagement</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Metric</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Change</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockUserEngagementReport.map((metric) => (
                                        <TableRow key={metric.metric}>
                                            <TableCell className="font-medium">{metric.metric}</TableCell>
                                            <TableCell>{metric.value}</TableCell>
                                            <TableCell className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                                                {metric.change}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Badge Performance</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Report
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Report
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">System Performance</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Report
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Report Builder</CardTitle>
                            <CardDescription>Create custom reports based on your specific needs</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Report Type</label>
                                    <Select defaultValue="badges">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select report type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="badges">Badge Analytics</SelectItem>
                                            <SelectItem value="users">User Engagement</SelectItem>
                                            <SelectItem value="performance">System Performance</SelectItem>
                                            <SelectItem value="custom">Custom Metrics</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Time Period</label>
                                    <Select defaultValue="month">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select time period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">Last Week</SelectItem>
                                            <SelectItem value="month">Last Month</SelectItem>
                                            <SelectItem value="quarter">Last Quarter</SelectItem>
                                            <SelectItem value="year">Last Year</SelectItem>
                                            <SelectItem value="custom">Custom Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Metrics to Include</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Button variant="outline" className="justify-start">
                                        <input type="checkbox" className="mr-2" defaultChecked />
                                        Badge Distribution
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <input type="checkbox" className="mr-2" defaultChecked />
                                        User Engagement
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <input type="checkbox" className="mr-2" defaultChecked />
                                        Retention Metrics
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <input type="checkbox" className="mr-2" />
                                        Conversion Rates
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <input type="checkbox" className="mr-2" />
                                        User Demographics
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <input type="checkbox" className="mr-2" />
                                        Performance Trends
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Chart Types</label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <Button variant="outline" className="justify-start">
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        Bar Charts
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <LineChartIcon className="mr-2 h-4 w-4" />
                                        Line Charts
                                    </Button>
                                    <Button variant="outline" className="justify-start">
                                        <PieChartIcon className="mr-2 h-4 w-4" />
                                        Pie Charts
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline">Save Template</Button>
                                <Button>Generate Report</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

