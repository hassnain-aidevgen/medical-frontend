"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { Download, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

interface DifficultTopic {
  topic: string
  difficultyScore: number
  specialty?: string
}

interface Infographic {
  id: string
  topic: string
  imageUrl: string
  summary: string
  createdAt: string
}

const topicPlaceholderImages: Record<string, string> = {
  "Cardiovascular System": "https://placehold.co/600x400/e9f5fe/0369a1?text=Cardiovascular+System+Infographic",
  Neuroanatomy: "https://placehold.co/600x400/fdf2f8/be185d?text=Neuroanatomy+Infographic",
  Pharmacokinetics: "https://placehold.co/600x400/f0fdf4/166534?text=Pharmacokinetics+Infographic",
  "Acid-Base Balance": "https://placehold.co/600x400/fef3c7/92400e?text=Acid-Base+Balance+Infographic",
}

const defaultPlaceholder = "https://placehold.co/600x400/f5f5f5/666666?text=Medical+Infographic"

export function InfographicSuggestions() {
  const [difficultTopics, setDifficultTopics] = useState<DifficultTopic[]>([])
  const [infographics, setInfographics] = useState<Infographic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [generatingInfographic, setGeneratingInfographic] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  useEffect(() => {
    fetchWeakSubjects()
  }, [])

  const fetchWeakSubjects = async () => {
    try {
      setLoadingTopics(true)
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await axios.get(
        `http://localhost:5000/api/test/get-performance-all-weak/${userId}`
      )
      const weakAreas = response.data?.data?.weakAreas || []
      console.log("Fetched weak areas:", weakAreas)
  
      const topicsMap = new Map<string, DifficultTopic>()
  
      weakAreas.forEach((area: any) => {
        const key = `${area.subsectionName}-${area.subjectName}`
        if (!topicsMap.has(key)) {
          topicsMap.set(key, {
            topic: area.subsectionName,
            difficultyScore: 5,
            specialty: area.subjectName,
          })
        }
      })
  
      const uniqueTopics = Array.from(topicsMap.values())
      setDifficultTopics(uniqueTopics)
    } catch (error) {
      console.error("Error fetching weak subjects:", error)
      toast.error("Failed to load weak subjects")
    } finally {
      setLoadingTopics(false)
    }
  }
  
  const generateInfographic = async (topic: string) => {
    try {
      setGeneratingInfographic(topic)
      setSelectedTopic(topic)

      const mockInfographic: Infographic = {
        id: `inf-${Date.now()}`,
        topic,
        imageUrl: topicPlaceholderImages[topic] || defaultPlaceholder,
        summary: `Comprehensive visual guide to ${topic}, highlighting key concepts and common challenges.`,
        createdAt: new Date().toISOString(),
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))

      const userId = localStorage.getItem("Medical_User_Id")
      try {
        const response = await axios.post(
          `https://medical-backend-loj4.onrender.com/api/infographics/generate`,
          { userId, topic },
          { timeout: 2000 }
        )

        const newInfographic = response.data?.infographic || mockInfographic

        setInfographics((prev) => {
          const exists = prev.findIndex((i) => i.topic === topic)
          if (exists >= 0) {
            const updated = [...prev]
            updated[exists] = newInfographic
            return updated
          }
          return [...prev, newInfographic]
        })
      } catch {
        setInfographics((prev) => {
          const exists = prev.findIndex((i) => i.topic === topic)
          if (exists >= 0) {
            const updated = [...prev]
            updated[exists] = mockInfographic
            return updated
          }
          return [...prev, mockInfographic]
        })
      }

      toast.success(`Infographic for ${topic} generated successfully!`)
    } catch (error) {
      console.error("Error in generateInfographic:", error)
    } finally {
      setGeneratingInfographic(null)
    }
  }

  const downloadInfographic = (infographic: Infographic) => {
    fetch(infographic.imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = `${infographic.topic.replace(/\s+/g, "_")}_infographic.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      })
      .catch((error) => {
        console.error("Error downloading image:", error)
        toast.error("Failed to download image")
      })
  }

  if (loadingTopics) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-medium">Weak Subjects</h3>
        <p className="text-sm text-muted-foreground">
          Based on your test performance, these subjects are your weak areas. You can generate infographics to review and strengthen your understanding.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {difficultTopics.map((topic, index) => (
  <Card
    key={`${topic.topic}-${topic.specialty}-${index}`}
    className={selectedTopic === topic.topic ? "border-primary" : ""}
  >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{topic.topic}</CardTitle>
                <CardDescription>Difficulty: {topic.difficultyScore.toFixed(1)}/5</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-xs text-muted-foreground">{topic.specialty || "General Medicine"}</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => generateInfographic(topic.topic)}
                  disabled={generatingInfographic === topic.topic}
                >
                  {generatingInfographic === topic.topic ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Infographic"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {infographics.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium">Generated Infographics</h3>
          <div className="grid grid-cols-1 gap-6">
            {infographics.map((infographic) => (
              <Card key={infographic.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{infographic.topic}</CardTitle>
                  <CardDescription>Created on {new Date(infographic.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                    <img
                      src={infographic.imageUrl || defaultPlaceholder}
                      alt={`Infographic for ${infographic.topic}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{infographic.summary}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => downloadInfographic(infographic)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InfographicSuggestions
