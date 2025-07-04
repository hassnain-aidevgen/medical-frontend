"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import toast from "react-hot-toast"
// import { useUser } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import type React from "react"

// import { loadStripe } from "@stripe/stripe-js"
import {
  ArrowLeft,
  BarChart,
  CheckCircle,
  Clock,
  Play,
  ShoppingCart,
  Users,
  StarIcon,
  MessagesSquare,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

// Extend the Session type to include the 'id' property
declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      authtoken?: string // Add the authtoken property
    }
  }
}
import { Toaster } from "react-hot-toast" // Revert to react-hot-toast

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import Image from "next/image"
import { CourseRating } from "../course-rating"
import { ExamTrackRecommendations } from "@/components/exam-track-recommendations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

// Initialize Stripe
// loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

// Import the Course type from the types directory
import type { Course } from "@/types"

// Add the missing properties to the Course type
declare module "@/types" {
  interface Course {
    // Only add reviewCount since rating already exists
    reviewCount?: number
    examTags?: string[]
    videoUrl?: string // Add videoUrl to the Course type
    videos?: {
      title: string
      url: string
      description?: string
      thumbnail?: string
      order?: number
    }[]
    contentLinks: string[]
  }
}

interface Review {
  userId: string
  name: string
  email: string
  comment: string
  rating: number
  updatedAt?: string
  _id?: string
  courseId?: string
  createdAt?: string
}

