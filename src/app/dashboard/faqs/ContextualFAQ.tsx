"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

// Define the FAQ data structure
interface FAQItem {
  id: string
  question: string
  answer: string
}

interface FAQCategory {
  id: string
  name: string
  questions: FAQItem[]
}

// The complete FAQ database (same structure as in page.tsx)
const faqCategories: FAQCategory[] = [
  {
    id: "general",
    name: "General",
    questions: [
      {
        id: "what-is",
        question: "What is Bioverse?",
        answer:
          "Bioverse is a platform that connects medical professionals seeking mentorship with experienced mentors in various medical specialties. Our platform facilitates knowledge sharing, career guidance, and professional development through one-on-one mentorship sessions.",
      },
      {
        id: "how-works",
        question: "How does the mentorship program work?",
        answer:
          "Our mentorship program works in three simple steps: First, browse our catalog of verified medical mentors and find someone whose expertise matches your needs. Second, book a session at a time that works for both of you. Third, connect with your mentor via our secure video platform for your scheduled session. After the session, you can leave feedback and book follow-up sessions if desired.",
      },
      {
        id: "who-mentors",
        question: "Who are the mentors?",
        answer:
          "Our mentors are experienced medical professionals from various specialties including physicians, surgeons, researchers, healthcare administrators, and other healthcare experts. All mentors are vetted for their qualifications, experience, and commitment to mentoring. Many have 10+ years of experience in their fields and hold leadership positions at respected medical institutions.",
      },
      {
        id: "benefits",
        question: "What are the benefits of finding a mentor?",
        answer:
          "Finding a mentor can provide numerous benefits including personalized guidance tailored to your career goals, access to industry insights and best practices, networking opportunities, skill development, confidence building, and accelerated career progression. Medical mentors can help with everything from clinical skills to research guidance, career decisions, and work-life balance strategies.",
      },
    ],
  },
  {
    id: "sessions",
    name: "Mentorship Sessions",
    questions: [
      {
        id: "session-length",
        question: "How long are mentorship sessions?",
        answer:
          "Mentorship sessions typically last between 30 to 60 minutes, depending on the mentor's offering. The exact duration is clearly indicated on each mentor's profile and mentorship package.",
      },
      {
        id: "session-format",
        question: "What happens during a mentorship session?",
        answer:
          "During a mentorship session, you'll connect with your mentor via our secure video platform. The content of the session depends on your goals and the mentor's expertise. Sessions may include discussions about career advice, clinical case reviews, research guidance, skill development, or any other professional topics you've agreed to discuss. We encourage you to come prepared with specific questions or topics to make the most of your time.",
      },
      {
        id: "prepare",
        question: "How should I prepare for my first session?",
        answer:
          "To make the most of your mentorship session, we recommend: 1) Clearly defining your goals and what you hope to achieve, 2) Preparing specific questions or topics you'd like to discuss, 3) Gathering any relevant materials or information that might be helpful, 4) Testing your audio/video setup before the session, and 5) Being ready to take notes during your conversation.",
      },
      {
        id: "reschedule",
        question: "Can I reschedule or cancel my session?",
        answer:
          "Yes, you can reschedule or cancel your session through your dashboard. Please note that cancellations must be made at least 24 hours before the scheduled session to be eligible for a refund or rescheduling. Last-minute cancellations or no-shows may result in forfeiture of the session fee.",
      },
    ],
  },
  {
    id: "booking",
    name: "Booking & Payments",
    questions: [
      {
        id: "how-book",
        question: "How do I book a session with a mentor?",
        answer:
          "To book a session, first browse our mentor directory and select a mentor who matches your needs. On their profile, you'll see their available mentorship offerings. Select your preferred mentorship package, choose an available date and time slot from their calendar, and proceed to checkout. After completing payment, you'll receive a confirmation email with session details.",
      },
      {
        id: "payment-methods",
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) for payment. All transactions are processed securely through Stripe, our payment processor.",
      },
      {
        id: "pricing",
        question: "How is pricing determined?",
        answer:
          "Pricing varies based on the mentor's experience, expertise, and the type of mentorship offering. Each mentor sets their own rates, which are clearly displayed on their profile and mentorship packages. Prices typically range from $50 to $300 per session, depending on the mentor's seniority and the session duration.",
      },
      {
        id: "refunds",
        question: "What is your refund policy?",
        answer:
          "If you cancel more than 24 hours before your scheduled session, you'll receive a full refund. Cancellations within 24 hours of the session are not eligible for refunds. If a mentor cancels a session, you'll automatically receive a full refund or have the option to reschedule. If you're unsatisfied with your session, please contact our support team within 48 hours, and we'll work to resolve the issue.",
      },
    ],
  },
  {
    id: "technical",
    name: "Technical Questions",
    questions: [
      {
        id: "tech-requirements",
        question: "What are the technical requirements for mentorship sessions?",
        answer:
          "For the best experience, we recommend: 1) A stable internet connection (minimum 1 Mbps, 5+ Mbps recommended), 2) An updated browser (Chrome, Firefox, Safari, or Edge), 3) A working webcam and microphone, 4) Headphones for better audio quality, and 5) A quiet, well-lit environment for your session.",
      },
      {
        id: "connection-issues",
        question: "What if I experience technical difficulties during my session?",
        answer:
          "If you experience technical issues during your session, first try refreshing your browser. If problems persist, you can use the in-session chat to communicate with your mentor. Our platform automatically logs connection issues, and if significant time is lost due to technical problems on our end, we'll offer to extend the session or provide partial credit for a future session.",
      },
      {
        id: "browser-compatibility",
        question: "Which browsers are supported?",
        answer:
          "Our platform works best with the latest versions of Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience. Internet Explorer is not supported.",
      },
      {
        id: "mobile-support",
        question: "Can I use the platform on mobile devices?",
        answer:
          "Yes, our platform is fully responsive and works on smartphones and tablets. For the best experience, we recommend using our mobile app (available for iOS and Android) or accessing the platform through a mobile browser in landscape mode.",
      },
    ],
  },
  {
    id: "privacy",
    name: "Privacy & Security",
    questions: [
      {
        id: "data-protection",
        question: "How is my personal information protected?",
        answer:
          "We take data protection seriously. All personal information is encrypted and stored securely in compliance with HIPAA and GDPR regulations. We never share your personal information with third parties without your explicit consent. For more details, please review our Privacy Policy.",
      },
      {
        id: "session-confidentiality",
        question: "Are my mentorship sessions confidential?",
        answer:
          "Yes, all mentorship sessions are strictly confidential. Sessions are not recorded by default (though you and your mentor may agree to record for educational purposes). Our mentors adhere to professional codes of conduct and confidentiality agreements. Any clinical discussions must follow anonymization protocols to protect patient privacy.",
      },
      {
        id: "hipaa",
        question: "Is the platform HIPAA compliant?",
        answer:
          "Yes, our platform is designed to be HIPAA compliant for discussions related to medical cases. However, we remind all users that specific patient identifiers should never be shared during sessions. When discussing clinical cases, all information should be properly anonymized in accordance with HIPAA guidelines.",
      },
    ],
  },
]

