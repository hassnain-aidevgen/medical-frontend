"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast, Toaster } from "react-hot-toast"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"


interface ExamType {
  _id: string
  name: string
}

// Update the form schema to support multiple videos
const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  instructor: z.string().min(2, {
    message: "Instructor name is required.",
  }),
  instructorBio: z.string().optional(),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  duration: z.string().min(2, {
    message: "Duration is required (e.g., '8 weeks').",
  }),
  level: z.string({
    required_error: "Please select a level.",
  }),
  featured: z.boolean().default(false),
  source: z.string({
    required_error: "Please select a source.",
  }),
  examType: z.string().optional(),
  thumbnail: z.any().optional(),
  videoUrl: z
    .string()
    .url({
      message: "Please enter a valid video URL.",
    })
    .optional(),
  videos: z
    .array(
      z.object({
        title: z.string().min(1, "Video title is required"),
        url: z.string().url("Please enter a valid video URL"),
        description: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  objectives: z.array(z.string()).min(1, {
    message: "Add at least one learning objective.",
  }),
  prerequisites: z.array(z.string()).optional(),
})

export default function CreateCoursePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newObjective, setNewObjective] = useState("")
  const [newPrerequisite, setNewPrerequisite] = useState("")
  const [newVideoTitle, setNewVideoTitle] = useState("")
  const [newVideoUrl, setNewVideoUrl] = useState("")
  const [newVideoDescription, setNewVideoDescription] = useState("")
  // Add state for exam types
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [isLoadingExamTypes, setIsLoadingExamTypes] = useState(false)

  // Add hasMounted state to prevent hydration errors
  const [hasMounted, setHasMounted] = useState(false)

  // Add state for managing videos
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      instructor: "",
      instructorBio: "",
      price: 0,
      duration: "",
      featured: false,
      examType: "", 
      objectives: [],
      prerequisites: [],
      videos: [],
    },
  })

  const { watch, setValue } = form
  const objectives = watch("objectives") || []
  const prerequisites = watch("prerequisites") || []
  const videos = watch("videos") || []

    // Set hasMounted to true after component mounts
    useEffect(() => {
      setHasMounted(true)
    }, [])
  
    // Fetch exam types after component mounts
    useEffect(() => {
      // Skip if not mounted yet to prevent hydration errors
      if (!hasMounted) return
    
      const fetchExamTypes = async () => {
        setIsLoadingExamTypes(true)
        try {
          let token = null
          
          // Move localStorage access inside a try/catch and only run client-side
          if (typeof window !== 'undefined') {
            try {
              token = localStorage.getItem("token")
            } catch (error) {
              console.error("Error accessing localStorage:", error)
            }
          }
    
          if (!token) {
            // Handle silently without redirect to prevent hydration errors
            console.error("Authentication token not found")
            setIsLoadingExamTypes(false)
            return
          }
    
          // Updated API call with better error handling
          try {
            console.log("Fetching exam types from API...")
            
            // Set proper API URL - could be moved to environment variable
            const apiUrl = "http://localhost:5000/api/courses/examtypes"
            console.log(`API URL: ${apiUrl}`)
            
            const response = await axios.get(apiUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
    
            console.log("API Response:", response.data)
    
            if (response.data && response.data.success) {
              setExamTypes(response.data.data || [])
            } else {
              console.error("Failed to fetch exam types:", response.data?.error || "Unknown error")
              // Show toast only after component is fully mounted
              if (hasMounted) {
                toast.error("Could not load exam types")
              }
            }
          } catch (error) {
            console.error("Error fetching exam types:", error)
            
            // Detailed error logging
            if (axios.isAxiosError(error)) {
              console.error("API Error Status:", error.response?.status)
              console.error("API Error Data:", error.response?.data)
              
              // Show toast error only after component is fully mounted
              if (hasMounted) {
                if (error.response?.status === 404) {
                  toast.error("Exam types API endpoint not found. Please contact support.")
                } else {
                  toast.error(`Error loading exam types: ${error.message}`)
                }
              }
            }
          }
        } finally {
          setIsLoadingExamTypes(false)
        }
      }
    
      fetchExamTypes()
    }, [hasMounted])
  


  const addObjective = () => {
    if (newObjective.trim()) {
      setValue("objectives", [...objectives, newObjective.trim()])
      setNewObjective("")
    }
  }

  const removeObjective = (index: number) => {
    setValue(
      "objectives",
      objectives?.filter((_, i) => i !== index),
    )
  }

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setValue("prerequisites", [...prerequisites, newPrerequisite.trim()])
      setNewPrerequisite("")
    }
  }

  const removePrerequisite = (index: number) => {
    setValue(
      "prerequisites",
      prerequisites?.filter((_, i) => i !== index),
    )
  }

  const addVideo = () => {
    if (newVideoUrl.trim() && newVideoTitle.trim()) {
      setValue("videos", [
        ...videos,
        {
          title: newVideoTitle.trim(),
          url: newVideoUrl.trim(),
          description: newVideoDescription.trim(),
        },
      ])
      setNewVideoTitle("")
      setNewVideoUrl("")
      setNewVideoDescription("")
    } else {
      toast.error("Video title and URL are required")
    }
  }

  const removeVideo = (index: number) => {
    setValue(
      "videos",
      videos.filter((_, i) => i !== index)
    )
  }

  // Update the onSubmit function to handle the videos array
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Validate critical fields before submission
      if (!values.title || !values.description || !values.category) {
        toast.error("Please fill in all required fields")
        return
      }

      // Log the values being processed
      console.log("Form values before processing:", values)

      // Create a regular JavaScript object instead of FormData
      // This is because your backend is using express-fileupload which handles files differently
      // const courseData: Record<string, string | number | boolean | string[] | object[]> = {}
      const courseData: Record<string, any> = {}

      // Add all form fields to the object
      Object.entries(values).forEach(([key, value]) => {
        // Skip the thumbnail as it will be handled separately
        if (key === "thumbnail") {
          return
        }

        // Handle arrays and objects
        if (Array.isArray(value) || typeof value === 'object') {
          courseData[key] = value
        }
        // Handle other values
        else if (value !== undefined && value !== null) {
          courseData[key] = value
        }
      })

      console.log("Course data prepared:", courseData)

      let token = null
      try {
        token = localStorage.getItem("token")
      } catch (error) {
        console.error("Error accessing localStorage:", error)
      }
      if (!token) {
        toast.error("Authentication token not found. Please log in again.")
        router.push("/login")
        return
      }

      // Handle file upload if there is a thumbnail
      let formData: FormData | null = null
      if (values.thumbnail && values.thumbnail.length > 0) {
        formData = new FormData()

        // Add the file to FormData
        formData.append("thumbnail", values.thumbnail[0])

        // Also add all other fields to FormData
        Object.entries(courseData).forEach(([key, value]) => {
          if (Array.isArray(value) || typeof value === 'object') {
            // Handle arrays and objects by stringifying them
            if (formData) {
              formData.append(key, JSON.stringify(value))
            }
          } else {
            if (formData) {
              formData.append(key, String(value))
            }
          }
        })

        console.log("Using FormData with file upload", values.thumbnail[0].name)
      }

      console.log("Sending request to API...")

      // Choose the appropriate request method based on whether we have a file
      let response
      if (formData) {
        // If we have a file, use FormData
        response = await axios.post("https://medical-backend-loj4.onrender.com/api/courses", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type when using FormData - axios will set it with the boundary
          },
          timeout: 30000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
            console.log(`Upload progress: ${percentCompleted}%`)
          },
        })
      } else {
        // If no file, use regular JSON
        response = await axios.post("https://medical-backend-loj4.onrender.com/api/courses", courseData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        })
      }

      console.log("API Response:", response.data)

      if (response.data.success) {
        toast.success("Course created successfully")
        router.push("/admin/courses")
      } else {
        toast.error(response.data.error || "Failed to create course")
      }
    } catch (error) {
      console.error("Error creating course:", error)

      // Enhanced error handling with specific error messages
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status
        const errorMessage = error.response?.data?.error || error.message

        console.error(`API Error (${statusCode}):`, errorMessage)

        if (statusCode === 401) {
          toast.error("Your session has expired. Please log in again.")
          router.push("/login")
        } else if (statusCode === 413) {
          toast.error("The file you're uploading is too large.")
        } else if (statusCode === 400) {
          toast.error(`Validation error: ${errorMessage}`)
        } else if (statusCode === 500) {
          toast.error("Server error. Please try again later.")
        } else {
          toast.error(`Error: ${errorMessage}`)
        }
      } else {
        toast.error("Failed to connect to the server. Please check your internet connection.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (typeof window === 'undefined') {
    return null; // Return null during SSR
  }

  // Show loading state if mounted but still loading
  if (!hasMounted) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create Course</h2>
            <p className="text-muted-foreground">Add a new course to the platform</p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-center p-8">
          <p>Loading form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Course</h2>
          <p className="text-muted-foreground">Add a new course to the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/courses">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Course title" {...field} />
                    </FormControl>
                    <FormDescription>The title of your course.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Course description" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormDescription>Detailed description of what the course covers.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Data Science">Data Science</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               {/* Add Exam Type Field */}
               <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Exam</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target exam" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingExamTypes ? (
                          <SelectItem value="loading" disabled>
                            Loading exam types...
                          </SelectItem>
                        ) : examTypes.length > 0 ? (
                          examTypes.map((examType) => (
                            <SelectItem key={examType._id} value={examType._id}>
                              {examType.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No exam types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>The target exam this course prepares students for.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 8 weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="udemy">Udemy</SelectItem>
                        <SelectItem value="coursera">Coursera</SelectItem>
                        <SelectItem value="edx">edX</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Where the course is hosted.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Course</FormLabel>
                      <FormDescription>This course will be displayed on the homepage.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="instructor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor</FormLabel>
                    <FormControl>
                      <Input placeholder="Instructor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructorBio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Instructor biography" className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormDescription>Brief biography of the instructor.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files?.length) {
                            onChange(files)
                            console.log("File selected:", files[0].name)
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Upload a thumbnail image for the course.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="videos"
                    render={() => (
                      <FormItem>
                        <FormLabel>Course Videos</FormLabel>
                        <div className="space-y-4 mt-2">
                          <div className="grid gap-4">
                            <div>
                              <Label htmlFor="videoTitle">Video Title</Label>
                              <Input
                                id="videoTitle"
                                placeholder="Enter video title"
                                value={newVideoTitle}
                                onChange={(e) => setNewVideoTitle(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="videoUrl">Video URL</Label>
                              <Input
                                id="videoUrl"
                                placeholder="Enter video URL"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="videoDescription">Description (Optional)</Label>
                              <Textarea
                                id="videoDescription"
                                placeholder="Enter video description"
                                value={newVideoDescription}
                                onChange={(e) => setNewVideoDescription(e.target.value)}
                                rows={2}
                              />
                            </div>
                            <Button type="button" onClick={addVideo} className="w-full">
                              Add Video
                            </Button>
                          </div>

                          {videos.length > 0 && (
                            <div className="space-y-2 mt-4">
                              <h4 className="text-sm font-medium">Added Videos:</h4>
                              <div className="space-y-3">
                                {videos.map((video, index) => (
                                  <div key={index} className="flex items-start justify-between border rounded-md p-3">
                                    <div className="space-y-1">
                                      <p className="font-medium">{video.title}</p>
                                      <p className="text-xs text-muted-foreground break-all">{video.url}</p>
                                      {video.description && (
                                        <p className="text-xs text-muted-foreground">{video.description}</p>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeVideo(index)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Remove</span>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <FormDescription>Add videos for this course. You can add multiple videos.</FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )} />
                    
                </CardContent>
              </Card>

                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                    name="objectives"
                    render={() => (
                      <FormItem>
                        <FormLabel>Learning Objectives</FormLabel>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Add a learning objective"
                            value={newObjective}
                            onChange={(e) => setNewObjective(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addObjective()
                              }
                            }}
                          />
                          <Button type="button" onClick={addObjective} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {objectives.map((objective, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {objective}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => removeObjective(index)}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <FormDescription className="mt-2">What students will learn from this course.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="prerequisites"
                    render={() => (
                      <FormItem>
                        <FormLabel>Prerequisites (Optional)</FormLabel>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Add a prerequisite"
                            value={newPrerequisite}
                            onChange={(e) => setNewPrerequisite(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addPrerequisite()
                              }
                            }}
                          />
                          <Button type="button" onClick={addPrerequisite} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {prerequisites.map((prerequisite, index) => (
                            <Badge key={index} variant="outline" className="gap-1">
                              {prerequisite}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => removePrerequisite(index)}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <FormDescription className="mt-2">
                          Knowledge or skills required before taking this course.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/courses")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => {
                if (!form.formState.isValid) {
                  form.trigger()
                  console.log("Form validation errors:", form.formState.errors)
                }
              }}
            >
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </div>
          {/* {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-md">
              <h3 className="text-sm font-medium mb-2">Debug Information</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Form Valid: {form.formState.isValid ? "Yes" : "No"}</p>
                <p>Dirty Fields: {Object.keys(form.formState.dirtyFields).join(", ")}</p>
                <p>Submission Count: {form.formState.submitCount}</p>
                {Object.keys(form.formState.errors).length > 0 && (
                  <div>
                    <p className="font-medium">Errors:</p>
                    <pre className="mt-1 bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(form.formState.errors, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )} */}
        </form>
      </Form>
      <Toaster position="top-right" />
    </div>
  )
}
