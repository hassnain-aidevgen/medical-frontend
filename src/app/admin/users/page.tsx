"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from "axios"
import { Edit2, Plus, Search, Trash2, UserCheck, UserX } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/auth"

type User = {
    _id: string
    name: string
    email: string
    isVerified: boolean
    role: string
}

type UserFormData = {
    name: string
    email: string
    password?: string
    role: string
}

const ROLES = ["user", "admin", "moderator"]

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState<UserFormData>({
        name: "",
        email: "",
        password: "",
        role: "user",
    })

    const fetchUsers = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users`)
            setUsers(response.data)
        } catch (error) {
            console.error("Error fetching users:", error)
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to load users.: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to load users. Please try again ${(error as Error).message}`)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingUser) {
                // Update user
                const { password } = formData
                if (!password) delete formData.password // Only include password if it's being changed

                await axios.put(`${API_BASE_URL}/users/${editingUser._id}`, formData)
                setUsers((prev) =>
                    prev.map((user) =>
                        user._id === editingUser._id
                            ? { ...user, name: formData.name, email: formData.email, role: formData.role }
                            : user,
                    ),
                )

                toast.success("User updated successfully")
            } else {
                // Create user
                const response = await axios.post(`${API_BASE_URL}/users`, formData)
                setUsers((prev) => [...prev, response.data])
                toast.success("User created successfully")
            }
            setIsDialogOpen(false)
            resetForm()
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(`${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`${(error as Error).message}`)
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return

        try {
            await axios.delete(`${API_BASE_URL}/users/${id}`)
            setUsers((prev) => prev.filter((user) => user._id !== id))
            toast.success("User deleted successfully")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to delete user: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to delete user ${(error as Error).message}`)
            }
        }
    }

    const toggleVerification = async (user: User) => {
        try {
            await axios.put(`${API_BASE_URL}/users/${user._id}/verify`, {
                isVerified: !user.isVerified,
            })
            setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isVerified: !u.isVerified } : u)))
            toast.success(`User ${user.isVerified ? "unverified" : "verified"} successfully`)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to update verification status: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to update verification status ${(error as Error).message}`)
            }
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "user",
        })
        setEditingUser(null)
    }

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (loading) {
        return (
            <div className="container py-6 space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    return (
        <div className="container py-6 space-y-6">
            <Toaster position="top-right" />
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Manage Users</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                resetForm()
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
                            <DialogDescription>
                                {editingUser ? "Update the user details below." : "Enter the details for the new user below."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password {editingUser && "(leave blank to keep unchanged)"}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                                        placeholder="Enter password"
                                        required={!editingUser}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">{editingUser ? "Update" : "Create"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell className="capitalize">{user.role}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant={user.isVerified ? "default" : "secondary"}
                                                    size="sm"
                                                    onClick={() => toggleVerification(user)}
                                                >
                                                    {user.isVerified ? (
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                    ) : (
                                                        <UserX className="h-4 w-4 mr-2" />
                                                    )}
                                                    {user.isVerified ? "Verified" : "Unverified"}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingUser(user)
                                                            setFormData({
                                                                name: user.name,
                                                                email: user.email,
                                                                password: "",
                                                                role: user.role,
                                                            })
                                                            setIsDialogOpen(true)
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(user._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

