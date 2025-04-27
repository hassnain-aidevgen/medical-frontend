"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

// import { MainNav } from "@/components/main-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { CourseRating } from "./course-rating"
import { applyTopicAndPriceFilters, extractMedicalTopics } from "./filters"

// Import the Course type from the types directory
import type { Course } from "@/types"

// Add the missing properties to the Course type
declare module "@/types" {
  interface Course {
    reviewCount?: number
    examTags?: string[]
    videoUrl?: string
    videos?: {
      title: string
      url: string
      description?: string
      thumbnail?: string
      order?: number
    }[]
    contentLinks: string[]
    examType?: string
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sourceFilter, setSourceFilter] = useState<string[]>([])
  const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([])
  const [examTypeFilter, setExamTypeFilter] = useState("all") // Add exam type filter

  // New filter states
  const [topicFilter, setTopicFilter] = useState("all")
  const [priceCeiling, setPriceCeiling] = useState(1000)
  const [medicalTopics, setMedicalTopics] = useState<string[]>([])
  const [examTypes, setExamTypes] = useState<string[]>([]) // Changed to string array

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch("https://medical-backend-loj4.onrender.com/api/courses/all-courses")
        if (!response.ok) {
          throw new Error("Failed to fetch courses")
        }
        const result = await response.json()
        if (!Array.isArray(result.data)) {
          console.error("Expected an array but got:", result.data)
          return
        }

        // Add mock ratings for testing
        const dataWithRatings = result.data.map((course: any) => {
          // Ensure thumbnail is properly formatted
          if (course.thumbnailUrl && !course.thumbnail) {
            course.thumbnail = course.thumbnailUrl
          }

          return {
            ...course,
            rating: Math.random() * 4 + 1, // Random rating between 1-5
            reviewCount: Math.floor(Math.random() * 100) + 1, // Random number of reviews
          }
        })

        console.log("Courses data:", dataWithRatings)

        // Extract unique exam types as strings
        const uniqueExamTypes = Array.from(
          new Set(
            dataWithRatings
              .filter((course: Course) => course.examType)
              .map((course: Course) => course.examType as string),
          ),
        )

        // Add default exam types if none found
        const defaultExamTypes = ["USMLE_STEP1", "USMLE_STEP2", "USMLE_STEP3"]
        const combinedExamTypes = [...uniqueExamTypes]

        defaultExamTypes.forEach((type) => {
          if (!combinedExamTypes.includes(type)) {
            combinedExamTypes.push(type)
          }
        })

        setExamTypes(combinedExamTypes as string[])
        console.log("Available exam types:", combinedExamTypes)

        setCourses(dataWithRatings)

