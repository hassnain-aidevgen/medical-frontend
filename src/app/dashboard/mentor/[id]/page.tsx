"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { Briefcase, Building, CalendarIcon, ChevronLeft, Star, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { JSX, useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { MentorBadgeSet } from "../MentorBadgeSet"
import { SuggestedMentorships } from "../SuggestedMentorships"

// Update the Mentor interface to match the updated schema
interface Mentor {
  _id: string
  name: string
  email?: string
  avatar: string
  title: string
  company: string
  bio: string
  expertise: string[]
  rating: number
  totalSessions: number
  isActive: boolean
  mentorships: Array<{
    _id: string
    title: string
    description: string
    createdAt?: string
    price: number
    duration: string

  }>
  reviews: Array<{
    userId: string
    comment: string
    rating: number
    createdAt?: string
    updatedAt?: string
  }>
  availability?: Array<{
    date: string
    slots: string[]
  }>
}

interface Mentorship {
  _id: string
  title: string
  description: string
  price: number
  duration: string
  category: string
  topics: string[]
  mentor: Mentor
}

// Add a Booking interface
interface Booking {
  _id: string
  mentorshipId: string
  mentorship: {
    _id: string
    title: string
    duration: string
  }
  mentorId: string
  mentor: {
    _id: string
    name: string
    avatar: string
  }
  date: string
  time: string
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled"
  paymentStatus: "pending" | "completed" | "refunded"
  rejectionReason?: string
  createdAt: string
}

interface MentorshipReview {
  userId: string
  comment: string
  rating: number
  createdAt?: string
}

// Function to fetch reviews for a specific mentorship
const fetchMentorshipReviews = async (mentorshipId: string): Promise<MentorshipReview[]> => {
  try {
    const res = await axios.get(`http://localhost:5000/api/reviews/mentorship/${mentorshipId}`)
    return res.data?.data || []
  } catch (error) {
    console.error("Error fetching reviews for mentorship:", error)
    return []
  }
}

export default function MentorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("about")
  const [reviewInput, setReviewInput] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [mentorshipReviews, setMentorshipReviews] = useState<Record<string, MentorshipReview[]>>({})
  const [showReviewForm, setShowReviewForm] = useState<Record<string, boolean>>({})
  const [bookingStatus, setBookingStatus] = useState<{
    loading: boolean
    success: boolean
    message: string
  }>({
    loading: false,
    success: false,
    message: "",
  })
  const [reviewRating, setReviewRating] = useState<Record<string, number>>({})

  // Add state to track payment status for each mentorship
  const [paidMentorships, setPaidMentorships] = useState<Record<number, boolean>>({})

  // Using useCallback to memoize the fetchMentor function
  const fetchMentor = useCallback(
    async (mentorId: string) => {
      try {
        setLoading(true)
        const response = await axios.get(`http://localhost:5000/api/mentor/${mentorId}`)
        const mentorData = response.data.data
        console.log("Fetched mentor data:", mentorData)

        // Check if mentor is active
        if (!mentorData.isActive) {
          toast.error("This mentor is currently not available")
          router.push("/dashboard/mentor")
          return
        }

        setMentor(mentorData)

        // Use the mentorships directly from the mentor object
        setMentorships(mentorData.mentorships || [])

        // Fetch reviews for each mentorship
        const mentorships = mentorData.mentorships || []
        for (const m of mentorships) {
          const reviews = await fetchMentorshipReviews(m._id)
          setMentorshipReviews((prev) => ({ ...prev, [m._id]: reviews }))
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching mentor:", error)
        toast.error("Failed to load mentor details")
        setLoading(false)
      }
    },
    [router],
  )

  // Add function to fetch user bookings
  const fetchUserBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
  
      // Get the user ID from localStorage
      const userId = localStorage.getItem("Medical_User_Id");
  
      if (!userId) {
        console.error("❌ No user ID found in localStorage.");
        setBookingsLoading(false);
        return;
      }
  
      console.log("🔍 Fetching bookings for user ID:", userId);
  
      const response = await axios.get("http://localhost:5000/api/bookings/user", {
        params: {
          userId: userId,
        },
      });
  
      console.log("✅ Bookings fetch response:", response.data);
  
      if (response.data.success) {
        setBookings(response.data.data);
      }
  
      setBookingsLoading(false);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      setBookingsLoading(false);
    }
  }, []);
  

  useEffect(() => {
    if (params.id) {
      fetchMentor(params.id as string)
    }
  }, [params.id, fetchMentor])

  // Fetch bookings when component mounts
  useEffect(() => {
    fetchUserBookings()
  }, [fetchUserBookings])

  // Update available slots when date is selected
  useEffect(() => {
    if (!selectedDate || !mentor?.availability) return

    const formattedDate = selectedDate.toISOString().split("T")[0]
    const availabilityForDate = mentor.availability.find((a) => a.date === formattedDate)

    if (availabilityForDate) {
      setAvailableSlots(availabilityForDate.slots)
    } else {
      setAvailableSlots([])
    }

    setSelectedSlot(null)
  }, [selectedDate, mentor])

  // Function to render mentorship reviews
 
  // Updated renderMentorshipReviews function for MentorDetailPage.js