const CoursePage = () => {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  // const { user } = useUser()

  const { data: session } = useSession()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Add states for purchase verification
  const [checkingPurchase, setCheckingPurchase] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  interface CourseVideo {
    title?: string
    url?: string
    thumbnail?: string
    description?: string
  }

  const [courseVideos, setCourseVideos] = useState<CourseVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  // Check if user has purchased the course
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!params.id ) {
        setHasPurchased(false)
        return
      }

      try {
        setCheckingPurchase(true)

        // Get token from localStorage
        const token = localStorage.getItem("token")
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          setHasPurchased(false)
          return
        }

        // Call API to check if user has purchased this course
        const response = await fetch(`https://medical-backend-3eek.onrender.com/api/course-purchase/verify/${params.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to verify purchase: ${response.status}`)
        }

        const data = await response.json()
        console.log("Purchase verification response:", data)
        if (data.success && data.purchased) {
          setHasPurchased(true)
          // If success URL has query param, show success toast
          if (typeof window !== 'undefined' && window.location.search.includes('success=true')) {
            toast.success("Purchase successful! You now have full access to this course.")
          }
        } else {
          setHasPurchased(false)
        }
      } catch (error) {
        console.error("Error checking purchase status:", error)
        setHasPurchased(false)
      } finally {
        setCheckingPurchase(false)
      }
    }

    checkPurchaseStatus()

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      if (success === 'true') {
        toast.success("Purchase successful! Preparing your course content...");
        // Clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [params.id])

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const data = await apiClient.get<Course>(`/courses/${params.id}`)

        // Check if there are content links in the response
        const contentLinks = data.contentLinks || []

        console.log("Fetched content links:", contentLinks)
        console.log("Course video URL:", data.videoUrl)
        console.log("Course videos:", data.videos)

        // Add mock rating and exam tags for testing if needed
        const courseWithRating = {
          ...data,
          rating: data.rating || 4.5,
          reviewCount: data.reviewCount || 20,
          examTags: ["USMLE", "ENARE"],
          // Ensure contentLinks are properly set
          contentLinks: contentLinks,
        }

        setCourse(courseWithRating)

        // If course has videos array, use those
        if (data.videos && data.videos.length > 0) {
          setCourseVideos(data.videos)
        }
        // If no videos array but has videoUrl, create a video object for it
        else if (data.videoUrl) {
          setCourseVideos([
            {
              title: "Course Video",
              url: data.videoUrl,
              description: "Main course video content",
            },
          ])
        }
      } catch (error) {
        console.error("Error fetching course:", error)
        toast.error("Failed to load course details")
      } finally {
        setLoading(false)
      }
    }

    const fetchAllCourses = async () => {
      try {
        const data = await apiClient.get<Course[]>("/courses")

        // Add mock ratings and exam tags for testing
        const coursesWithRatings = data.map((course) => {
          // Create more realistic exam tags based on course content
          const examTags = []

          // Assign USMLE tag to about half the courses to ensure recommendations
          if (Math.random() > 0.5) {
            examTags.push("USMLE")
          }

          // Add other random exam tags
          const otherExams = ["ENARE", "MCAT", "NCLEX", "COMLEX", "PANCE"]
          const randomExam = otherExams[Math.floor(Math.random() * otherExams.length)]
          if (Math.random() > 0.7) {
            examTags.push(randomExam)
          }

          return {
            ...course,
            rating: Math.random() * 4 + 1,
            reviewCount: Math.floor(Math.random() * 100) + 1,
            examTags: examTags,
          }
        })

        setAllCourses(coursesWithRatings)
      } catch (error) {
        console.error("Error fetching all courses:", error)
      }
    }

    if (params.id) {
      fetchCourse()
      fetchAllCourses()
    }
  }, [params.id])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!params.id) return

      try {
        setLoadingReviews(true)

        // Use the correct endpoint path matching your backend
        const response = await fetch(`https://medical-backend-3eek.onrender.com/api/reviews/course/${params.id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`)
        }

        const data = await response.json()

        // Check the structure of the response based on your backend
        const reviews = data.success ? data.reviews : []

        setReviews(reviews)

        // Add console logging to debug the review data when it's received:
        console.log("Received reviews data:", reviews)
        reviews.forEach((review: Review) => {
          console.log(`Review by ${review.userId}: rating=${review.rating}, comment=${review.comment}`)
        })

        // Check if the current user has already submitted a review
        if (session?.user?.id) {
          const userReview = reviews.find((review: Review) => review.userId === session.user.id)
          if (userReview) {
            setUserReview(userReview)
            setReviewRating(userReview.rating)
            setReviewComment(userReview.comment)
          }
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        toast.error("Failed to load reviews")
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [params.id, session?.user?.id])

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true)
      // Call API to add course to cart
      await apiClient.post("/cart", { courseId: course?._id })
      toast.success("Course added to cart")
    } catch (error) {
      console.log(error)
      toast.error("Failed to add course to cart")
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!course) return

    try {
      setAddingToCart(true)

      // Get token from localStorage
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        toast.error("Please log in to purchase this course")
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname))
        return
      }

      // Create checkout session
      const response = await fetch("https://medical-backend-3eek.onrender.com/api/course-purchase/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ type: "course", id: course._id }],
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/courses/${course._id}?canceled=true`,
          userId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create checkout session")
      }

      const session = await response.json()

      // Redirect to checkout
      window.location.href = session.url
    } catch (error) {
      console.error("Error processing purchase:", error)
      if (error instanceof Error) {
        toast.error(error.message || "Failed to process purchase")
      } else {
        toast.error("Failed to process purchase")
      }
      setAddingToCart(false)
    }
    
  }

  const handleAccessCourse = () => {
    // Scroll to course content tab
    const curriculumTab = document.querySelector('[data-value="curriculum"]')
    if (curriculumTab) {
      (curriculumTab as HTMLElement).click()
    }
    toast.success("You already own this course. Enjoy your learning!")
  }
  // Function to handle video play attempt
  const handleVideoPlayAttempt = () => {
    // Skip the login check - assume user is already logged in
    // Just check if they've purchased the course
    if (hasPurchased === false) {
      // User has not purchased the course
      setShowPurchaseDialog(true)
    }
    // If hasPurchased is true, the video will play normally
  }

  // Modified purchase verification function - only checks purchase status
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!params.id) {
        setHasPurchased(false)
        return
      }

      try {
        setCheckingPurchase(true)

        // Get token from localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          setHasPurchased(false)
          return
        }

        // Call API to check if user has purchased this course
        const response = await fetch(`https://medical-backend-3eek.onrender.com/api/course-purchase/verify/${params.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: localStorage.getItem("Medical_User_Id"),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to verify purchase: ${response.status}`)
        }

        const data = await response.json()
        setHasPurchased(data.purchased)
      } catch (error) {
        console.error("Error checking purchase status:", error)
        setHasPurchased(false)
      } finally {
        setCheckingPurchase(false)
      }
    }

    checkPurchaseStatus()
  }, [params.id])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const userId = typeof window !== "undefined" ? localStorage.getItem("Medical_User_Id") : null

    if (!userId) {
      toast.error("You must be logged in to submit a review")
      return
    }

    if (!reviewRating || !reviewComment.trim()) {
      toast.error("Please provide both a rating and comment")
      return
    }

    try {
      setIsSubmittingReview(true)

      const reviewData = {
        courseId: params.id,
        userId,
        rating: reviewRating,
        comment: reviewComment,
      }

      console.log("Submitting review data:", reviewData)

      const response = await fetch("https://medical-backend-3eek.onrender.com/api/reviews/course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        toast.error("Failed to submit review. Please try again.")
        return
      }

      const savedReview = await response.json()
      console.log("Received saved review:", savedReview)

      // Create a new reviews array to force a re-render
      if (userReview) {
        // Update existing review
        const updatedReviews = reviews.map((review) => (review.userId === savedReview.userId ? savedReview : review))
        setReviews([...updatedReviews]) // Create a new array reference to trigger re-render
        toast.success("Your review has been updated!")
      } else {
        // Add new review
        setReviews([savedReview, ...reviews]) // Create a new array reference to trigger re-render
        toast.success("Your review has been submitted!")
      }

      setUserReview(savedReview)

      // Force close the dialog
      document.body.click()

      // Add a small delay before refreshing reviews to ensure backend consistency
      setTimeout(() => {
        fetchReviews()
      }, 500)
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Something went wrong while submitting your review.")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // Add this fetchReviews function outside of any useEffect
  const fetchReviews = async () => {
    if (!params.id) return

    try {
      setLoadingReviews(true)

      const response = await fetch(`https://medical-backend-3eek.onrender.com/api/reviews/course/${params.id}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`)
      }

      const data = await response.json()
      const reviews = data.success ? data.reviews : []

      console.log("Fetched fresh reviews:", reviews)
      setReviews(reviews)

      // Check if the current user has already submitted a review
      if (session?.user?.id) {
        const userReview = reviews.find((review: Review) => review.userId === session.user.id)
        if (userReview) {
          setUserReview(userReview)
          setReviewRating(userReview.rating)
          setReviewComment(userReview.comment)
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setLoadingReviews(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-6 md:py-10">
          <div className="container">
            <div className="mb-8">
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-64 w-full" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <div>
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-6 md:py-10">
          <div className="container">
            <div className="mb-8">
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center py-12">
              <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The course you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Link href="/dashboard/courses">
                <Button>Browse Courses</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mb-8">
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                {/* Add prominent course rating below the title */}
                <div className="mt-2 mb-3">
                  <CourseRating rating={course.rating} reviewCount={course.reviewCount} size="lg" />
                </div>
                <p className="text-muted-foreground mt-2">{course.description.split(".")[0]}.</p>
              </div>

              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                <img
                  src={
                    course.thumbnail ||
                    `/placeholder.svg?height=480&width=854&text=${encodeURIComponent(course.title) || "/placeholder.svg"}`
                  }
                  alt={course.title}
                  width={854}
                  height={480}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-muted-foreground" />
                  <span>{course.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>{course.enrollments.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {course.source}
                  </Badge>
                </div>
                
                {/* Add purchased badge if user owns the course */}
                {hasPurchased && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500 text-white">
                      Purchased
                    </Badge>
                  </div>
                )}
              </div>

              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum" data-value="curriculum">Course Content</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About This Course</h3>
                    <p className="text-muted-foreground">{course.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">What You&apos;ll Learn</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {course.objectives?.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {course.prerequisites.map((prerequisite, index) => (
                          <li key={index}>{prerequisite}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {/* Curriculum tab with purchase check */}
                <TabsContent value="curriculum" className="space-y-4 pt-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Course Content</h3>
                      <div className="text-sm text-muted-foreground">
                        {course.modules?.length || 0} modules •{" "}
                        {course.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0} lessons •{" "}
                        {course.duration}
                      </div>
                    </div>

                    {loadingVideos || checkingPurchase ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="border rounded-lg animate-pulse">
                            <div className="bg-muted p-4">
                              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                            </div>
                            <div className="p-4">
                              <div className="aspect-video bg-gray-200 rounded-md"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        {/* Video Player Section */}
                        {(course.videos && course.videos.length > 0) || course.videoUrl ? (
                          <div className="space-y-6">
                            {/* Show a purchase success banner for purchased courses */}
                            {hasPurchased && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                  <p className="text-green-700 font-medium">
                                    You own this course. Enjoy full access to all content!
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Video Navigation Tabs */}
                            {course.videos && course.videos.length > 1 && (
                              <div className="flex overflow-x-auto gap-2 pb-2">
                                {course.videos.map((video, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (hasPurchased) {
                                        setCurrentVideoIndex(idx)
                                      } else {
                                        setShowPurchaseDialog(true)
                                      }
                                    }}
                                    className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-colors ${
                                      currentVideoIndex === idx
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                    }`}
                                  >
                                    {video.title || `Video ${idx + 1}`}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Current Video Player */}
                            <div className="border rounded-lg overflow-hidden">
                              <div className="bg-muted p-4">
                                <h4 className="font-medium">
                                  {course.videos && course.videos.length > 0
                                    ? course.videos[currentVideoIndex]?.title || `Video ${currentVideoIndex + 1}`
                                    : "Course Video"}
                                </h4>
                              </div>
                              <div className="p-4">
                                {hasPurchased ? (
                                  // User has purchased - show video player
                                  <div className="aspect-video bg-muted/30 rounded-md overflow-hidden">
                                    <video
                                      controls
                                      className="w-full h-full"
                                      poster={course.thumbnail || "/placeholder.svg"}
                                      key={
                                        course.videos && course.videos.length > 0
                                          ? course.videos[currentVideoIndex]?.url
                                          : course.videoUrl
                                      }
                                    >
                                      <source
                                        src={
                                          course.videos && course.videos.length > 0
                                            ? course.videos[currentVideoIndex]?.url
                                            : course.videoUrl
                                        }
                                        type="video/mp4"
                                      />
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                ) : (
                                  // User has not purchased - show locked content overlay
                                  <div
                                    className="aspect-video bg-muted/30 rounded-md overflow-hidden relative cursor-pointer"
                                    onClick={() => setShowPurchaseDialog(true)}
                                  >
                                    {/* Thumbnail or placeholder */}
                                    <div className="w-full h-full">
                                      <img
                                        src={
                                          course.thumbnail ||
                                          `/placeholder.svg?height=480&width=854&text=${encodeURIComponent("Premium Content") || "/placeholder.svg"}`
                                        }
                                        alt="Video thumbnail"
                                        width={854}
                                        height={480}
                                        className="w-full h-full object-cover opacity-50"
                                      />
                                    </div>

                                    {/* Lock overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                                      <Lock className="h-16 w-16 mb-4" />
                                      <h3 className="text-xl font-bold mb-2">Premium Content</h3>
                                      <p className="text-center max-w-md mb-4">
                                        Purchase this course to access all video content
                                      </p>
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setShowPurchaseDialog(true)
                                        }}
                                        className="bg-primary hover:bg-primary/90"
                                      >
                                        Unlock Course
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-4 space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    {course.videos && course.videos.length > 0
                                      ? course.videos[currentVideoIndex]?.description || "No description available"
                                      : "Main course video content"}
                                  </p>

                                  {hasPurchased && (
                                    <div className="flex justify-between items-center">
                                      <a
                                        href={
                                          course.videos && course.videos.length > 0
                                            ? course.videos[currentVideoIndex]?.url
                                            : course.videoUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline"
                                      >
                                        Open in new tab
                                      </a>

                                      {course.videos && course.videos.length > 1 && (
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
                                            disabled={currentVideoIndex === 0}
                                          >
                                            Previous
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setCurrentVideoIndex(
                                                Math.min((course.videos ?? []).length - 1, currentVideoIndex + 1),
                                              )
                                            }
                                            disabled={currentVideoIndex === course.videos.length - 1}
                                          >
                                            Next
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Video List */}
                            {course.videos && course.videos.length > 1 && (
                              <div className="mt-6">
                                <h4 className="font-medium mb-3">All Videos</h4>
                                <div className="space-y-2">
                                  {course.videos.map((video, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        if (hasPurchased) {
                                          setCurrentVideoIndex(idx)
                                        } else {
                                          setShowPurchaseDialog(true)
                                        }
                                      }}
                                      className={`p-3 rounded-md cursor-pointer flex items-center gap-3 transition-colors ${
                                        currentVideoIndex === idx ? "bg-muted/80" : "hover:bg-muted"
                                      }`}
                                    >
                                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                        {hasPurchased ? (
                                          <Play
                                            className={`h-5 w-5 ${currentVideoIndex === idx ? "text-primary" : "text-muted-foreground"}`}
                                          />
                                        ) : (
                                          <Lock className="h-5 w-5 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{video.title || `Video ${idx + 1}`}</p>
                                        {video.description && (
                                          <p className="text-xs text-muted-foreground truncate">{video.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 border rounded-lg bg-gray-50">
                            <div className="flex justify-center mb-4">
                              <Play className="h-12 w-12 text-gray-300" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">No videos available</h4>
                            <p className="text-gray-500">This course doesn&apos;t have any videos yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4 pt-4">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Student Reviews</h3>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">{userReview ? "Update Your Review" : "Write a Review"}</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>{userReview ? "Update Your Review" : "Write a Review"}</DialogTitle>
                            <DialogDescription>
                              Share your experience with this course to help other students.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleReviewSubmit}>
                            <div className="grid gap-4 py-4">
                              <div className="flex items-center justify-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none"
                                    onClick={() => setReviewRating(star)}
                                  >
                                    <StarIcon
                                      className={`h-8 w-8 ${
                                        reviewRating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="comment">Your Review</Label>
                                <Textarea
                                  id="comment"
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  placeholder="What did you like or dislike about this course?"
                                  className="resize-none"
                                  rows={4}
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={isSubmittingReview}>
                                {isSubmittingReview ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Reviews list - Improved styling */}
                    {loadingReviews ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="border rounded-lg p-6 space-y-3 animate-pulse">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                              <div className="space-y-2 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                              </div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                            <div className="pt-3 space-y-2">
                              <div className="h-3 bg-gray-200 rounded w-full"></div>
                              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div
                            key={review._id}
                            className="border border-gray-100 rounded-lg shadow-sm p-6 space-y-3 transition-all hover:shadow-md"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center">
                                  {review.name
                                    ? review.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .substring(0, 2)
                                    : "U"}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{review.name || "Anonymous User"}</p>
                                  <p className="text-xs text-gray-500">
                                    {review.updatedAt
                                      ? format(new Date(review.updatedAt), "MMM d, yyyy")
                                      : "Recently added"}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`h-5 w-5 ${
                                          i < Math.floor(review.rating || 0)
                                            ? "text-yellow-400 fill-yellow-400"
                                            : i < (review.rating || 0)
                                              ? "text-yellow-400 fill-yellow-400 opacity-50"
                                              : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-medium">
                                    {review.rating !== undefined && review.rating !== null
                                      ? review.rating.toFixed(1)
                                      : "0.0"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-gray-100">
                              {review.comment ? (
                                <p className="text-gray-700">{review.comment}</p>
                              ) : (
                                <p className="text-gray-500 italic">
                                  This review doesn&apos;t include detailed comments.
                                </p>
                              )}
                            </div>
                            {session?.user?.id === review.userId && (
                              <div className="pt-2 flex justify-end">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-xs">
                                      Edit
                                    </Button>
                                  </DialogTrigger>
                                  {/* Reuse the same dialog content as above */}
                                </Dialog>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border rounded-lg bg-gray-50">
                        <div className="flex justify-center mb-4">
                          <MessagesSquare className="h-12 w-12 text-gray-300" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h4>
                        <p className="text-gray-500 mb-6">Be the first to share your experience with this course!</p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>Write a Review</Button>
                          </DialogTrigger>
                          {/* Dialog content */}
                        </Dialog>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-2xl">${course.price.toFixed(2)}</CardTitle>
                  <CardDescription>One-time purchase, lifetime access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button disabled={hasPurchased} className="w-full gap-2" size="lg" onClick={() => setShowPurchaseDialog(true)}>
                    {hasPurchased ? "Purchased" : "Purchase Course"}
                    {hasPurchased ? <CheckCircle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                    {/* Purchase Course */}
                  </Button>
                  <div className="hidden">
                    <Button className="w-full gap-2" size="lg" onClick={handleBuyNow} disabled={addingToCart}>
                      {addingToCart ? "Processing..." : "Buy Now"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-medium">This course includes:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                        <span>{course.duration} of on-demand video</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                        <span>Access on mobile and desktop</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                        <span>Certificate of completion</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                {/* <CardFooter className="flex justify-center">
                  <Button variant="link" size="sm">
                    30-Day Money-Back Guarantee
                  </Button>
                </CardFooter> */}
              </Card>
            </div>
          </div>

          {/* Exam Track Recommendations */}
          <div className="mt-12 border-t pt-8">
            <ExamTrackRecommendations examName="USMLE" allCourses={allCourses} currentCourseId={course._id} />
          </div>
        </div>
      </main>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Purchase Required</DialogTitle>
            <DialogDescription>You need to purchase this course to access the video content.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-lg">{course.title}</h3>
                <p className="text-sm text-muted-foreground">{course.instructor}</p>
              </div>
              <div className="text-xl font-bold">${course.price.toFixed(2)}</div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-1" />
                <span className="text-sm">Full access to all course videos and materials</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-1" />
                <span className="text-sm">Lifetime access to course updates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-1" />
                <span className="text-sm">Certificate of completion</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleBuyNow} disabled={addingToCart}>
              {addingToCart ? "Processing..." : "Purchase Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
    </div>
  )
}

export default CoursePage
