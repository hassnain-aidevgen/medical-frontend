"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle } from "lucide-react"

// Form schema
const ticketFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
})

type TicketFormValues = z.infer<typeof ticketFormSchema>

// Mock ticket data
type TicketStatus = "Open" | "In Progress" | "Resolved"

interface Ticket {
  id: string
  email: string
  subject: string
  message: string
  status: TicketStatus
  createdAt: string
  updatedAt: string
}

// Mock data for demonstration
const mockTickets: Ticket[] = [
  {
    id: "ticket-1",
    email: "user@example.com",
    subject: "Question about specialty mentors",
    message: "I'm looking for a mentor in pediatric neurology. Do you have any available?",
    status: "Open",
    createdAt: "2025-03-25T10:30:00Z",
    updatedAt: "2025-03-25T10:30:00Z",
  },
  {
    id: "ticket-2",
    email: "user@example.com",
    subject: "Technical issue with video call",
    message: "I experienced audio problems during my last mentorship session. How can I prevent this in the future?",
    status: "In Progress",
    createdAt: "2025-03-23T14:15:00Z",
    updatedAt: "2025-03-24T09:45:00Z",
  },
  {
    id: "ticket-3",
    email: "user@example.com",
    subject: "Billing question",
    message: "I was charged twice for my last session. Can you help me resolve this?",
    status: "Resolved",
    createdAt: "2025-03-20T16:20:00Z",
    updatedAt: "2025-03-22T11:10:00Z",
  },
]

// Helper function to safely access localStorage
const getStoredTickets = (): Ticket[] => {
  if (typeof window === "undefined") return mockTickets

  try {
    const storedTickets = localStorage.getItem("bioverse-support-tickets")
    return storedTickets ? JSON.parse(storedTickets) : mockTickets
  } catch (error) {
    console.error("Error retrieving tickets from localStorage:", error)
    return mockTickets
  }
}

// Helper function to safely store tickets
const storeTickets = (tickets: Ticket[]): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("bioverse-support-tickets", JSON.stringify(tickets))
  } catch (error) {
    console.error("Error storing tickets in localStorage:", error)
  }
}

export default function SupportTicketPanel() {
  // Initialize with stored tickets or mock data
  const [tickets, setTickets] = useState<Ticket[]>(getStoredTickets())
  const [showTickets, setShowTickets] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      email: "",
      subject: "",
      message: "",
    },
  })

  // Handle form submission
  const onSubmit = async (data: TicketFormValues) => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create new ticket
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Update tickets state and localStorage
    const updatedTickets = [newTicket, ...tickets]
    setTickets(updatedTickets)
    storeTickets(updatedTickets)

    // Reset form
    form.reset()
    setIsSubmitting(false)
  }

  // Get status badge
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "Open":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Open
          </Badge>
        )
      case "In Progress":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        )
      case "Resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </Badge>
        )
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Add ability to update ticket status (for demonstration)
  const updateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }
        : ticket,
    )

    setTickets(updatedTickets)
    storeTickets(updatedTickets)
  }

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-2xl font-bold mb-6">Support Ticket System</h2>

      {/* Ticket Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit a Support Ticket</CardTitle>
          <CardDescription>
            Can&apos;t find what you&apos;re looking for? Submit a ticket and our support team will assist you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of your issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about your question or issue"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {tickets.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Your Tickets</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowTickets(!showTickets)}>
              {showTickets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {showTickets && (
            <div className="mt-4 space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{ticket.subject}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Submitted on {formatDate(ticket.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ticket.status)}
                        {/* Status update dropdown (for demonstration) */}
                        {ticket.status !== "Resolved" && (
                          <div className="relative ml-2">
                            <select
                              className="text-xs border rounded p-1 bg-background"
                              value={ticket.status}
                              onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>{ticket.message}</p>
                  </CardContent>
                  <CardFooter className="bg-muted/50 py-2 px-6 text-xs text-muted-foreground">
                    <div className="flex justify-between w-full">
                      <span>Ticket ID: {ticket.id}</span>
                      {ticket.updatedAt !== ticket.createdAt && (
                        <span>Last updated: {formatDate(ticket.updatedAt)}</span>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