// Context tag to FAQ mapping
const contextMapping: Record<string, { title: string; questionIds: string[] }> = {
  booking: {
    title: "Booking Help",
    questionIds: ["how-book", "payment-methods", "pricing", "refunds"],
  },
  payment: {
    title: "Payment Information",
    questionIds: ["payment-methods", "pricing", "refunds"],
  },
  session: {
    title: "Session Information",
    questionIds: ["session-length", "session-format", "prepare", "reschedule"],
  },
  technical: {
    title: "Technical Support",
    questionIds: ["tech-requirements", "connection-issues", "browser-compatibility", "mobile-support"],
  },
  "profile-editing": {
    title: "Profile Help",
    questionIds: ["data-protection", "who-mentors"],
  },
  "mentor-search": {
    title: "Finding the Right Mentor",
    questionIds: ["who-mentors", "benefits", "how-book"],
  },
  privacy: {
    title: "Privacy & Security",
    questionIds: ["data-protection", "session-confidentiality", "hipaa"],
  },
}

// Helper function to find a question by ID across all categories
const findQuestionById = (id: string): FAQItem | undefined => {
  for (const category of faqCategories) {
    const question = category.questions.find((q) => q.id === id)
    if (question) return question
  }
  return undefined
}

interface ContextualFAQProps {
  contextTag: string
  maxQuestions?: number
  showTitle?: boolean
  compact?: boolean
}

export default function ContextualFAQ({
  contextTag,
  maxQuestions = 4,
  showTitle = true,
  compact = false,
}: ContextualFAQProps) {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined)

  // Get the context mapping for the provided tag
  const contextConfig = contextMapping[contextTag]

  // If no mapping exists for this context tag, return null
  if (!contextConfig) {
    return null
  }

  // Get the questions for this context
  const questions = contextConfig.questionIds
    .map((id) => findQuestionById(id))
    .filter((q): q is FAQItem => q !== undefined)
    .slice(0, maxQuestions)

  // If no questions found, return null
  if (questions.length === 0) {
    return null
  }

  return (
    <Card className={compact ? "border-0 shadow-none" : ""}>
      {showTitle && (
        <CardHeader className={compact ? "px-0 pt-0 pb-2" : ""}>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            {contextConfig.title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? "px-0 py-0" : ""}>
        <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem} className="w-full">
          {questions.map((question) => (
            <AccordionItem key={question.id} value={question.id} className={compact ? "border-b-0" : ""}>
              <AccordionTrigger className={`text-left ${compact ? "py-2 text-sm" : ""}`}>
                {question.question}
              </AccordionTrigger>
              <AccordionContent className={compact ? "text-sm" : ""}>
                <div className={`${compact ? "py-2" : "pt-2 pb-4"} text-muted-foreground`}>{question.answer}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

