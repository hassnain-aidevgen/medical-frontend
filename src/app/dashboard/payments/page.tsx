"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"
import {
  Check,
  CreditCard,
  Loader2,
  TriangleAlert,
  Clock,
  Trophy,
  Gift,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Suspense } from 'react';

// import ReferralSection from "./components/ReferralSection" // <-- the new component
import ReferralSection from "./RefferalPage"

const API_BASE_URL = "https://medical-backend-3eek.onrender.com"

const plans = [
  {
    title: "Monthly",
    price: "$13",
    description: "Billed monthly",
    features: [
      "Full platform access",
      "Unlimited usage",
      "Priority support",
      "Access to all features",
      "7-day free trial",
    ],
    planKey: "monthly",
    period: "month",
    highlighted: false,
  },
  {
    title: "Quarterly",
    price: "$32",
    description: "Billed every 3 months",
    features: [
      "Everything in Monthly plan",
      "Save 18% compared to monthly",
      "Premium support",
      "7-day free trial",
      "Cancel anytime",
    ],
    planKey: "quarterly",
    period: "quarter",
    highlighted: true,
  },
  {
    title: "Annual",
    price: "$120",
    description: "Billed annually",
    features: [
      "Everything in Quarterly plan",
      "Save 23% compared to monthly",
      "Priority support",
      "7-day free trial",
      "Best value",
    ],
    planKey: "annual",
    period: "year",
    highlighted: false,
  },
]

