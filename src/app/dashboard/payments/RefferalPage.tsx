"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useSearchParams } from "next/navigation"
import {
    TriangleAlert,
    Share2,
    Gift,
    Copy,
    CheckCircle,
    DollarSign,
    CreditCard,
    Users,
    Loader2,
} from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReferralSectionProps {
    API_BASE_URL: string
    userId: string
    userEmail: string
    hasHadTrialBefore: boolean
    currentPlan: string
    subscriptionStatus: string
    // Whether the user is currently in an active subscription
    isInTrial: boolean
    trialDaysLeft: number
    nextBillingDate: Date | null
    // If you need to set or read the "referralDiscount" from parent, pass it as well:
    referralDiscount: boolean
    setReferralDiscount: (val: boolean) => void
    // We also pass "isLoading" or other states if needed
}

export default function ReferralSection({
    API_BASE_URL,
    userId,
    userEmail,
    hasHadTrialBefore,
    currentPlan,
    subscriptionStatus,
    isInTrial,
    trialDaysLeft,
    nextBillingDate,
    referralDiscount,
    setReferralDiscount,
}: ReferralSectionProps) {
    const searchParams = useSearchParams()

    // --------------------------------------------------------------------------------
    // State variables copied directly from your original code
    // --------------------------------------------------------------------------------
    const [referralCode, setReferralCode] = useState("")
    const [hasReferralCode, setHasReferralCode] = useState(false)
    const [wasReferred, setWasReferred] = useState(false)
    const [referrerId, setReferrerId] = useState<string | null>(null)
    const [referralDiscountLocal, setReferralDiscountLocal] = useState(false)
    const [copySuccess, setCopySuccess] = useState(false)
    const [referralStats, setReferralStats] = useState({
        totalReferred: 0,
        activeSubscriptions: 0,
        earnedCommission: 0,
    })
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
    const [referredUsers, setReferredUsers] = useState<any[]>([])
    const [totalCommission, setTotalCommission] = useState(0)
    const [isCreatingReferralCode, setIsCreatingReferralCode] = useState(false)
    const [referralCodeInput, setReferralCodeInput] = useState("")
    const [commissions, setCommissions] = useState<any[]>([])

    // For alerts
    const [isOpen, setIsOpen] = useState(false)
    const [alertMessage, setAlertMessage] = useState("")
    const [targetPage, setTargetPage] = useState("")

    const formatDate = (date: Date | string | null) => {
        if (!date) return "N/A"
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    // Helper: Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount)
    }

    // Create referral code if user doesn't have one
    const createReferralCode = async () => {
        if (!userId) return

        setIsCreatingReferralCode(true)
        try {
            const response = await axios.get(`${API_BASE_URL}/api/refferal/user-code/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
            })

            setReferralCode(response.data.referralCode)
            setHasReferralCode(true)
            setIsReferralModalOpen(true)
        } catch (error) {
            console.error("Error creating referral code:", error)
            setAlertMessage("Failed to create referral code. Please try again.")
            setIsOpen(true)
        } finally {
            setIsCreatingReferralCode(false)
        }
    }

    // Validate referral code (apply discount)
    const validateReferralCode = async (code: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/payment/validate-referral`, {
                referralCode: code,
            })

            if (response.data.valid) {
                setReferralDiscount(true) // parent also sees discount
                setReferralDiscountLocal(true) // local usage, if needed
                localStorage.setItem("referralCode", code)

                if (response.data.referrerId) {
                    localStorage.setItem("referrerId", response.data.referrerId)
                    setReferrerId(response.data.referrerId)
                }

                setAlertMessage(`Referral code applied! You'll get ${response.data.discount || "10%"} off your first payment.`)
                setIsOpen(true)
            } else {
                setReferralDiscount(false)
                setAlertMessage(response.data.error || "Invalid referral code. Please try again.")
                setIsOpen(true)
            }
        } catch (error) {
            console.error("Error validating referral code:", error)
            setAlertMessage("Failed to validate referral code. Please try again.")
            setIsOpen(true)
        }
    }

    // Fetch user’s referral code
    const fetchReferralCode = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/refferal/fetch-code/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
            })
            
            // Update based on the new response structure
            if (response.data.hasReferralCode) {
                setReferralCode(response.data.referralCode)
                setHasReferralCode(true)
            } else {
                setHasReferralCode(false)
            }
        } catch (error) {
            console.error("Error fetching referral code:", error)
            
            // Optional: Set an alert if fetch fails
            setAlertMessage("Unable to retrieve referral code. Please try again later.")
            setIsOpen(true)
            
            // Ensure hasReferralCode is set to false on error
            setHasReferralCode(false)
        }
    }


    const copyReferralCode = async () => {
        try {
            await navigator.clipboard.writeText(referralCode)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (err) {
            console.error("Failed to copy referral code:", err)
        }
    }

    // Fetch referral stats + referred users
    const fetchDetailedReferralStats = async () => {
        if (!userId || !hasReferralCode) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/api/payment/referrals/stats/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
            });

            // Add proper error checking for the response
            if (!response.data) return;

            // Make sure to get referredUsers from the API response
            setReferredUsers(response.data.referredUsers || []);
            setTotalCommission(response.data.totalCommission || 0);
            // setAvailableBalance(response.data.availableBalance || 0);
            setCommissions(response.data.commissions || []);
            console.log("commissions", response.data.commissions)
        } catch (error) {
            console.error("Error fetching detailed referral stats:", error);
        }
    };


    // Check if user was referred or has code in local storage
    useEffect(() => {
        const ref = searchParams.get("ref")
        if (ref) {
            localStorage.setItem("referralCode", ref)
            validateReferralCode(ref)
        } else {
            const storedCode = localStorage.getItem("referralCode")
            if (storedCode) {
                validateReferralCode(storedCode)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // On mount, check if user has existing referral code & stats
    useEffect(() => {
        const fetchCustomerData = async () => {
            if (!userId) return

            try {
                // Check subscription status + referral info
                const checkResponse = await axios.post(`${API_BASE_URL}/api/payment/check-customer`, {
                    user_id: userId,
                })

                if (checkResponse.data.is_existing_customer) {
                    setWasReferred(checkResponse.data.was_referred || false)
                    if (checkResponse.data.was_referred) {
                        setReferrerId(checkResponse.data.referrer_id)
                    }

                    setHasReferralCode(checkResponse.data.has_referral_code || false)
                    if (checkResponse.data.has_referral_code) {
                        fetchReferralCode()
                    }

                    // If subscription is active, fetch stats
                    if (checkResponse.data.subscription_status === "active") {
                        const trialResponse = await axios.post(`${API_BASE_URL}/api/payment/check-trial-status`, {
                            user_id: userId,
                        })
                        if (trialResponse.data.referral_stats) {
                            setReferralStats(trialResponse.data.referral_stats)
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching customer data (for referral):", error)
            }
        }
        fetchCustomerData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    useEffect(() => {
        if (userId && hasReferralCode) {
            fetchDetailedReferralStats();
        }
    }, [userId, hasReferralCode]);

    // --------------------------------------------------------------------------------
    // Render the same referral UI from your code
    // --------------------------------------------------------------------------------
    return (
        <>
            {/* Only if user has no plan, show manual referral code input (like your code) */}
            {!currentPlan && (
                <div className="mb-6 max-w-md mx-auto">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Have a referral code?"
                                value={referralCodeInput}
                                onChange={(e) => setReferralCodeInput(e.target.value)}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                if (referralCodeInput) {
                                    // Clear any existing referral code
                                    if (localStorage.getItem("referralCode")) {
                                        localStorage.removeItem("referralCode")
                                        localStorage.removeItem("referrerId")
                                    }
                                    validateReferralCode(referralCodeInput)
                                }
                            }}
                            disabled={!referralCodeInput}
                        >
                            Apply Code
                        </Button>
                    </div>
                </div>
            )}
            {/* If user is an active subscriber but doesn't have a code, show a "Get Referral Code" button */}
            {currentPlan && !hasReferralCode && subscriptionStatus === "active" && (
                <Card className="mb-8 border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle>Get Your Referral Code</CardTitle>
                        <CardDescription>
                            You can share your referral code with friends to get 5% commission on their subscription payments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={createReferralCode}
                            variant="outline"
                            className="w-full"
                            disabled={isCreatingReferralCode}
                        >
                            {isCreatingReferralCode ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                            Generate Referral Code
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* If user is not subscribed at all, show a referral discount message if relevant */}
            {referralDiscount && !currentPlan && (
                <div className="text-center mb-6">
                    <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-lg font-semibold mb-2">
                        <Gift className="h-4 w-4 inline-block mr-1" />
                        You&apos;ve been referred! Enjoy 10% off your first payment
                    </div>
                </div>
            )}

            {/* Additional block for referral stats if user has a referral code and is subscribed */}
            {(hasReferralCode || referralStats.totalReferred > 0) && !(!currentPlan) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-xl mx-auto">
                    <h3 className="font-medium text-base mb-2">Earn with our Referral Program</h3>
                    <p className="text-gray-600 mb-3">
                        Share your referral code with friends and earn 5% commission on all their subscription payments!
                    </p>
                    {referralStats.totalReferred > 0 ? (
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="text-xl font-bold">{referralStats.totalReferred}</p>
                                <p className="text-xs text-gray-500">Referred Users</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold">{referralStats.activeSubscriptions}</p>
                                <p className="text-xs text-gray-500">Active Subscribers</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold">${referralStats.earnedCommission.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Commission Earned</p>
                            </div>
                            <div className="col-span-3">
                                <Button
                                    onClick={() => {
                                        fetchDetailedReferralStats()
                                        setIsReferralModalOpen(true)
                                    }}
                                    variant="outline"
                                    className="mt-2 w-full"
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    View Referral Details
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={() => {
                                fetchDetailedReferralStats()
                                setIsReferralModalOpen(true)
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            View Referral Dashboard
                        </Button>
                    )}
                </div>
            )}

            {/* Modal with referral details (stats, payout, etc.) */}
            <Dialog open={isReferralModalOpen} onOpenChange={setIsReferralModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Referral Dashboard</DialogTitle>
                        <DialogDescription>Share your referral code and earn 5% commission on all payments</DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="referrals">Referred Users</TabsTrigger>
                            <TabsTrigger value="earnings">Earnings</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle>Your Referral Code</CardTitle>
                                    <CardDescription>Share this code with friends</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="bg-muted p-3 rounded-md border flex-grow font-mono text-center text-lg">
                                            {referralCode}
                                        </div>
                                        <Button
                                            onClick={copyReferralCode}
                                            className="w-full sm:w-auto"
                                            variant={copySuccess ? "outline" : "default"}
                                        >
                                            {copySuccess ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Copy Referral Code
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-3">
                                        Your friends will get 10% off their first payment, and you&apos;ll earn 5% commission on all their
                                        payments!
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center">
                                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                                            Total Referred
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{referralStats.totalReferred || 0}</div>
                                        <p className="text-sm text-gray-500">Users who signed up with your code</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center">
                                            <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                                            Active Subscribers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{referralStats.activeSubscriptions || 0}</div>
                                        <p className="text-sm text-gray-500">Currently paying subscribers</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center">
                                            <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                                            Commission Earned
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-green-600">{formatCurrency(totalCommission || 0)}</div>
                                        <p className="text-sm text-gray-500">Total earnings from referrals</p>
                                    </CardContent>
                                </Card>
                            </div>

                        </TabsContent>

                        {/* Referrals Tab */}
                        <TabsContent value="referrals" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Referred Users</CardTitle>
                                    <CardDescription>Users who signed up with your referral code</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {referredUsers.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Join Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Current Plan</TableHead>
                                                    <TableHead className="text-right">Revenue</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {referredUsers.map((user, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{user.email}</TableCell>
                                                        <TableCell>{formatDate(user.joinDate)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={user.status === "active" ? "default" : "outline"}>
                                                                {user.status === "active" ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{user.currentPlan || "—"}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(user.revenue)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <h3 className="font-medium text-lg">No referred users yet</h3>
                                            <p className="text-gray-500 mt-1">Share your referral code to start earning!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Earnings Tab */}
                        <TabsContent value="earnings" className="space-y-4 pt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Referred User</TableHead>
                                        <TableHead>Plan Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {commissions && commissions.length > 0 ? (
                                        commissions.map((commission, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{formatDate(commission.paymentDate)}</TableCell>
                                                <TableCell>{commission.referredUserEmail || "Unknown"}</TableCell>
                                                <TableCell>{commission.planType}</TableCell>
                                                <TableCell>{formatCurrency(commission.commissionAmount)}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            commission.status === "paid" ? "default" :
                                                                commission.status === "cancelled" ? "destructive" :
                                                                    "outline"
                                                        }
                                                    >
                                                        {commission.status === "paid" ? "Paid" :
                                                            commission.status === "cancelled" ? "Cancelled" :
                                                                "Pending"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">No commissions yet</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <Card>
                                <CardHeader>
                                    <CardTitle>How It Works</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted/40 p-4 rounded-lg">
                                        <h3 className="font-medium mb-2">Referral Program Details</h3>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-start">
                                                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                                <span>Share your referral code with friends</span>
                                            </li>
                                            <li className="flex items-start">
                                                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                                <span>Friends get 10% off their first payment</span>
                                            </li>
                                            <li className="flex items-start">
                                                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                                <span>You earn 5% commission on all their payments</span>
                                            </li>
                                            <li className="flex items-start">
                                                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                                <span>Commissions are added to your balance after each payment</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-medium mb-2">Example earnings:</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Monthly plan ($13/mo):</span>
                                                <span>
                                                    <strong>$0.65</strong> per month per referred user
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Quarterly plan ($32/quarter):</span>
                                                <span>
                                                    <strong>$1.60</strong> per quarter per referred user
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Annual plan ($120/year):</span>
                                                <span>
                                                    <strong>$6.00</strong> per year per referred user
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog */}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center">Notification</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            <TriangleAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
                            <p>{alertMessage}</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsOpen(false)}>
                            Close
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
