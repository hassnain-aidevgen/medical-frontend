"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen } from "lucide-react"
import { toast } from "react-hot-toast"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// Import the Course type
import type { Course } from "@/types"

interface OngoingCoursesProps {
  limit?: number
  showViewAll?: boolean
  className?: string
}

export function OngoingCourses({ limit = 3, showViewAll = true, className = "" }: OngoingCoursesProps) {
  const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      try {
        setLoading(true)
        // Get user ID from localStorage
        const userId = localStorage.getItem("Medical_User_Id")

        if (!userId) {
          console.log("User not logged in, skipping purchased courses fetch")
          setLoading(false)
          return
        }

        const response = await fetch(
          `https://medical-backend-loj4.onrender.com/api/course-purchase/user-courses?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        )

        if (!response.ok) {
          throw new Error("Failed to fetch purchased courses")
        }

        const { success, courses } = await response.json()

        if (success) {
          // Add ratings to purchased courses for display
          const purchasedWithRatings = courses.map((course: any) => ({
            ...course,
            rating: course.rating || Math.random() * 4 + 1,
            reviewCount: course.reviewCount || Math.floor(Math.random() * 100) + 1,
          }))

          setPurchasedCourses(purchasedWithRatings)
        }
      } catch (error) {
        console.error("Error fetching purchased courses:", error)
        toast.error("Failed to load your courses")
      } finally {
        setLoading(false)
      }
    }

    fetchPurchasedCourses()
  }, [])

  // If loading, show skeleton
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Ongoing Courses</h2>
          {showViewAll && <Skeleton className="h-9 w-24" />}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(limit)
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
            ))}
        </div>
      </div>
    )
  }

  // If no purchased courses, show empty state
  if (purchasedCourses.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h2 className="text-xl font-bold">Ongoing Courses</h2>
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No ongoing courses</h3>
            <p className="text-muted-foreground mb-4">You haven&apos;t enrolled in any courses yet.</p>
            <Link href="/dashboard/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Display purchased courses
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ongoing Courses</h2>
        {showViewAll && purchasedCourses.length > limit && (
          <Link href="/dashboard/my-courses">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {purchasedCourses.slice(0, limit).map((course) => (
          <Card key={course._id} className="overflow-hidden flex flex-col">
            <CardHeader className="p-0">
              {typeof course.thumbnail === "string" && course.thumbnail.startsWith("http") ? (
                <Image
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  width={384}
                  height={192}
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    // Fall back to placeholder if image fails to load
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="h-48 w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6 flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge>{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                <Badge variant="success" className="bg-green-100 text-green-800">
                  Ongoing
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-2 line-clamp-1">{course.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{course.description}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Instructor: {course.instructor}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-6 pt-0 mt-auto">
              <Link href={`/dashboard/courses/${course._id}`}>
                <Button size="sm">Continue Learning</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
