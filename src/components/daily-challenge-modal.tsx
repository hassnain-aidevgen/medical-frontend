// "use client"

// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { useDailyChallenge } from "@/contexts/daily-challenge-context"
// import { Calendar, Trophy } from "lucide-react"
// import { useRouter } from "next/navigation"
// import { useState } from "react"

// type DailyChallengeModalProps = {
//     onClose: () => void
// }

// export default function DailyChallengeModal({ onClose }: DailyChallengeModalProps) {
//     const [open, setOpen] = useState(true)
//     const router = useRouter()
//     const { challenge, completed, loading, error } = useDailyChallenge()

//     const handleClose = () => {
//         setOpen(false)
//         onClose()
//     }

//     const startChallenge = () => {
//         if (challenge) {
//             router.push(`/dashboard/daily-challenge/${challenge._id}`)
//             handleClose()
//         }
//     }

//     const viewResults = () => {
//         if (challenge) {
//             router.push(`/dashboard/daily-challenge/results`)
//             handleClose()
//         }
//     }

//     if (loading) {
//         return (
//             <Dialog open={open} onOpenChange={setOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Loading Daily Challenge...</DialogTitle>
//                     </DialogHeader>
//                 </DialogContent>
//             </Dialog>
//         )
//     }

//     if (error) {
//         return (
//             <Dialog open={open} onOpenChange={setOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Error</DialogTitle>
//                         <DialogDescription>{error}</DialogDescription>
//                     </DialogHeader>
//                     <Button onClick={handleClose}>Close</Button>
//                 </DialogContent>
//             </Dialog>
//         )
//     }

//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogContent className="sm:max-w-md">
//                 <DialogHeader>
//                     <DialogTitle className="flex items-center gap-2 text-xl">
//                         <Calendar className="h-5 w-5 text-primary" />
//                         Daily Challenge
//                     </DialogTitle>
//                     <DialogDescription>
//                         {completed
//                             ? "You've already completed today's challenge!"
//                             : "Test your knowledge with today's 10 medical questions."}
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="flex flex-col items-center py-4">
//                     {completed ? (
//                         <>
//                             <div className="mb-4 flex flex-col items-center">
//                                 <Trophy className="h-16 w-16 text-yellow-500 mb-2" />
//                                 <p className="text-center text-muted-foreground">
//                                     Great job completing today&apos;s challenge! Check your results or come back tomorrow for a new set of
//                                     questions.
//                                 </p>
//                             </div>
//                             <Button onClick={viewResults} className="w-full">
//                                 View Your Results
//                             </Button>
//                         </>
//                     ) : (
//                         <>
//                             <div className="mb-4 p-4 bg-primary/10 rounded-lg w-full">
//                                 <h3 className="font-medium mb-2">Today&apos;s Challenge Includes:</h3>
//                                 <ul className="list-disc list-inside text-sm text-muted-foreground">
//                                     <li>10 carefully selected medical questions</li>
//                                     <li>Questions from various specialties</li>
//                                     <li>Track your progress over time</li>
//                                     <li>Compare with other medical students</li>
//                                 </ul>
//                             </div>
//                             <div className="flex gap-2 w-full">
//                                 <Button variant="outline" onClick={handleClose} className="flex-1">
//                                     Later
//                                 </Button>
//                                 <Button onClick={startChallenge} className="flex-1">
//                                     Start Challenge
//                                 </Button>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </DialogContent>
//         </Dialog>
//     )
// }

