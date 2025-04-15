"use client"

import { SetStateAction, useEffect, useState } from "react"
import axios from "axios"
import {
    DollarSign,
    Users,
    Loader2,
    CheckCircle,
    XCircle,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    Search
} from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

const API_BASE_URL =  "https://medical-backend-loj4.onrender.com"

const AdminReferrals = () => {
    const [isLoading, setIsLoading] = useState(true)
    interface Referrer {
        _id: string | number;
        name: string;
        email: string;
        referredUsers?: { _id: string | number; name: string; email: string }[];
        commissions?: { _id: string | number; referredUserEmail: string; paymentDate: string; planType: string; commissionAmount: number; status: string }[];
        totalReferrals?: number;
        activeReferrals?: number;
        totalCommission?: number;
    }
    
    const [referrers, setReferrers] = useState<Referrer[]>([])
    const [topReferrers, setTopReferrers] = useState<Referrer[]>([])
    const [expandedReferrers, setExpandedReferrers] = useState<Record<string | number, boolean>>({})
    interface Commission {
        _id: string | number;
        referredUserEmail: string;
        paymentDate: string;
        planType: string;
        commissionAmount: number;
        status: string;
    }
    
    const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
    const [isProcessingOpen, setIsProcessingOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingNotes, setProcessingNotes] = useState("")
    const [alertMessage, setAlertMessage] = useState("")
    const [isAlertOpen, setIsAlertOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchReferrers()
        fetchTopReferrers()
    }, [])

    const fetchReferrers = async () => {
        try {
            setIsLoading(true)
            // We'll need to create a new API endpoint for this hierarchical data
            const response = await axios.get(`${API_BASE_URL}/api/referrals/admin/hierarchy?search=${searchQuery}`)
            setReferrers(response.data)
        } catch (error) {
            console.error("Error fetching referrers:", error)
            setAlertMessage("Failed to load referrer data. Please try again.")
            setIsAlertOpen(true)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchTopReferrers = async () => {
        try {
            // This should return referrers sorted by number of referrals
            const response = await axios.get(`${API_BASE_URL}/api/referrals/admin/top-referrers`)
            setTopReferrers(response.data)
        } catch (error) {
            console.error("Error fetching top referrers:", error)
            setAlertMessage("Failed to load top referrers. Please try again.")
            setIsAlertOpen(true)
        }
    }

    const toggleReferrerExpansion = (referrerId: string | number) => {
        setExpandedReferrers(prev => ({
            ...prev,
            [referrerId]: !prev[referrerId]
        }))
    }

    const handleProcessCommission = (commission: Commission) => {
        setSelectedCommission(commission)
        setProcessingNotes("")
        setIsProcessingOpen(true)
    }

    const submitProcessCommission = async (status: string) => {
        try {
            setIsProcessing(true)

            await axios.post(`${API_BASE_URL}/api/referrals/admin/process-commission`, {
                commissionId: selectedCommission ? selectedCommission._id : null,
                status,
                notes: processingNotes
            })

            setAlertMessage(`Commission successfully marked as ${status}.`)
            setIsAlertOpen(true)
            setIsProcessingOpen(false)

            // Refresh referrers list
            fetchReferrers()
        } catch (error) {
            console.error("Error processing commission:", error)
            setAlertMessage("Failed to process commission. Please try again.")
            setIsAlertOpen(true)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSearch = (e: { preventDefault: () => void }) => {
        e.preventDefault()
        fetchReferrers()
    }

    const formatCurrency = (amount: string | number | bigint) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(typeof amount === "string" ? parseFloat(amount) : amount)
    }

    const formatDate = (dateString: string | number | Date) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (isLoading && referrers.length === 0 && topReferrers.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading referral data...</span>
            </div>
        )
    }

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-6">Referral Program Administration</h1>

            {/* Top Referrers */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Top Referrers</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Total Referrals</TableHead>
                                <TableHead className="text-right">Active Referrals</TableHead>
                                <TableHead className="text-right">Total Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topReferrers.length > 0 ? (
                                topReferrers.map((referrer, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{referrer.name}</TableCell>
                                        <TableCell>{referrer.email}</TableCell>
                                        <TableCell className="text-right">{referrer.totalReferrals}</TableCell>
                                        <TableCell className="text-right">{referrer.activeReferrals}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(referrer.totalCommission ?? 0)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No referrers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Referrers and Their Referred Users */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Referrer Hierarchy</CardTitle>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by email or name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[250px]"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={fetchReferrers}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </form>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Referrals</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrers.length > 0 ? (
                                referrers.map((referrer) => (
                                    <>
                                        <TableRow key={referrer._id} className="bg-muted/10">
                                            <TableCell className="font-medium">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => toggleReferrerExpansion(referrer._id)}
                                                    className="p-0 h-auto"
                                                >
                                                    {expandedReferrers[referrer._id] ? 
                                                        <ChevronDown className="h-4 w-4 mr-2" /> : 
                                                        <ChevronRight className="h-4 w-4 mr-2" />
                                                    }
                                                    {referrer.name}
                                                </Button>
                                            </TableCell>
                                            <TableCell>{referrer.email}</TableCell>
                                            <TableCell className="text-right">{referrer.referredUsers?.length || 0}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(referrer.totalCommission || 0)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        
                                        {/* Referred Users (expandable) */}
                                        {expandedReferrers[referrer._id] && referrer.referredUsers && 
                                            referrer.referredUsers.map((user) => (
                                                <TableRow key={user._id} className="bg-muted/5">
                                                    <TableCell className="pl-10">
                                                        <span className="text-sm">{user.name || "Unknown"}</span>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{user.email}</TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            ))
                                        }
                                        
                                        {/* Commissions (expandable) */}
                                        {expandedReferrers[referrer._id] && referrer.commissions && 
                                            referrer.commissions.map((commission) => (
                                                <TableRow key={commission._id} className="border-l-2 border-primary/20">
                                                    <TableCell className="pl-10">
                                                        <span className="text-xs text-muted-foreground">
                                                            Payment from {commission.referredUserEmail || "Unknown"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {formatDate(commission.paymentDate)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {commission.planType}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {formatCurrency(commission.commissionAmount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={
                                                                    commission.status === "pending" ? "outline" :
                                                                    commission.status === "paid" ? "default" :
                                                                    "destructive"
                                                                }
                                                            >
                                                                {commission.status}
                                                            </Badge>
                                                            
                                                            {commission.status === "pending" && (
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    onClick={() => handleProcessCommission(commission)}
                                                                >
                                                                    Process
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        }
                                    </>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No referrers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Processing Dialog */}
            <Dialog open={isProcessingOpen} onOpenChange={setIsProcessingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Commission Payment</DialogTitle>
                        <DialogDescription>
                            Update the payment status for this commission.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCommission && (
                        <div className="space-y-4 my-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Referred User</p>
                                    <p>{selectedCommission.referredUserEmail}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Amount</p>
                                    <p className="text-xl font-bold">{formatCurrency(selectedCommission.commissionAmount)}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Payment Date</p>
                                <p>{formatDate(selectedCommission.paymentDate)}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Plan Type</p>
                                <p>{selectedCommission.planType}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-2">Admin Notes</p>
                                <Textarea
                                    placeholder="Add notes about this commission payment (optional)"
                                    value={processingNotes}
                                    onChange={(e) => setProcessingNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between space-x-2">
                        <Button
                            variant="destructive"
                            onClick={() => submitProcessCommission("cancelled")}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Cancel Commission
                        </Button>
                        <Button
                            onClick={() => submitProcessCommission("paid")}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Notification</AlertDialogTitle>
                        <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>Okay</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default AdminReferrals