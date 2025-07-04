"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, X } from "lucide-react"
import axios from "axios"
import { toast } from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AddExamTypeDialogProps = {
    onExamTypeAdded: (newExamType: { name: string }) => void;
  };

  const AddExamTypeDialog: React.FC<AddExamTypeDialogProps> = ({ onExamTypeAdded }) => {
  const [newExamType, setNewExamType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e: { target: { value: string } }) => {
    // Only allow alphanumeric and underscore
    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toUpperCase()
    setNewExamType(value)
    setError("")
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    
    if (!newExamType.trim()) {
      setError("Please enter an exam type name")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await axios.post("https://medical-backend-3eek.onrender.com/api/exam-type/add-exam-type", {
        name: newExamType
      })
      
      setSuccess(true)
      
      // Call the callback to update the parent component
      if (onExamTypeAdded) {
        onExamTypeAdded(response.data.examType)
      }
      
      setTimeout(() => {
        setIsOpen(false)
        setNewExamType("")
        setSuccess(false)
      }, 2000)
      
    } catch (error) {
      console.error("Error adding exam type:", error)
      setError((error as any).response?.data?.message || "Failed to add exam type")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const resetState = () => {
    setNewExamType("")
    setError("")
    setSuccess(false)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetState()
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center  "
        >
          <PlusCircle className="h-4 w-4" />
          {/* <span>Add Exam Type</span> */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Exam Type</DialogTitle>
          <DialogDescription>
            Enter a name for the new exam type. Only uppercase letters, numbers, and underscores are allowed.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            type="text"
            value={newExamType}
            onChange={handleChange}
            placeholder="EXAM_TYPE_NAME"
            className={error ? "border-red-500" : ""}
            disabled={isSubmitting || success}
            autoFocus
          />
          
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="py-2 bg-green-50 border-green-500 text-green-800">
              <AlertDescription className="text-sm">
                Exam type added successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || success || !newExamType.trim()}
              className={success ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isSubmitting ? "Adding..." : success ? "Added Successfully" : "Add Exam Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddExamTypeDialog