"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Flashcard } from "@/services/api-service"
import { jsPDF } from "jspdf"
import { FileDown, Loader2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

interface PdfExportButtonProps {
    flashcards: Flashcard[]
    filteredCards?: Flashcard[]
    categoryFilter?: string
    difficultyFilter?: string
    tagFilter?: string
}

export default function PdfExportButton({
    flashcards,
    filteredCards,
    categoryFilter,
    difficultyFilter,
    tagFilter,
}: PdfExportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [exportFormat, setExportFormat] = useState<"all" | "qa" | "q" | "a">("all")
    const [exportScope, setExportScope] = useState<"filtered" | "all">("filtered")
    const [includeMetadata, setIncludeMetadata] = useState(true)
    const [includeMastery, setIncludeMastery] = useState(false)
    const [sortBy, setSortBy] = useState<"category" | "difficulty" | "mastery" | "none">("category")
    const [pageSize, setPageSize] = useState<"a4" | "letter" | "legal">("a4")
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")

    const handleExport = async () => {
        setIsExporting(true)

        try {
            // Determine which cards to export
            const cardsToExport = exportScope === "filtered" && filteredCards ? filteredCards : flashcards

            if (cardsToExport.length === 0) {
                toast.error("No flashcards to export")
                setIsExporting(false)
                return
            }

            // Sort cards if needed
            const sortedCards = [...cardsToExport]
            if (sortBy !== "none") {
                sortedCards.sort((a, b) => {
                    if (sortBy === "category") {
                        return (a.category || "").localeCompare(b.category || "")
                    } else if (sortBy === "difficulty") {
                        const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
                        return (
                            (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2) -
                            (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2)
                        )
                    } else if (sortBy === "mastery") {
                        return (a.mastery || 0) - (b.mastery || 0)
                    }
                    return 0
                })
            }

            // Create PDF document
            const pdf = new jsPDF({
                orientation: orientation,
                unit: "mm",
                format: pageSize,
            })

            // Set up dimensions
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 15
            const contentWidth = pageWidth - 2 * margin

            // Add title
            pdf.setFontSize(18)
            pdf.setFont("helvetica", "bold")

            let title = "Flashcards"
            if (categoryFilter) title += ` - ${categoryFilter}`
            if (difficultyFilter) title += ` (${difficultyFilter})`
            if (tagFilter) title += ` #${tagFilter}`

            pdf.text(title, margin, margin)

            // Add export info
            pdf.setFontSize(10)
            pdf.setFont("helvetica", "normal")
            const dateStr = new Date().toLocaleDateString()
            pdf.text(`Exported on: ${dateStr} | Total cards: ${sortedCards.length}`, margin, margin + 8)

            // Add filter info if applicable
            if (exportScope === "filtered" && (categoryFilter || difficultyFilter || tagFilter)) {
                let filterText = "Filters applied: "
                if (categoryFilter) filterText += `Category: ${categoryFilter} `
                if (difficultyFilter) filterText += `Difficulty: ${difficultyFilter} `
                if (tagFilter) filterText += `Tag: ${tagFilter}`
                pdf.text(filterText, margin, margin + 13)
            }

            // Draw line
            pdf.setDrawColor(200, 200, 200)
            pdf.line(margin, margin + 16, pageWidth - margin, margin + 16)

            let y = margin + 25
            let currentCategory = ""

            // Process each card
            for (let i = 0; i < sortedCards.length; i++) {
                const card = sortedCards[i]

                // Add category header if sorting by category and category changes
                if (sortBy === "category" && card.category !== currentCategory) {
                    // Check if we need a new page
                    if (y > pageHeight - 30) {
                        pdf.addPage()
                        y = margin
                    }

                    currentCategory = card.category || "Uncategorized"
                    pdf.setFont("helvetica", "bold")
                    pdf.setFontSize(14)
                    pdf.text(currentCategory, margin, y)
                    y += 8

                    // Draw line under category
                    pdf.setDrawColor(220, 220, 220)
                    pdf.line(margin, y, pageWidth - margin, y)
                    y += 6
                }

                // Calculate card height based on content
                const questionLines = pdf.splitTextToSize(card.question || "", contentWidth)
                const answerLines = pdf.splitTextToSize(card.answer || "", contentWidth)

                let cardHeight = 10 // Base height

                // Add height for question and answer based on export format
                if (exportFormat === "all" || exportFormat === "qa" || exportFormat === "q") {
                    cardHeight += questionLines.length * 6
                }

                if (exportFormat === "all" || exportFormat === "qa" || exportFormat === "a") {
                    cardHeight += answerLines.length * 6
                }

                // Add height for metadata if included
                if (includeMetadata) {
                    cardHeight += 10
                    if (card.hint) cardHeight += 10
                    if (card.tags && card.tags.length > 0) cardHeight += 6
                }

                // Check if we need a new page
                if (y + cardHeight > pageHeight - margin) {
                    pdf.addPage()
                    y = margin
                }

                // Draw card
                pdf.setDrawColor(180, 180, 180)
                pdf.setFillColor(250, 250, 250)
                pdf.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "FD")

                y += 6

                // Add card number
                pdf.setFont("helvetica", "normal")
                pdf.setFontSize(8)
                pdf.setTextColor(120, 120, 120)
                pdf.text(`Card ${i + 1}/${sortedCards.length}`, pageWidth - margin - 20, y)

                // Add question if applicable
                if (exportFormat === "all" || exportFormat === "qa" || exportFormat === "q") {
                    pdf.setFont("helvetica", "bold")
                    pdf.setFontSize(12)
                    pdf.setTextColor(0, 0, 0)
                    pdf.text("Q:", margin + 5, y)
                    pdf.setFont("helvetica", "normal")
                    pdf.text(questionLines, margin + 15, y)
                    y += questionLines.length * 6 + 4
                }

                // Add answer if applicable
                if (exportFormat === "all" || exportFormat === "qa" || exportFormat === "a") {
                    pdf.setFont("helvetica", "bold")
                    pdf.setFontSize(12)
                    pdf.setTextColor(0, 0, 0)
                    pdf.text("A:", margin + 5, y)
                    pdf.setFont("helvetica", "normal")
                    pdf.text(answerLines, margin + 15, y)
                    y += answerLines.length * 6 + 4
                }

                // Add metadata if included
                if (includeMetadata) {
                    pdf.setFontSize(9)
                    pdf.setTextColor(80, 80, 80)

                    let metadataText = `Category: ${card.category || "Uncategorized"} | Difficulty: ${card.difficulty || "medium"}`

                    if (includeMastery) {
                        metadataText += ` | Mastery: ${card.mastery || 0}%`
                    }

                    pdf.text(metadataText, margin + 5, y)
                    y += 5

                    // Add hint if available
                    if (card.hint) {
                        pdf.setTextColor(180, 120, 0)
                        pdf.text(`Hint: ${card.hint}`, margin + 5, y)
                        y += 5
                    }

                    // Add tags if available
                    if (card.tags && card.tags.length > 0) {
                        pdf.setTextColor(100, 100, 100)
                        pdf.text(`Tags: ${card.tags.join(", ")}`, margin + 5, y)
                        y += 5
                    }

                    if (includeMetadata && card.imageUrl) {
                        y += 5;
                        pdf.setTextColor(100, 100, 100);
                        pdf.text("Image available at: " + card.imageUrl, margin + 5, y);
                        y += 5;
                      }
                }

                y += 10 // Space between cards
            }

            // Add footer with page numbers
            const pageCount = pdf.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i)
                pdf.setFontSize(10)
                pdf.setTextColor(100, 100, 100)
                pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" })
            }

            // Save the PDF
            pdf.save("flashcards.pdf")

            toast.success(`Successfully exported ${sortedCards.length} flashcards to PDF`)
            setIsDialogOpen(false)
        } catch (error) {
            console.error("Error exporting PDF:", error)
            toast.error("Failed to export PDF. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Export to PDF
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Export Flashcards to PDF</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Export Format</Label>
                            <RadioGroup
                                defaultValue={exportFormat}
                                onValueChange={(value) => setExportFormat(value as any)}
                                className="flex flex-col space-y-1"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="format-all" />
                                    <Label htmlFor="format-all">Full cards (questions and answers)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="qa" id="format-qa" />
                                    <Label htmlFor="format-qa">Questions and answers (separated)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="q" id="format-q" />
                                    <Label htmlFor="format-q">Questions only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="a" id="format-a" />
                                    <Label htmlFor="format-a">Answers only</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid gap-2">
                            <Label>Cards to Include</Label>
                            <RadioGroup
                                defaultValue={exportScope}
                                onValueChange={(value) => setExportScope(value as any)}
                                className="flex flex-col space-y-1"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="filtered" id="scope-filtered" />
                                    <Label htmlFor="scope-filtered">Current filtered cards ({filteredCards?.length || 0})</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="scope-all" />
                                    <Label htmlFor="scope-all">All cards ({flashcards.length})</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Sort By</Label>
                                <Select defaultValue={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sort by..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="category">Category</SelectItem>
                                        <SelectItem value="difficulty">Difficulty</SelectItem>
                                        <SelectItem value="mastery">Mastery Level</SelectItem>
                                        <SelectItem value="none">No Sorting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Page Size</Label>
                                <Select defaultValue={pageSize} onValueChange={(value) => setPageSize(value as any)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Page size..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="a4">A4</SelectItem>
                                        <SelectItem value="letter">Letter</SelectItem>
                                        <SelectItem value="legal">Legal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Page Orientation</Label>
                            <RadioGroup
                                defaultValue={orientation}
                                onValueChange={(value) => setOrientation(value as any)}
                                className="flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="portrait" id="orientation-portrait" />
                                    <Label htmlFor="orientation-portrait">Portrait</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="landscape" id="orientation-landscape" />
                                    <Label htmlFor="orientation-landscape">Landscape</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label>Additional Options</Label>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="include-metadata"
                                        checked={includeMetadata}
                                        onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                                    />
                                    <Label htmlFor="include-metadata">Include category, difficulty, and tags</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="include-mastery"
                                        checked={includeMastery}
                                        onCheckedChange={(checked) => setIncludeMastery(checked as boolean)}
                                    />
                                    <Label htmlFor="include-mastery">Include mastery levels</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            {isExporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export PDF
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
