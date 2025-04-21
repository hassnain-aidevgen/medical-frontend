"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Calendar, Clock, Search, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"
import toast from "react-hot-toast"
import Link from "next/link"

// API base URL from environment variable or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com/api"

interface MentorData {
    _id: string
    name: string
    avatar: string
    title: string
    company: string
}

interface BookingRequest {
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
    userId: string
    user: {
        _id: string
        name: string
        email: string
        avatar?: string
    }
    date: string
    time: string
    status: "pending" | "approved" | "rejected" | "completed" | "cancelled"
    paymentStatus: "pending" | "completed" | "refunded"
    rejectionReason?: string
    createdAt: string
}

export default function MentorRequestsPage() {
    const params = useParams()
    const router = useRouter()
    const mentorId = params.id as string

    // Handle undefined or invalid mentorId
    useEffect(() => {
        if (!mentorId || mentorId === "undefined") {
            toast.error("Invalid mentor ID. Redirecting to mentor list.")
            router.push("/admin/mentor")
        }
    }, [mentorId, router])

    const [mentor, setMentor] = useState<MentorData | null>(null)
    const [requests, setRequests] = useState<BookingRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [requestToReject, setRequestToReject] = useState<BookingRequest | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [processingRequest, setProcessingRequest] = useState<string | null>(null)
    
    // New state for approval dialog
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [requestToApprove, setRequestToApprove] = useState<BookingRequest | null>(null)
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")

    useEffect(() => {
        fetchMentorAndRequests()
    }, [mentorId, router])

    const getAuthToken = () => {
        if (typeof window === "undefined") return null
    
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    
        if (!token || token === "undefined") {
            console.warn("[AUTH] No token found in storage")
            return null
        }
    
        console.log("[AUTH] Fetched token:", token)
        return token
    }
    
    axios.interceptors.request.use((config) => {
        console.log("[AXIOS] Request URL:", config.url)
        console.log("[AXIOS] Headers:", config.headers)
        return config
    }, (error) => {
        console.error("[AXIOS] Error in request:", error)
        return Promise.reject(error)
    })
    

    const fetchMentorAndRequests = async () => {
        console.log("=====[ fetchMentorAndRequests INITIATED ]=====");
    
        // Check if mentorId is provided and valid
        if (!mentorId || mentorId === "undefined") {
            console.warn("[WARN] mentorId is missing or invalid:", mentorId);
            return;
        }
    
        setLoading(true);
        setError(null);
    
        console.log(`[INFO] Starting fetch for mentorId: ${mentorId}`);
        console.log(`[INFO] API Base URL: ${API_BASE_URL}`);
    
        try {
            // -------------------- Fetch Mentor Data --------------------
            console.log(`[REQUEST] Fetching mentor data from: ${API_BASE_URL}/mentor/${mentorId}`);
            const mentorResponse = await axios.get(`${API_BASE_URL}/mentor/${mentorId}`);
    
            if (mentorResponse?.data?.success) {
                console.log("[SUCCESS] Mentor data fetched successfully");
                console.log("[DATA] Mentor:", mentorResponse.data.data);
                setMentor(mentorResponse.data.data);
            } else {
                console.warn("[WARN] Mentor data response received but 'success' flag is false");
            }
    
            // -------------------- Fetch Booking Requests --------------------
            console.log(`[REQUEST] Fetching booking requests for mentorId from: ${API_BASE_URL}/bookings/mentor/${mentorId}`);
            const requestsResponse = await axios.get(`${API_BASE_URL}/bookings/mentor/${mentorId}`);
    
            if (requestsResponse?.data?.success) {
                console.log("[SUCCESS] Booking requests fetched successfully");
                console.log(`[DATA] Total bookings: ${requestsResponse.data.count}`);
                setRequests(requestsResponse.data.data);
            } else {
                console.warn("[WARN] Booking response received but 'success' flag is false");
            }
        } catch (error: any) {
            console.error("[ERROR] Failed to fetch mentor or booking data");
            console.error("[DETAILS]", error);
    
            const errorMsg = error.response?.data?.error || "Failed to load mentor data or requests";
            setError(errorMsg);
            toast.error("Failed to load mentor requests");
    
            // Handle invalid ObjectId errors with redirection
            if (
                error.response?.status === 400 ||
                errorMsg.includes("ObjectId") ||
                error.message?.includes("ObjectId")
            ) {
                console.warn("[REDIRECT] Invalid ObjectId detected. Redirecting to mentor list.");
                toast.error("Invalid mentor ID format. Redirecting to mentor list.");
                router.push("/admin/mentor");
            }
        } finally {
            console.log("=====[ fetchMentorAndRequests COMPLETED ]=====");
            setLoading(false);
        }
    };
    
    

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Search is handled client-side via filteredRequests
    }

    const openRejectDialog = (request: BookingRequest) => {
        setRequestToReject(request)
        setRejectionReason("")
        setRejectDialogOpen(true)
    }
    
    // New function to open approval dialog
    const openApproveDialog = (request: BookingRequest) => {
        setRequestToApprove(request)
        
        // Initialize with the current request date/time if not pending-admin-assignment
        if (request.date !== "pending-admin-assignment") {
            setSelectedDate(request.date)
        } else {
            setSelectedDate(getTodayDate())
        }
        
        if (request.time !== "pending-admin-assignment") {
            setSelectedTime(request.time)
        } else {
            setSelectedTime("09:00")
        }
        
        setApproveDialogOpen(true)
    }
    
    // Helper to get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const handleApprove = async () => {
        if (!requestToApprove) return;
        if (!selectedDate || !selectedTime) {
            toast.error("Please select both date and time");
            return;
        }
    
        setProcessingRequest(requestToApprove._id);
    
        try {
            await axios.post(
                `${API_BASE_URL}/booking/approve/${requestToApprove._id}`,
                {
                    date: selectedDate,
                    time: selectedTime,
                },
                {
                    headers: {
                        "x-user-role": "admin", // Use this instead of token
                    },
                }
            );
    
            toast.success("Booking request approved successfully with scheduled date/time");
    
            setRequests(
                requests.map((req) =>
                    req._id === requestToApprove._id
                        ? { ...req, status: "approved", date: selectedDate, time: selectedTime }
                        : req
                )
            );
    
            setApproveDialogOpen(false);
            setRequestToApprove(null);
            setSelectedDate("");
            setSelectedTime("");
        } catch (error: any) {
            console.error("Error approving request:", error);
            toast.error(error.response?.data?.error || "Failed to approve booking request");
        } finally {
            setProcessingRequest(null);
        }
    };
    

    const handleReject = async () => {
        if (!requestToReject) return;
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }
    
        setProcessingRequest(requestToReject._id);
    
        try {
            await axios.post(
                `${API_BASE_URL}/booking/reject/${requestToReject._id}`,
                { rejectionReason },
                {
                    headers: {
                        "x-user-role": "admin", // Role passed here instead of token
                    },
                }
            );
    
            toast.success("Booking request rejected successfully");
    
            setRequests(
                requests.map((req) =>
                    req._id === requestToReject._id
                        ? { ...req, status: "rejected", rejectionReason }
                        : req
                )
            );
    
            setRejectDialogOpen(false);
            setRequestToReject(null);
            setRejectionReason("");
        } catch (error: any) {
            console.error("Error rejecting request:", error);
            toast.error(error.response?.data?.error || "Failed to reject booking request");
        } finally {
            setProcessingRequest(null);
        }
    };
    

    const filteredRequests = requests.filter(request => 
        request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.mentorship?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.date?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const pendingRequests = filteredRequests.filter(req => req.status === "pending")
    const processedRequests = filteredRequests.filter(req => req.status !== "pending")

    const formatDate = (dateString: string) => {
        if (dateString === "pending-admin-assignment") {
            return "To be assigned"
        }
        
        try {
            // Check if date is already in readable format
            if (dateString.includes("/") || dateString.includes("-")) {
                return dateString
            }
            
            // Try to format ISO date
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            })
        } catch (error) {
            return dateString
        }
    }

    // Generate time options from 9am to 6pm in half-hour increments
    const generateTimeOptions = () => {
        const options = []
        for (let hour = 9; hour <= 18; hour++) {
            const hourStr = hour > 12 ? (hour - 12) : hour
            const ampm = hour >= 12 ? 'PM' : 'AM'
            
            options.push(`${String(hourStr).padStart(2, '0')}:00 ${ampm}`)
            if (hour < 18) {
                options.push(`${String(hourStr).padStart(2, '0')}:30 ${ampm}`)
            }
        }
        return options
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center mb-6">
                <Link href="/admin/mentor" className="mr-4">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">
                    {loading ? "Loading..." : `Mentor Requests: ${mentor?.name || "Unknown"}`}
                </h1>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="w-full md:w-auto flex gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name, mentorship or date..."
                            className="pl-8 w-full md:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
                
                <Button 
                    variant="outline" 
                    onClick={fetchMentorAndRequests} 
                    disabled={loading}
                >
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading requests...</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
                        {pendingRequests.length === 0 ? (
                            <div className="text-center p-8 border rounded-md">
                                <p className="text-muted-foreground">No pending requests found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingRequests.map((request) => (
                                    <Card key={request._id} className="shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between">
                                                <div>
                                                    <CardTitle>{request.mentorship?.title || "Untitled Mentorship"}</CardTitle>
                                                    <CardDescription>
                                                        Duration: {request.mentorship?.duration || "N/A"}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline">Pending</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center">
                                                    <Avatar className="h-8 w-8 mr-2">
                                                        <AvatarImage src={request.user?.avatar || "/placeholder.svg"} alt={request.user?.name || "User"} />
                                                        <AvatarFallback>{request.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{request.user?.name || "Unknown"}</p>
                                                        <p className="text-sm text-muted-foreground">{request.user?.email || "No email"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>{formatDate(request.date)}</span>
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>{request.time === "pending-admin-assignment" ? "To be assigned" : request.time}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-between">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => openRejectDialog(request)}
                                                className="w-[48%]"
                                                disabled={processingRequest === request._id}
                                            >
                                                {processingRequest === request._id ? 
                                                    <div className="animate-pulse">Processing...</div> : 
                                                    "Reject"
                                                }
                                            </Button>
                                            <Button 
                                                onClick={() => openApproveDialog(request)}
                                                className="w-[48%]"
                                                disabled={processingRequest === request._id}
                                            >
                                                {processingRequest === request._id ? 
                                                    <div className="animate-pulse">Processing...</div> : 
                                                    "Approve"
                                                }
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 mt-8">
                        <h2 className="text-xl font-semibold">Processed Requests ({processedRequests.length})</h2>
                        {processedRequests.length === 0 ? (
                            <div className="text-center p-8 border rounded-md">
                                <p className="text-muted-foreground">No processed requests found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {processedRequests.map((request) => (
                                    <Card key={request._id} className="shadow-sm">
                                        <CardHeader>
                                            <div className="flex justify-between">
                                                <div>
                                                    <CardTitle>{request.mentorship?.title || "Untitled Mentorship"}</CardTitle>
                                                    <CardDescription>
                                                        Duration: {request.mentorship?.duration || "N/A"}
                                                    </CardDescription>
                                                </div>
                                                <Badge 
                                                    variant={
                                                        request.status === "approved" ? "default" : 
                                                        request.status === "rejected" ? "destructive" : 
                                                        request.status === "completed" ? "secondary" : 
                                                        "outline"
                                                    }
                                                >
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center">
                                                    <Avatar className="h-8 w-8 mr-2">
                                                        <AvatarImage src={request.user?.avatar || "/placeholder.svg"} alt={request.user?.name || "User"} />
                                                        <AvatarFallback>{request.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{request.user?.name || "Unknown"}</p>
                                                        <p className="text-sm text-muted-foreground">{request.user?.email || "No email"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>{formatDate(request.date)}</span>
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span>{request.time === "pending-admin-assignment" ? "To be assigned" : request.time}</span>
                                                </div>
                                                {request.status === "rejected" && request.rejectionReason && (
                                                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
                                                        <p className="text-sm font-medium text-red-800">Rejection reason:</p>
                                                        <p className="text-sm text-red-700">{request.rejectionReason}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Rejection Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Booking Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this booking request. This reason will be sent to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                            required
                        />
                        {!rejectionReason.trim() && (
                            <p className="text-sm text-red-500 mt-1">
                                Please provide a rejection reason
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processingRequest === requestToReject?._id}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={!rejectionReason.trim() || processingRequest === requestToReject?._id}
                        >
                            {processingRequest === requestToReject?._id ? 
                                <div className="animate-pulse">Processing...</div> : 
                                "Reject Booking"
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Approval Dialog with Date/Time Selection */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Booking Session</DialogTitle>
                        <DialogDescription>
                            Please select a date and time for this mentorship session. This schedule will be sent to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="date" className="block text-sm font-medium">
                                Session Date
                            </label>
                            <Input
                                id="date"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={getTodayDate()}
                                required
                            />
                            {!selectedDate && (
                                <p className="text-sm text-red-500">Please select a date</p>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="time" className="block text-sm font-medium">
                                Session Time
                            </label>
                            <select
                                id="time"
                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                required
                            >
                                <option value="">Select a time</option>
                                {generateTimeOptions().map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                            {!selectedTime && (
                                <p className="text-sm text-red-500">Please select a time</p>
                            )}
                        </div>
                        
                        <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>Booking details:</strong>
                            </p>
                            <p className="text-sm text-blue-700">
                                User: {requestToApprove?.user?.name || "Unknown"}<br />
                                Mentorship: {requestToApprove?.mentorship?.title || "Unknown"}<br />
                                Duration: {requestToApprove?.mentorship?.duration || "Unknown"}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={processingRequest === requestToApprove?._id}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleApprove} 
                            disabled={!selectedDate || !selectedTime || processingRequest === requestToApprove?._id}
                        >
                            {processingRequest === requestToApprove?._id ? 
                                <div className="animate-pulse">Processing...</div> : 
                                "Approve & Schedule"
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}