export default function PaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [subscriptionStatus, setSubscriptionStatus] = useState("")
  const [isInTrial, setIsInTrial] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState(0)
  const [nextBillingDate, setNextBillingDate] = useState<Date | null>(null)
  const [currentPlan, setCurrentPlan] = useState("")
  const [currentPlanName, setCurrentPlanName] = useState("")
  const [subscriptionId, setSubscriptionId] = useState("")
  const [loadingPlans, setLoadingPlans] = useState<{ [key: string]: boolean }>({})
  const [isOpen, setIsOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [targetPage, setTargetPage] = useState("")

  const [hasHadTrialBefore, setHasHadTrialBefore] = useState(false)
  const [trialEligible, setTrialEligible] = useState(true)

  // This is the only referral state we keep in the parent, 
  // so we can apply discount to plan pricing
  const [referralDiscount, setReferralDiscount] = useState(false)

  // Fetch user & subscription data
  useEffect(() => {
    const checkProtectedRoute = async () => {
      try {
        const token = localStorage.getItem("authToken")

        if (!token) {
          alert("You must log in first.")
          window.location.href = "/login"
          return
        }

        const response = await axios.get(`${API_BASE_URL}/api/auth/protected`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setUserId(response.data.userId)
        setUserEmail(response.data.email)
      } catch (err) {
        console.error("Protected route error:", err)
        router.push("/login")
      }
    }

    checkProtectedRoute()
  }, [router])

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        // Check subscription status
        const checkResponse = await axios.post(`${API_BASE_URL}/api/payment/check-customer`, {
          user_id: userId,
        })

        if (checkResponse.data.is_existing_customer) {
          setSubscriptionStatus(checkResponse.data.subscription_status)
          setCurrentPlan(checkResponse.data.current_plan || "")
          setCurrentPlanName(checkResponse.data.current_plan_name || "")
          setSubscriptionId(checkResponse.data.subscription_id || "")
          setHasHadTrialBefore(checkResponse.data.has_had_trial_before || false)

          if (checkResponse.data.subscription_status === "active") {
            const trialResponse = await axios.post(`${API_BASE_URL}/api/payment/check-trial-status`, {
              user_id: userId,
            })

            setIsInTrial(trialResponse.data.in_trial || false)
            setTrialDaysLeft(trialResponse.data.trial_days_left || 0)
            if (trialResponse.data.next_billing_date) {
              setNextBillingDate(new Date(trialResponse.data.next_billing_date))
            }
          }
        } else {
          // new user
          setTrialEligible(true)
        }
      } catch (error) {
        console.error("Error fetching customer data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomerData()
  }, [userId])

  // Helper: format date
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // Condition to show trial
  const shouldShowTrialOffer = () => {
    return trialEligible && !hasHadTrialBefore && !currentPlan
  }

  // Check if plan is current
  const isPlanCurrent = (planTitle: string) => {
    if (!currentPlanName) return false
    return planTitle.toLowerCase() === currentPlanName.toLowerCase()
  }

  // Stripe subscription logic (unchanged)
  const handleStripeSubscription = async (planKey: string) => {
    setLoadingPlans((prev) => ({ ...prev, [planKey]: true }))

    if (!userId) {
      setIsOpen(true)
      setAlertMessage("You must be logged in to select a plan!")
      setTargetPage("login")
      setLoadingPlans((prev) => ({ ...prev, [planKey]: false }))
      return
    }

    try {
      if (subscriptionStatus === "active") {
        // Portal session
        const portalResponse = await axios.post(`${API_BASE_URL}/api/payment/create-portal-session`, {
          user_id: userId,
          subscription_id: subscriptionId,
        })
        window.location.href = portalResponse.data.url
      } else {
        // Checkout session
        const checkoutResponse = await axios.post(`${API_BASE_URL}/api/payment/create-checkout-session`, {
          user_id: userId,
          selected_plan: planKey,
          subscription_id: subscriptionId || "",
          promotion_code: localStorage.getItem("referralCode") || null,
        })
        window.location.href = checkoutResponse.data.url
      }
    } catch (error) {
      console.error("Error handling subscription:", error)
      setIsOpen(true)
      setAlertMessage("An error occurred while handling the subscription. Please try again later.")
      setTargetPage("")
    } finally {
      setLoadingPlans((prev) => ({ ...prev, [planKey]: false }))
    }
  }

  return (
    <div className="min-h-screen container py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 text-center">Subscription Plans</h1>

        {referralDiscount && !currentPlan && (
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-lg font-semibold mb-2">
              <Gift className="h-4 w-4 inline-block mr-1" />
              You&apos;ve been referred! Enjoy 10% off your first payment
            </div>
          </div>
        )}

        {shouldShowTrialOffer() ? (
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-lg font-semibold mb-2">
              <span className="mr-2">🎁</span>
              Special Offer: 7-Day Free Trial
            </div>
            <p className="text-gray-600">
              Experience all premium features without being charged. Cancel anytime during your trial.
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-600 mb-6">
            Choose the plan that works best for your needs
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading subscription details...</span>
          </div>
        ) : (
          <>
            {currentPlan && (
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        Current Plan: <span className="text-primary">{currentPlanName}</span>
                      </CardTitle>
                      <CardDescription className="text-base mt-1">Your active subscription</CardDescription>
                    </div>
                    {isInTrial ? (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-sm py-1">
                        <Clock className="h-4 w-4 mr-1" /> Trial Period ({trialDaysLeft} days left)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-sm py-1">
                        {subscriptionStatus === "active" ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isInTrial && (
                      <div className="flex items-center p-4 bg-blue-50 rounded-md">
                        <Clock className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium">Your trial ends on {formatDate(nextBillingDate)}</p>
                          <div className="mt-2">
                            <Progress value={((7 - trialDaysLeft) / 7) * 100} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              You&apos;ll be automatically billed after the trial ends
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isInTrial && nextBillingDate && (
                      <div className="flex items-center p-4 bg-gray-50 rounded-md">
                        <CreditCard className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium">
                            Next billing date: {formatDate(nextBillingDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      <Button
                        onClick={() =>
                          currentPlanName
                            ? handleStripeSubscription(currentPlanName.toLowerCase())
                            : null
                        }
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-center mb-8">
              <CreditCard className="h-5 w-5 mr-2" />
              <span className="font-medium">Secure Payment with Stripe</span>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const isCurrent = isPlanCurrent(plan.title)
                const isPopular = plan.highlighted && !currentPlanName

                return (
                  <Card
                    key={index}
                    className={`flex flex-col h-full transition-all duration-200 hover:shadow-md ${isCurrent ? "border-primary border-2 shadow-md ring-1 ring-primary/20" : ""
                      } ${isPopular ? "border-blue-400 shadow-md" : ""}`}
                  >
                    <CardHeader
                      className={`pb-4 ${isCurrent
                        ? "bg-primary/10"
                        : isPopular
                          ? "bg-gradient-to-r from-blue-50 to-purple-50"
                          : ""
                        }`}
                    >
                      <div className="relative">
                        {isCurrent && (
                          <div className="absolute -top-2 -right-2">
                            <Badge variant="default" className="bg-primary text-white">
                              Current
                            </Badge>
                          </div>
                        )}
                        {isPopular && (
                          <div className="absolute -top-2 -right-2">
                            <Badge variant="default" className="bg-blue-500 text-white">
                              <Trophy className="h-3 w-3 mr-1" /> Popular
                            </Badge>
                          </div>
                        )}
                        <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow pb-6">
                      <p className="text-3xl font-bold mb-4">
                        {referralDiscount && !currentPlan ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="line-through text-gray-400 text-xl mr-2">{plan.price}</span>
                                {plan.title === "Monthly"
                                  ? "$11.70"
                                  : plan.title === "Quarterly"
                                    ? "$28.80"
                                    : "$108.00"}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>10% referral discount applied!</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          plan.price
                        )}
                        <span className="text-sm font-normal">/{plan.period}</span>
                      </p>

                      {shouldShowTrialOffer() && (
                        <div className="bg-blue-50 text-blue-800 p-2 rounded-md mb-4 text-sm">
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-blue-500 mr-1 shrink-0" />
                            <span className="font-medium">Includes 7-day free trial</span>
                          </div>
                        </div>
                      )}

                      {referralDiscount && !currentPlan && (
                        <div className="bg-green-50 text-green-800 p-2 rounded-md mb-4 text-sm">
                          <div className="flex items-center">
                            <Gift className="h-4 w-4 text-green-500 mr-1 shrink-0" />
                            <span className="font-medium">10% referral discount </span>

                          </div>
                          <p className="text-[8px] ml-6">{localStorage.getItem("referralCode")}</p>
                        </div>
                      )}

                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <Check
                              className={`h-5 w-5 mr-2 shrink-0 mt-0.5 ${isCurrent
                                ? "text-primary"
                                : isPopular
                                  ? "text-blue-500"
                                  : "text-green-500"
                                }`}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        onClick={() => handleStripeSubscription(plan.planKey)}
                        className={`w-full ${isCurrent
                          ? "bg-primary hover:bg-primary/90"
                          : isPopular
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            : ""
                          }`}
                        variant={isCurrent || isPopular ? "default" : "default"}
                        disabled={loadingPlans[plan.planKey] || (isCurrent && !isInTrial)}
                      >
                        {loadingPlans[plan.planKey] ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        {isCurrent
                          ? isInTrial
                            ? "Current Trial Plan"
                            : "Current Plan"
                          : shouldShowTrialOffer()
                            ? `Start Free Trial`
                            : `Select ${plan.title} Plan`}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
              {shouldShowTrialOffer() && (
                <p className="mt-1 text-blue-600">
                  You can cancel your subscription anytime during your trial period without being charged.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Here is where you mount the new ReferralSection. 
         * Pass all the states/props needed so that the logic stays the same.
         */}

      <Suspense fallback={<div><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <ReferralSection
          API_BASE_URL={API_BASE_URL}
          userId={userId}
          userEmail={userEmail}
          hasHadTrialBefore={hasHadTrialBefore}
          currentPlan={currentPlan}
          subscriptionStatus={subscriptionStatus}
          isInTrial={isInTrial}
          trialDaysLeft={trialDaysLeft}
          nextBillingDate={nextBillingDate}
          referralDiscount={referralDiscount}
          setReferralDiscount={setReferralDiscount}
        />
      </Suspense>

      {/* Alert Dialog for subscription page-specific notifications */}
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
            <AlertDialogAction onClick={() => (targetPage ? router.push(`/${targetPage}`) : setIsOpen(false))}>
              {targetPage ? `Go to ${targetPage}` : "Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
