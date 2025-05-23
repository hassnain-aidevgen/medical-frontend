"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Facebook, Mail, Twitter } from "lucide-react"

interface ShareReportDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    shareUrl: string
    shareEmail: string
    setShareEmail: (email: string) => void
    shareNote: string
    setShareNote: (note: string) => void
    handleShareReport: (method: "email" | "copy" | "social") => void
}

export default function ShareReportDialog({
    isOpen,
    setIsOpen,
    shareUrl,
    shareEmail,
    setShareEmail,
    shareNote,
    setShareNote,
    handleShareReport,
}: ShareReportDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Analytics Report</DialogTitle>
                    <DialogDescription>Share your performance report with colleagues or mentors</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="share-link" className="text-right text-sm font-medium col-span-1">
                            Link
                        </label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input id="share-link" value={shareUrl} readOnly className="col-span-3" />
                            <Button size="icon" variant="outline" onClick={() => handleShareReport("copy")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="email" className="text-right text-sm font-medium col-span-1">
                            Email
                        </label>
                        <Input
                            id="email"
                            placeholder="colleague@example.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="note" className="text-right text-sm font-medium col-span-1">
                            Note
                        </label>
                        <Textarea
                            id="note"
                            placeholder="Add a personal note..."
                            value={shareNote}
                            onChange={(e) => setShareNote(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleShareReport("social")}>
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShareReport("social")}>
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleShareReport("social")}>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                        </Button>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => handleShareReport("email")} type="submit">
                        Share Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