const renderMentorshipReviews = (mentorshipId: string): JSX.Element => {
  interface Review {
    userId: string;
    comment: string;
    rating: number;
    createdAt?: string;
    updatedAt?: string;
  }

  // First try to get mentorship-specific reviews
  const mentorshipSpecificReviews: Review[] = mentorshipReviews[mentorshipId] || [];
  
  // If no mentorship-specific reviews, fallback to mentor's general reviews
  const reviews: Review[] = mentorshipSpecificReviews.length > 0 ? mentorshipSpecificReviews : mentor?.reviews || [];
  
  if (reviews.length === 0)
    return <p className="text-muted-foreground text-sm">No reviews yet for this mentorship.</p>;
    
  return (
    <div className="space-y-4 mt-4">
      {reviews.map((review, idx) => (
        <div key={idx} className="border rounded p-3">
          <div className="flex items-center justify-between">
            {/* Display the user's name here instead of ID/email */}
            <strong>{review.userId}</strong>
            <span className="text-xs text-muted-foreground">
              {new Date(review.createdAt || "").toLocaleDateString()}
              {review.updatedAt && " (Updated)"}
            </span>
          </div>
          <div className="flex mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
              />
            ))}
          </div>
          <p className="text-sm mt-2">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};

  // Utility function to check if a user can rebook the mentorship
  const canBookMentorship = (mentorshipId: string, bookings: Booking[]) => {
    const now = new Date()
    const relatedBookings = bookings.filter((b) => b.mentorshipId === mentorshipId)

    return relatedBookings.every((b) => {
      if (b.status === "rejected") return true

      const bookingDateTime = new Date(`${b.date}T${b.time}`)
      return bookingDateTime < now
    })
  }

  // Submit review function
// Updated handleSubmitReview function for MentorDetailPage.js

// Updated handleSubmitReview function for mentor-only reviews
const handleSubmitReview = async (
  bookingId: string,
  mentorId: string
): Promise<void> => {
  const userId: string | null = localStorage.getItem("Medical_User_Id");

  if (!userId) {
    toast.error("Login required to submit a review");
    return;
  }

  try {
    setReviewSubmitting(true);

    // Step 1: Check if user has already submitted a review for this mentor
    interface CheckUserReviewResponse {
      hasReview: boolean;
    }

    const response = await axios.get<CheckUserReviewResponse>(
      `http://localhost:5000/api/reviews/check-user-review/${mentorId}?userId=${userId}`
    );

    const { hasReview } = response.data;

    const reviewPayload = {
      mentorId,
      userId,
      comment: reviewInput,
      rating: reviewRating[bookingId] || 0,
    };

    // Step 2: Submit or update the review
    if (hasReview) {
      await axios.put("http://localhost:5000/api/reviews/updatereview", reviewPayload);
      toast.success("Review updated successfully");
    } else {
      await axios.post("http://localhost:5000/api/reviews/addreview", reviewPayload);
      toast.success("Review submitted successfully");
    }

    // Step 3: Reset UI state
    setReviewInput("");
    setReviewRating((prev) => ({ ...prev, [bookingId]: 0 }));
    setShowReviewForm((prev) => ({ ...prev, [bookingId]: false }));
    fetchMentor(params.id as string);
  } catch (error: any) {
    console.error("Review submission error:", error);
    toast.error(error?.response?.data?.error || "Failed to submit review");
  } finally {
    setReviewSubmitting(false);
  }
};


  // Function to handle booking a session
  const handleBookSession = useCallback(
    async (mentorId: string, mentorshipIndex: number) => {
      // Only check if payment has been made
      if (!paidMentorships[mentorshipIndex]) {
        toast.error("Please complete payment before booking")
        return
      }
  
      const mentorship = mentor?.mentorships[mentorshipIndex]
      if (!mentorship) {
        toast.error("Invalid mentorship selected")
        return
      }
  
      try {
        setBookingStatus({
          loading: true,
          success: false,
          message: "Submitting your booking request...",
        })
  
        // Get token from localStorage
        const user_id = localStorage.getItem("Medical_User_Id")
  
        if (!user_id) {
          toast.error("You need to be logged in to book a session. Please log in and try again.")
          setBookingStatus({
            loading: false,
            success: false,
            message: "Authentication error. Please log in again.",
          })
          return
        }
  
        // Create mentorship object to pass to API
        const mentorshipData = {
          _id: mentorship._id,
          title: mentorship.title,
          duration: mentorship.duration || "60 minutes",
        }
  
        console.log("Sending booking request with data:", {
          mentorshipId: mentorship._id,
          mentorId: mentor._id,
          mentorship: mentorshipData,
          date: "pending-admin-assignment",
          time: "pending-admin-assignment",
        })
  
        // Use x-auth-token header
        const response = await axios.post(
          "http://localhost:5000/api/bookings",
          {
            user_id,
            mentorshipId: mentorship._id,
            mentorId: mentor._id,
            mentorship: mentorshipData,
            date: "pending-admin-assignment",
            time: "pending-admin-assignment",
          },
          {
            headers: {
              "Content-Type": "application/json",

            },
          },
        )
  
        console.log("Booking response:", response.data)
  
        if (response.data.success) {
          setBookingStatus({
            loading: false,
            success: true,
            message:
              "Your booking request has been submitted and is pending admin approval. The admin will assign a suitable date and time for your session. You'll receive an email once it's scheduled.",
          })
  
          // Refresh bookings list to show the new pending booking
          setTimeout(() => {
            fetchUserBookings()
            // Switch to schedule tab to show the pending booking
            setActiveTab("schedule")
          }, 500)
        } else {
          setBookingStatus({
            loading: false,
            success: false,
            message: "Booking request failed. Please try again.",
          })
        }
      } catch (error: any) {
        console.error("Booking error:", error)
        setBookingStatus({
          loading: false,
          success: false,
          message: error?.response?.data?.error || "Booking request failed. Please try again.",
        })
      }
    },
    [mentor, paidMentorships, fetchUserBookings],
  )

  // Handle payment for a mentorship
  const handlePayment = (mentorshipIndex: number, price: number) => {
    // Show payment confirmation alert
    if (window.confirm(`Thanks for paying $${price} for this mentor! Click OK to confirm.`)) {
      // Mark this mentorship as paid
      setPaidMentorships((prev) => ({
        ...prev,
        [mentorshipIndex]: true,
      }))

      toast.success("Payment successful! You can now book this mentorship.")
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!mentor) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Mentor Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The mentor you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/dashboard/mentor">
            <Button>Browse Mentors</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Render booking status message if available
  const renderBookingStatusMessage = () => {
    if (bookingStatus.loading) {
      return (
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
            <p className="text-blue-700">{bookingStatus.message}</p>
          </div>
        </div>
      )
    }

    if (bookingStatus.success) {
      return (
        <div className="bg-green-50 p-4 rounded-md mb-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <p className="text-green-700">{bookingStatus.message}</p>
          </div>
        </div>
      )
    }

    if (bookingStatus.message && !bookingStatus.success) {
      return (
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-red-700">{bookingStatus.message}</p>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="container py-8">
      <Link
        href="/dashboard/mentor"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Mentors
      </Link>

      {renderBookingStatusMessage()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Mentor Profile Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} />
                  <AvatarFallback className="text-2xl">{mentor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{mentor.name}</h2>
                <p className="text-muted-foreground mb-2">{mentor.title}</p>

                <MentorBadgeSet
                  rating={mentor.rating}
                  expertise={mentor.expertise}
                  reviewCount={mentor.reviews.length}
                />

                <div className="w-full space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{mentor.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{mentor.totalSessions} sessions completed</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="w-full">
                  <h3 className="text-sm font-medium mb-2 text-left">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add SuggestedMentorships below the profile card */}
          <div className="mt-6">
            <SuggestedMentorships contextTag={mentor.expertise[0] || "medical"} title="Similar Mentors" limit={3} />
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="about" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="mentorships">Mentorships</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About {mentor.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Add MentorBadgeSet at the top of the About section */}
                  <MentorBadgeSet rating={mentor.rating} expertise={mentor.expertise} />
                  <p className="whitespace-pre-line mt-4">{mentor.bio}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentorships">
              <Card>
                <CardHeader>
                  <CardTitle>Available Mentorships</CardTitle>
                  <CardDescription>Choose a mentorship program to book a session</CardDescription>
                </CardHeader>
                <CardContent>
                  {mentor.mentorships.length === 0 ? (
                    <div>
                      <p className="text-muted-foreground mb-6">No mentorships available from this mentor yet.</p>

                      {/* Add SuggestedMentorships when no mentorships are available */}
                      <div className="mt-4">
                        <SuggestedMentorships
                          contextTag={mentor.expertise[0] || "medical"}
                          title="Other mentors offering mentorships"
                          limit={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {mentor.mentorships.map((mentorship, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-lg">{mentorship.title}</h3>
                            </div>
                          </div>

                          <p className="text-muted-foreground mb-4">{mentorship.description}</p>

                          {/* MODIFIED: Added payment button and placed both buttons in a single line */}
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => handlePayment(index, mentorship.price)}
                              disabled={paidMentorships[index]} // Disable if already paid
                            >
                              {paidMentorships[index] ? "Paid" : `Pay $${mentorship.price}`}
                            </Button>
                            <Button
                              onClick={() => handleBookSession(mentor._id, index)}
                              disabled={!paidMentorships[index] || !canBookMentorship(mentorship._id, bookings)}
                            >
                              Book This Mentorship
                            </Button>
                          </div>

                          {/* Payment status indicator */}
                          {paidMentorships[index] && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ Payment complete. You can now book this mentorship.
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Add SuggestedMentorships at the bottom of available mentorships */}
                      <div className="mt-8 pt-4 border-t">
                        <h3 className="text-sm font-medium mb-4">You might also be interested in</h3>
                        <SuggestedMentorships
                          contextTag={mentor.expertise[0] || "medical"}
                          title="Related mentorships"
                          limit={2}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
<TabsContent value="reviews">
  <Card>
    <CardHeader>
      <CardTitle>Reviews for {mentor.name}</CardTitle>
    </CardHeader>
    <CardContent>
      {mentor.reviews && mentor.reviews.length > 0 ? (
        <div className="space-y-4">
          {mentor.reviews.map((review, idx) => (
            <div key={idx} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <strong>{review.userId}</strong>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt || "").toLocaleDateString()}
                  {review.updatedAt && " (Updated)"}
                </span>
              </div>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <p className="text-sm mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No reviews yet for this mentor.</p>
      )}
    </CardContent>
  </Card>
</TabsContent>
<TabsContent value="schedule">
  <Card>
    <CardHeader>
      <CardTitle>Your Bookings</CardTitle>
      <CardDescription>View and manage your bookings with {mentor.name}</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Display bookings section */}
      {bookingsLoading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">You don&apos;t have any bookings with this mentor yet</p>
          <Button onClick={() => setActiveTab("mentorships")}>Book a Session</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-md font-medium mb-2">Booking Status</h3>
          {/* Filter bookings for this mentor */}
          {bookings
            .filter((booking) => booking.mentorId === mentor._id)
            .map((booking) => (
              <div
                key={booking._id}
                className={`p-4 border rounded-md ${
                  booking.status === "pending"
                    ? "border-yellow-300 bg-yellow-50"
                    : booking.status === "approved"
                      ? "border-green-300 bg-green-50"
                      : booking.status === "rejected"
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{booking.mentorship.title}</h4>
                    <div className="flex items-center mt-1 text-sm">
                      <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {booking.date === "pending-admin-assignment" 
                          ? "Date to be assigned by admin" 
                          : booking.date}
                        {booking.date !== "pending-admin-assignment" && booking.time !== "pending-admin-assignment" && 
                          ` at ${booking.time}`}
                        {booking.date !== "pending-admin-assignment" && booking.time === "pending-admin-assignment" && 
                          " (time to be assigned by admin)"}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      booking.status === "pending"
                        ? "outline"
                        : booking.status === "approved"
                          ? "default"
                          : booking.status === "rejected"
                            ? "destructive"
                            : "secondary"
                    }
                  >
                    {booking.status === "pending"
                      ? "Pending Approval"
                      : booking.status === "approved"
                        ? "Approved"
                        : booking.status === "rejected"
                          ? "Rejected"
                          : booking.status}
                  </Badge>
                </div>

                {booking.status === "pending" && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded">
                    <p className="text-sm text-yellow-700">
                      <strong>Waiting for admin approval.</strong> Your booking is being processed, and the admin will assign a date and time for your session.
                    </p>
                  </div>
                )}

                {booking.status === "rejected" && booking.rejectionReason && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    <p>
                      <strong>Reason:</strong> {booking.rejectionReason}
                    </p>
                  </div>
                )}

                {booking.status === "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setActiveTab("mentorships")
                    }}
                  >
                    Book Another Session
                  </Button>
                )}

                {booking.status === "approved" && (
                  <div className="mt-2">
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-sm text-green-700">
                        <strong>Session confirmed!</strong> Be sure to join on time.
                      </p>
                    </div>

                    {/* Add review button for approved bookings */}
                    <div className="mt-2">
                      <Button
                        onClick={() =>
                          setShowReviewForm((prev) => ({
                            ...prev,
                            [booking._id]: !prev[booking._id],
                          }))
                        }
                        variant="outline"
                        size="sm"
                      >
                        {showReviewForm[booking._id] ? "Cancel" : "Leave a Review"}
                      </Button>

                      {showReviewForm[booking._id] && (
                        <div className="mt-2">
                          <textarea
                            className="w-full border rounded p-2 text-sm"
                            placeholder="Write your feedback..."
                            value={reviewInput}
                            onChange={(e) => setReviewInput(e.target.value)}
                          />
                          <div className="flex items-center mt-2 mb-2">
                            <span className="text-sm mr-2">Rating:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 cursor-pointer ${
                                    (reviewRating[booking._id] || 0) >= star
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                  onClick={() =>
                                    setReviewRating((prev) => ({ ...prev, [booking._id]: star }))
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="mt-2"
                            disabled={!reviewInput.trim() || reviewSubmitting}
                            onClick={() =>
                              handleSubmitReview(booking._id, booking.mentorId)
                            }
                          >
                            Submit Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* No bookings with this specific mentor */}
          {bookings.length > 0 &&
            bookings.filter((booking) => booking.mentorId === mentor._id).length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You don&apos;t have any bookings with this mentor yet
                </p>
                <Button onClick={() => setActiveTab("mentorships")}>Book Your First Session</Button>
              </div>
            )}
        </div>
      )}
              </CardContent>
            </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Add Review Card for Approved Sessions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Approved Sessions</CardTitle>
          <CardDescription>Leave reviews for your completed sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div>
              {bookings
                .filter(
                  (booking) =>
                    booking.mentorId === mentor._id &&
                    booking.status === "approved" &&
                    new Date(`${booking.date}T${booking.time}`) < new Date(),
                )
                .map((booking) => (
                  <div key={booking._id} className="mb-4 p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{booking.mentorship.title}</h4>
                      <div className="text-sm text-muted-foreground">
                        {booking.date} at {booking.time}
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        setShowReviewForm((prev) => ({
                          ...prev,
                          [booking._id]: !prev[booking._id],
                        }))
                      }
                    >
                      {showReviewForm[booking._id] ? "Cancel" : "Leave a Review"}
                    </Button>

                    {showReviewForm[booking._id] && (
                      <div className="mt-2">
                        <textarea
                          className="w-full border rounded p-2"
                          placeholder="Write your feedback..."
                          value={reviewInput}
                          onChange={(e) => setReviewInput(e.target.value)}
                        />
                        <div className="flex items-center mt-2 mb-2">
                          <span className="text-sm mr-2">Rating:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-5 w-5 cursor-pointer ${
                                  (reviewRating[booking._id] || 0) >= star
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                                onClick={() => setReviewRating((prev) => ({ ...prev, [booking._id]: star }))}
                              />
                            ))}
                          </div>
                        </div>
                        <Button
                          className="mt-2"
                          disabled={!reviewInput.trim() || reviewSubmitting}
                          onClick={() => handleSubmitReview(booking._id, booking.mentorId)}
                        >
                          Submit Review
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

              {bookings.filter(
                (booking) =>
                  booking.mentorId === mentor._id &&
                  booking.status === "approved" &&
                  new Date(`${booking.date}T${booking.time}`) < new Date(),
              ).length === 0 && <p className="text-muted-foreground">No completed sessions available for review.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
