"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { loadStripe } from "@stripe/stripe-js"
import { ArrowRight, CheckCircle, CreditCard, Shield, Sparkles, Star, Zap } from "lucide-react"
import { useState } from "react"

// Initialize Stripe with the public key
const stripePromise = loadStripe("pk_test_51Qwr2dQ4u3lPIMsd6lCnTgHH9TBOVoHWlc0uuEbkkd3NP8kip5tIJvLdVmMEBxzz1CloLU2XrKaZPseerPmeJCh3007oito4hM")

// Payment handler function
const handlePayment = async (amount: number, planId: string) => {
  try {
    // Get user data from localStorage
    const userId = localStorage.getItem("Medical_User_Id")
    // const email = localStorage.getItem("Medical_User_Email")
    const email = localStorage.getItem("Medical_User_Email")
    if (!email) return;

    // const res = await fetch("https://medical-backend-loj4.onrender.com/api/test/checkout", {
    const res = await fetch("http://localhost:5000/api/test/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        email,
        selectedPlan: planId,
        amount,
      }),
    })

    const { sessionId } = await res.json()
    const stripe = await stripePromise

    if (stripe) {
      await stripe.redirectToCheckout({ sessionId })
    } else {
      console.error("Stripe failed to load.")
    }
  } catch (error) {
    console.error("Payment error:", error)
  }
}

// Plan details
const plans = [
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
  const [selectedPlan, setSelectedPlan] = useState("standard")

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">Choose the plan that best fits your learning needs</p>
        </div>

        <div className="w-full">
          <div className="flex justify-end items-center mb-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Secure payments via Stripe</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`border-2 ${selectedPlan === plan.id ? "border-primary" : "border-border"} transition-all hover:shadow-md`}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className={`p-2 rounded-full bg-primary/10 text-primary`}>{plan.icon}</div>
                    {plan.popular && (
                      <Badge variant="secondary" className="font-medium">
                        Popular
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
                  <Button
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => {
                      setSelectedPlan(plan.id)
                      handlePayment(plan.price * 100, plan.id)
                    }}
                  >
                    {selectedPlan === plan.id ? (
                      <span className="flex items-center gap-2">
                        Subscribe <ArrowRight className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Select Plan
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg mt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through Stripe. Your payment information is never stored on our
                servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

