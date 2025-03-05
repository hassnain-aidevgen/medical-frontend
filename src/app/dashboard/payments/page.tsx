"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { loadStripe } from "@stripe/stripe-js"
import axios from "axios"
import { ArrowRight, CheckCircle, CreditCard, Shield, Sparkles, Star, Zap } from "lucide-react"
import { type ReactNode, useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

// API base URL
export interface Plan {
  id: string
  name: string
  price: number
  color: string
  icon: ReactNode
  features: string[]
  popular?: boolean
}

// User data types
export interface UserData {
  userId: string
}

// API response types
export interface StripeCheckoutResponse {
  url: string
  sessionId?: string
}

export interface PayPalOrderResponse {
  id: string
  status?: string
}

export interface PayPalCaptureResponse {
  success: boolean
  message: string
  transactionId: string
}

export interface PortalSessionResponse {
  url: string
}

export interface PayPalOrderData {
  orderID: string | null
  payerID?: string | null
  paymentID?: string | null
  billingToken?: string | null
  facilitatorAccessToken?: string | null
}

// Update the SubscriptionStatus interface to match the model
export interface SubscriptionStatus {
  hasSubscription: boolean
  subscription?: {
    status: "pending" | "active" | "canceled" | "paused" | "failed"
    plan: string
    startDate: string
    endDate: string
    paymentMethod: "stripe" | "paypal"
    cancelAtPeriodEnd: boolean
  }
  message?: string
}

const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test"

// Initialize Stripe with the public key
loadStripe(
  "pk_test_51Qz9OEBhTy94fwIRuEWGfnIC438xajMHuYhZlQLprgyDaz0SGTUISWP0SVs20MIKYdih3Tl0mMrs4bMZWvpAeWEK001HdQXotQ",
)

// Plan details
const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 5,
    color: "blue",
    icon: <Zap className="h-5 w-5" />,
    features: ["Access to basic study materials", "Limited flash cards", "Basic performance tracking"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 10,
    color: "green",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      "Everything in Basic",
      "Unlimited flash cards",
      "Advanced performance analytics",
      "Custom study calendar",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 20,
    color: "purple",
    icon: <Star className="h-5 w-5" />,
    features: [
      "Everything in Standard",
      "Priority support",
      "Personalized study plans",
      "AI-powered recommendations",
      "Exclusive premium content",
    ],
  },
]

