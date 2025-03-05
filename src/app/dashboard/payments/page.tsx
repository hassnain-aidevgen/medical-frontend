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
 return(<>payment</>);
}