        // Extract medical topics from course data
        const topics = extractMedicalTopics(dataWithRatings)
        console.log("Extracted medical topics:", topics)
        setMedicalTopics(topics.length > 0 ? topics : ["Cardiology", "Emergency Medicine", "Family Medicine"])
        await fetchPurchasedCourses()
      } catch (error) {
        console.error("Error fetching courses:", error)
        toast.error("Failed to load courses")
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = [...courses]

    if (purchasedCourses.length > 0) {
      console.log("Purchased courses:", purchasedCourses)
      const purchasedIds = purchasedCourses.map((course) => course._id)
      filtered = filtered.filter((course) => !purchasedIds.includes(course._id))
    }
    console.log("Filtered courses:", filtered)

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((course) => course.category === categoryFilter)
    }

    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter((course) => course.level === levelFilter)
    }

    // Apply price range filter
    filtered = filtered.filter((course) => course.price >= priceRange[0] && course.price <= priceRange[1])

    // Apply source filter
    if (sourceFilter.length > 0) {
      filtered = filtered.filter((course) => sourceFilter.includes(course.source))
    }

    // Apply exam type filter - simplified for string exam types
    if (examTypeFilter !== "all") {
      filtered = filtered.filter((course) => course.examType === examTypeFilter)
    }

    // Apply topic and price ceiling filters
    filtered = applyTopicAndPriceFilters(filtered, topicFilter, priceCeiling) as Course[]

    setFilteredCourses(filtered)
  }, [
    searchQuery,
    categoryFilter,
    levelFilter,
    priceRange,
    sourceFilter,
    courses,
    topicFilter,
    priceCeiling,
    purchasedCourses,
    examTypeFilter,
  ])

  const categories = ["Development", "Design", "Data Science", "Business", "Marketing"]
  const levels: Array<Course["level"]> = ["Beginner", "Intermediate", "Advanced"]
  const sources: Array<Course["source"]> = ["internal", "udemy", "coursera", "edx"]

  const handleSourceFilterChange = (source: string) => {
    setSourceFilter((prev) => {
      if (prev.includes(source)) {
        return prev.filter((s) => s !== source)
      } else {
        return [...prev, source]
      }
    })
  }

  // Format exam type for display (replace underscores with spaces, capitalize)
  const formatExamType = (examType: string) => {
    return examType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const fetchPurchasedCourses = async () => {
    try {
      // Assuming we have the user ID stored somewhere (e.g., in localStorage or context)
      const userId = localStorage.getItem("Medical_User_Id") // Replace with your actual user ID source

      if (!userId) {
        console.log("User not logged in, skipping purchased courses fetch")
        return
      }

      const response = await fetch(
        `https://medical-backend-loj4.onrender.com/api/course-purchase/user-courses?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${localStorage.getItem('token')}` // Assuming you use JWT
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch purchased courses")
      }

      const { success, courses } = await response.json()

      if (success) {
        // Add ratings to purchased courses as well
        const purchasedWithRatings = courses.map((course: any) => {
          // Ensure thumbnail is properly formatted
          if (course.thumbnailUrl && !course.thumbnail) {
            course.thumbnail = course.thumbnailUrl
          }

          return {
            ...course,
            rating: Math.random() * 4 + 1,
            reviewCount: Math.floor(Math.random() * 100) + 1,
          }
        })

        setPurchasedCourses(purchasedWithRatings)
      }
    } catch (error) {
      console.error("Error fetching purchased courses:", error)
      toast.error("Failed to load purchased courses")
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      {/* <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center">
                    <MainNav />
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav />
                    </div>
                </div>
            </header> */}
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
              <p className="text-muted-foreground">
                Explore our collection of courses to accelerate your learning journey.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Filter Courses</SheetTitle>
                    <SheetDescription>Narrow down courses based on your preferences.</SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-6 py-6">
                    {/* Exam Type Filter */}
                    {examTypes.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Exam Preparation</h3>
                        <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Exam Types</SelectItem>
                            {examTypes.map((examType) => (
                              <SelectItem key={examType} value={examType}>
                                {formatExamType(examType)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* New Medical Topic Filter */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Medical Topic</h3>
                      <Select value={topicFilter} onValueChange={setTopicFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medical topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Topics</SelectItem>
                          {medicalTopics.map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* New Price Ceiling Filter */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Price Ceiling</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span>Under $</span>
                        <Input
                          type="number"
                          min="0"
                          max="1000"
                          value={priceCeiling}
                          onChange={(e) => setPriceCeiling(Number(e.target.value))}
                          className="w-24"
                        />
                      </div>
                      <Slider
                        min={0}
                        max={1000}
                        step={10}
                        value={[priceCeiling]}
                        onValueChange={(value) => setPriceCeiling(value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Category</h3>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Level</h3>
                      <Select value={levelFilter} onValueChange={setLevelFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {levels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Price Range</h3>
                      <Slider
                        defaultValue={[0, 1000]}
                        max={1000}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                      />
                      <div className="flex items-center justify-between">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Source</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {sources.map((source) => (
                          <div key={source} className="flex items-center space-x-2">
                            <Checkbox
                              id={`source-${source}`}
                              checked={sourceFilter.includes(source)}
                              onCheckedChange={() => handleSourceFilterChange(source)}
                            />
                            <Label htmlFor={`source-${source}`} className="capitalize">
                              {source}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCategoryFilter("all")
                        setLevelFilter("all")
                        setPriceRange([0, 1000])
                        setSourceFilter([])
                        setTopicFilter("all")
                        setPriceCeiling(1000)
                        setExamTypeFilter("all")
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {purchasedCourses.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold tracking-tight mb-6">Your Courses</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {purchasedCourses.map((course) => (
                  <Card key={course._id} className="overflow-hidden flex flex-col">
                    <CardHeader className="p-0">
                      <div className="h-48 w-full bg-muted flex items-center justify-center overflow-hidden">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail || "/placeholder.svg"}
                            alt={course.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Prevent infinite reload by removing the error handler after first error
                              e.currentTarget.onerror = null
                              // Replace with text message
                              e.currentTarget.style.display = "none"
                              e.currentTarget.parentElement?.classList.add("flex", "items-center", "justify-center")
                              const message = document.createElement("span")
                              message.className = "text-muted-foreground"
                              message.textContent = "No image found"
                              e.currentTarget.parentElement?.appendChild(message)
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground">No image available</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{course.category}</Badge>
                        <Badge variant="outline">{course.level}</Badge>
                        {course.examType && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 ml-auto">
                            {formatExamType(course.examType)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mb-2 line-clamp-1">{course.title}</CardTitle>
                      <CourseRating
                        rating={course.rating}
                        reviewCount={course.reviewCount}
                        size="sm"
                        className="mb-2"
                      />
                      <CardDescription className="line-clamp-2 mb-2">{course.description}</CardDescription>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>Instructor: {course.instructor}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-6 pt-0 mt-auto">
                      <div className="flex items-center">
                        <Badge variant="success" className="bg-green-100 text-green-800">
                          Purchased
                        </Badge>
                      </div>
                      <Link href={`/dashboard/courses/${course._id}`}>
                        <Button size="sm">View Course</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
          <h2 className="text-2xl font-bold tracking-tight mb-6">All Courses</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              Array(8)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <Skeleton className="h-48 w-full rounded-none" />
                    </CardHeader>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-6 w-full mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter className="flex justify-between p-6 pt-0">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-10 w-24" />
                    </CardFooter>
                  </Card>
                ))
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Try adjusting your filters or search query to find what you&apos;re looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setCategoryFilter("all")
                    setLevelFilter("all")
                    setPriceRange([0, 1000])
                    setSourceFilter([])
                    setTopicFilter("all")
                    setPriceCeiling(1000)
                    setExamTypeFilter("all")
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <Card key={course._id} className="overflow-hidden flex flex-col">
                  <CardHeader className="p-0">
                    <div className="h-48 w-full bg-muted flex items-center justify-center overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail || "/placeholder.svg"}
                          alt={course.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Prevent infinite reload by removing the error handler after first error
                            e.currentTarget.onerror = null
                            // Replace with text message
                            e.currentTarget.style.display = "none"
                            e.currentTarget.parentElement?.classList.add("flex", "items-center", "justify-center")
                            const message = document.createElement("span")
                            message.className = "text-muted-foreground"
                            message.textContent = "No image found"
                            e.currentTarget.parentElement?.appendChild(message)
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground">No image available</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge>{course.category}</Badge>
                      <Badge variant="outline">{course.level}</Badge>
                      {course.examType && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 ml-auto">
                          {formatExamType(course.examType)}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mb-2 line-clamp-1">{course.title}</CardTitle>
                    {/* Add course rating component below the title */}
                    <CourseRating rating={course.rating} reviewCount={course.reviewCount} size="sm" className="mb-2" />
                    <CardDescription className="line-clamp-2 mb-2">{course.description}</CardDescription>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>Instructor: {course.instructor}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between p-6 pt-0 mt-auto">
                    <div className="font-bold">${course.price.toFixed(2)}</div>
                    <Link href={`/dashboard/courses/${course._id}`}>
                      <Button size="sm">View Course</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
