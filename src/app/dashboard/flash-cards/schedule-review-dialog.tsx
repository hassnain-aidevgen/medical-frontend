"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import axios from "axios"
import { addDays, addHours, format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

interface ScheduleReviewDialogProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    cardCategory: string
    cardQuestion: string
    cardDifficulty: string
}

export default function ScheduleReviewDialog({
    isOpen,
    onClose,
    userId,
    cardCategory,
    cardQuestion,
    cardDifficulty,
}: ScheduleReviewDialogProps) {
    const [selectedOption, setSelectedOption] = useState<string>("24hours")
    const [customDate, setCustomDate] = useState<Date | undefined>(addDays(new Date(), 1))
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Get color based on difficulty
    const getColorFromDifficulty = (difficulty: string): string => {
        switch (difficulty.toLowerCase()) {
            case "easy":
                return "#22c55e" // green-500
            case "medium":
                return "#f59e0b" // amber-500
            case "hard":
                return "#ef4444" // red-500
            default:
                return "#3b82f6" // blue-500
        }
    }

    // Calculate review date based on selected option
    const getReviewDate = (): Date => {
        const now = new Date()

        switch (selectedOption) {
            case "24hours":
                return addHours(now, 24)
            case "7days":
                return addDays(now, 7)
            case "30days":
                return addDays(now, 30)
            case "custom":
                return customDate || addDays(now, 1)
            default:
                return addHours(now, 24)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
    
        try {
            const reviewDate = getReviewDate();
    
            // Original calendar payload
            const calendarPayload = {
                userId,
                subjectName: cardCategory || "Uncategorized",
                testTopic: cardQuestion.length > 50 ? `${cardQuestion.substring(0, 47)}...` : cardQuestion,
                date: reviewDate.toISOString(),
                color: getColorFromDifficulty(cardDifficulty),
                completed: false,
            };
    
            // Send to calendar endpoint
            await axios.post("https://medical-backend-loj4.onrender.com/api/test/calender", calendarPayload);
            
            // Also send to reviews endpoint to add to upcoming reviews
            await axios.post("http://localhost:5000/api/reviews/add-to-upcoming", {
                userId,
                title: cardQuestion.length > 50 ? `${cardQuestion.substring(0, 47)}...` : cardQuestion,
                scheduledFor: reviewDate.toISOString(),
                type: "daily", // You can change this based on the selected option
                stage: 1
            });
    
            toast.success(`Review scheduled for ${format(reviewDate, "PPP")}`);
            onClose();
        } catch (error) {
            console.error("Error scheduling review:", error);
            toast.error("Failed to schedule review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Review</DialogTitle>
                    <DialogDescription>Choose when you want to review this card again.</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="24hours" id="24hours" />
                            <Label htmlFor="24hours">24 hours from now</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="7days" id="7days" />
                            <Label htmlFor="7days">7 days from now</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="30days" id="30days" />
                            <Label htmlFor="30days">30 days from now</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <Label htmlFor="custom">Custom date</Label>
                        </div>
                    </RadioGroup>

                    {selectedOption === "custom" && (
                        <div className="mt-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn("w-full justify-start text-left font-normal", !customDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {customDate ? format(customDate, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={customDate}
                                        onSelect={setCustomDate}
                                        initialFocus
                                        disabled={(date: Date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <div className="mt-4 text-sm text-slate-500">
                        <Clock className="inline-block mr-1 h-4 w-4" />
                        You&apos;ll review this card on {format(getReviewDate(), "PPPP")}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Scheduling..." : "Schedule Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
