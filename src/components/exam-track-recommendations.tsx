"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
// import { CourseRating } from "@/app/courses/course-rating"

import { CourseRating } from "@/app/dashboard/courses/course-rating"
import { filterCoursesByExam } from "@/lib/examTrackUtils"
import type { Course } from "@/types"

interface ExamTrackRecommendationsProps {
  examName: string
  allCourses?: Course[]
  currentCourseId?: string
  maxDisplay?: number
}

export function ExamTrackRecommendations({
  examName,
  allCourses,
  currentCourseId,
  maxDisplay = 3,
}: ExamTrackRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Course[]>([])
  const [loading, setLoading] = useState(!allCourses)

  useEffect(() => {
    if (allCourses) {
      // Filter courses by exam and exclude current course
      let filteredCourses = filterCoursesByExam(allCourses, examName).filter((course) => course._id !== currentCourseId)

      // If no courses match the exam tag, provide some fallback recommendations
      if (filteredCourses.length === 0) {
        // Use some courses as fallback recommendations (excluding current course)
        filteredCourses = allCourses.filter((course) => course._id !== currentCourseId).slice(0, maxDisplay)
      }

      setRecommendations(filteredCourses.slice(0, maxDisplay))
      setLoading(false)
    } else {
      // If courses aren't provided, we'll need to fetch them
      setLoading(true)
    }
  }, [allCourses, examName, currentCourseId, maxDisplay])

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recommended for {examName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-40 w-full rounded-none" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null // Don't show the section if no recommendations
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Recommended for {examName}</h2>
        <Link href={`/courses?exam=${encodeURIComponent(examName)}`} className="text-sm text-primary flex items-center">
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((course) => (
          <Card key={course._id} className="overflow-hidden flex flex-col">
            <CardHeader className="p-0">
              <div className="relative h-40 w-full">
                <Image
                  src={
                    course.thumbnail || `/placeholder.svg?height=160&width=320&text=${encodeURIComponent(course.title)}`
                  }
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              <Badge className="mb-2">{course.level}</Badge>
              <CardTitle className="text-lg mb-1 line-clamp-1">{course.title}</CardTitle>
              <CourseRating rating={course.rating} reviewCount={course.reviewCount} size="sm" className="mb-2" />
              <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Link href={`/dashboard/courses/${course._id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Course
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