export default function PaymentsPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("standard")
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe")
  const [loading, setLoading] = useState<boolean>(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [fetchingStatus, setFetchingStatus] = useState<boolean>(true)

  // Get user data from localStorage
  const getUserData = useCallback((): UserData | null => {
    if (typeof window === "undefined") return null

    const userId = localStorage.getItem("Medical_User_Id")

    if (!userId) {
      toast.error("User information not found. Please log in again.")
      return null
    }

    return { userId }
  }, [])

  // Fetch user subscription status
  const fetchSubscriptionStatus = useCallback(async (): Promise<void> => {
    try {
      const userData = getUserData()
      if (!userData) {
        setFetchingStatus(false)
        return
      }

      const { userId } = userData

      const response = await axios.get<SubscriptionStatus>(`${API_BASE_URL}/subscription-status/${userId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      setSubscriptionStatus(response.data)
    } catch (error) {
      console.error("Error fetching subscription status:", error)

      // If 404, it means no subscription found, which is a valid state
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setSubscriptionStatus({
          hasSubscription: false,
          message: "No active subscription found",
        })
      } else {
        toast.error("Failed to fetch subscription status")
      }
    } finally {
      setFetchingStatus(false)
    }
  }, [getUserData])

  // Fetch subscription status on component mount
  useEffect(() => {
    fetchSubscriptionStatus()
  }, [fetchSubscriptionStatus])

  // Handle Stripe payment
  const handleStripePayment = async (): Promise<void> => {
    setLoading(true)
    const loadingToast = toast.loading("Processing payment...")

    try {
      const userData = getUserData()
      if (!userData) {
        toast.dismiss(loadingToast)
        setLoading(false)
        return
      }

      const { userId } = userData

      // Direct API call to the checkout endpoint
      const response = await axios.post<StripeCheckoutResponse>(
        `${API_BASE_URL}/checkout`,
        {
          userId,
          selectedPlan: selectedPlan,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      toast.dismiss(loadingToast)

      if (response.data.url) {
        window.location.href = response.data.url
      } else {
        toast.error("Failed to create checkout session")
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Payment error:", error)

      let errorMessage = "Payment processing failed"
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle PayPal payment
  const createPayPalOrder = async (): Promise<string | null> => {
    const userData = getUserData()
    if (!userData) return null

    const { userId } = userData
    const selectedPlanObj = plans.find((plan) => plan.id === selectedPlan)

    if (!selectedPlanObj) {
      toast.error("Invalid plan selected")
      return null
    }

    try {
      // Direct API call to create PayPal order
      const response = await axios.post<PayPalOrderResponse>(
        `${API_BASE_URL}/create-paypal-order`,
        {
          userId,
          selectedPlan: selectedPlan,
          amount: selectedPlanObj.price,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      return response.data.id
    } catch (error) {
      console.error("PayPal order creation error:", error)

      let errorMessage = "Failed to create PayPal order"
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
      return null
    }
  }

  const onPayPalApprove = async (data: PayPalOrderData): Promise<void> => {
    const loadingToast = toast.loading("Finalizing payment...")

    try {
      const userData = getUserData()
      if (!userData) {
        toast.dismiss(loadingToast)
        return
      }

      const { userId } = userData

      // Direct API call to capture PayPal order
      const response = await axios.post<PayPalCaptureResponse>(
        `${API_BASE_URL}/capture-paypal-order`,
        {
          orderId: data.orderID,
          userId,
          selectedPlan,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      toast.dismiss(loadingToast)
      toast.success("Payment successful!")

      // Refresh subscription status
      await fetchSubscriptionStatus()

      // Redirect to success page
      window.location.href = "http://localhost:3000/dashboard/success"
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("PayPal capture error:", error)

      let errorMessage = "Payment processing failed"
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    }
  }

  // Handle customer portal access
  const handleManageSubscription = async (): Promise<void> => {
    const loadingToast = toast.loading("Loading subscription portal...")

    try {
      const userData = getUserData()
      if (!userData) {
        toast.dismiss(loadingToast)
        return
      }

      const { userId } = userData

      // Direct API call to create portal session
      const response = await axios.post<PortalSessionResponse>(
        `${API_BASE_URL}/create-portal-session`,
        {
          user_id: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      toast.dismiss(loadingToast)

      if (response.data.url) {
        window.location.href = response.data.url
      } else {
        toast.error("Failed to access subscription portal")
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Portal session error:", error)

      let errorMessage = "Failed to access subscription portal"
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    }
  }

  // Handle subscription cancellation
  const handleCancelSubscription = async (): Promise<void> => {
    const loadingToast = toast.loading("Processing cancellation...")

    try {
      const userData = getUserData()
      if (!userData) {
        toast.dismiss(loadingToast)
        return
      }

      const { userId } = userData

      // Direct API call to cancel subscription
      await axios.post(
        `${API_BASE_URL}/cancel-subscription`,
        {
          userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      toast.dismiss(loadingToast)
      toast.success("Subscription will be canceled at the end of the billing period")

      // Refresh subscription status
      await fetchSubscriptionStatus()
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Cancellation error:", error)

      let errorMessage = "Failed to cancel subscription"
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    }
  }

  // Handle subscription reactivation
  const handleReactivateSubscription = async (): Promise<void> => {
    const loadingToast = toast.loading("Reactivating subscription...")

    try {
      const userData = getUserData()
      if (!userData) {
        toast.dismiss(loadingToast)
        return
      }

      const { userId } = userData

      // Direct API call to reactivate subscription
      await axios.post(
        `${API_BASE_URL}/reactivate-subscription`,
        {
          userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      toast.dismiss(loadingToast)
      toast.success("Subscription reactivated successfully")

      // Refresh subscription status
      await fetchSubscriptionStatus()
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Reactivation error:", error)

      let errorMessage = "Failed to reactivate subscription"
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    }
  }

  // Determine if user has an active subscription
  const hasActiveSubscription =
    subscriptionStatus?.hasSubscription && subscriptionStatus.subscription?.status === "active"

  // Get current subscription plan
  const currentPlan = hasActiveSubscription ? subscriptionStatus?.subscription?.plan : null

  // Check if subscription is scheduled for cancellation
  const isScheduledForCancellation =
    hasActiveSubscription && subscriptionStatus?.subscription?.cancelAtPeriodEnd === true

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Toaster position="top-right" />

      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">Choose the plan that best fits your learning needs</p>
        </div>

        {/* Subscription Status Banner */}
        {fetchingStatus ? (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-center">Loading subscription status...</p>
          </div>
        ) : hasActiveSubscription ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Active Subscription</h3>
                <p className="text-sm text-green-700">
                  You have an active {subscriptionStatus?.subscription?.plan} plan subscription.
                  {subscriptionStatus?.subscription?.endDate && (
                    <>
                      {" "}
                      Your subscription {isScheduledForCancellation ? "will end" : "renews"} on{" "}
                      {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString()}.
                    </>
                  )}
                  {isScheduledForCancellation && (
                    <span className="block mt-1 text-amber-600">
                      Your subscription is scheduled to cancel at the end of the billing period.
                    </span>
                  )}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                  {isScheduledForCancellation ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-500 hover:text-green-700 hover:bg-green-50"
                      onClick={handleReactivateSubscription}
                    >
                      Reactivate Subscription
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">No Active Subscription</h3>
                <p className="text-sm text-blue-700">
                  You don't have an active subscription. Choose a plan below to get started.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            {!hasActiveSubscription ? (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Secure payments</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">You're subscribed to the {currentPlan} plan</span>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`border-2 ${hasActiveSubscription && currentPlan === plan.id
                  ? "border-green-500"
                  : selectedPlan === plan.id
                    ? "border-primary"
                    : "border-border"
                  } transition-all hover:shadow-md ${hasActiveSubscription && currentPlan !== plan.id ? "opacity-70" : ""
                  }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className={`p-2 rounded-full bg-primary/10 text-primary`}>{plan.icon}</div>
                    {plan.popular && (
                      <Badge variant="secondary" className="font-medium">
                        Popular
                      </Badge>
                    )}
                    {hasActiveSubscription && currentPlan === plan.id && (
                      <Badge variant="outline" className="font-medium bg-green-50 text-green-700 border-green-200">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 min-h-[180px]">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {hasActiveSubscription && currentPlan === plan.id ? (
                    <Button
                      variant="outline"
                      className="w-full text-green-700 border-green-200"
                      onClick={handleManageSubscription}
                    >
                      <span className="flex items-center gap-2">
                        Manage Subscription <ArrowRight className="h-4 w-4" />
                      </span>
                    </Button>
                  ) : (
                    <Button
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedPlan(plan.id)}
                      disabled={hasActiveSubscription}
                    >
                      {selectedPlan === plan.id ? (
                        <span className="flex items-center gap-2">
                          Selected <CheckCircle className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" /> Select Plan
                        </span>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {!hasActiveSubscription && (
            <div className="mt-8">
              <Tabs defaultValue="stripe" onValueChange={(value) => setPaymentMethod(value as "stripe" | "paypal")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="stripe">Pay with Stripe</TabsTrigger>
                  <TabsTrigger value="paypal">Pay with PayPal</TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Pay with Credit Card</CardTitle>
                      <CardDescription>Secure payment processing by Stripe</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span>You&apos;ll be redirected to Stripe&apos;s secure checkout page</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={handleStripePayment} disabled={loading}>
                        {loading ? (
                          "Processing..."
                        ) : (
                          <span className="flex items-center gap-2">
                            Proceed to Payment <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="paypal" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Pay with PayPal</CardTitle>
                      <CardDescription>Secure payment processing by PayPal</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center w-full">
                        <PayPalScriptProvider
                          options={{
                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                            currency: "USD",
                          }}
                        >
                          <PayPalButtons
                            style={{ layout: "vertical" }}
                            createOrder={async () => {
                              const orderId = await createPayPalOrder()
                              if (!orderId) {
                                throw new Error("Failed to create order")
                              }
                              return orderId
                            }}
                            onApprove={async (data) => {
                              await onPayPalApprove(data)
                            }}
                            onError={(err) => {
                              console.error("PayPal error:", err)
                              toast.error("PayPal payment failed. Please try again.")
                            }}
                          />
                        </PayPalScriptProvider>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg mt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through Stripe and PayPal. Your payment information is never stored
                on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

