"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from "axios"
import { motion } from "framer-motion"
import { BookOpen, Brain, FileText, Info, Lightbulb, Sparkles, Star } from 'lucide-react'
import { useEffect, useState } from "react"

interface Question {
  questionId: string
  questionText: string
  userAnswer: string
  correctAnswer: string
  timeSpent: number
}

interface TestResult {
  userId: string
  questions: Question[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
}

interface Flashcard {
  _id: string
  question: string
  answer: string
  hint: string
  category: string
  difficulty: string
  mastery: number
}

interface FlashcardSuggestionsProps {
  performanceData: TestResult[]
  isLoading?: boolean
  className?: string
}

export default function FlashcardSuggestions({
  performanceData,
  isLoading: initialLoading = false,
  className = "",
}: FlashcardSuggestionsProps) {
  const [activeTab, setActiveTab] = useState("flashcards")
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [flashcardsByCategory, setFlashcardsByCategory] = useState<Record<string, Flashcard[]>>({})
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({})

  // Fetch all available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://medical-backend-loj4.onrender.com/api/flashcard-topics');
        setAvailableCategories(response.data);
      } catch (error) {
        console.error("Error fetching flashcard categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch flashcards for all available categories
  useEffect(() => {
    const fetchAllFlashcards = async () => {
      setIsLoading(true);
      
      // Fetch flashcards for each category
      const promises = availableCategories.map(category => fetchFlashcardsForCategory(category));
      
      await Promise.all(promises);
      setIsLoading(false);
    };
    
    if (availableCategories.length > 0) {
      fetchAllFlashcards();
    }
  }, [availableCategories]);

  // Fetch flashcards for a specific category
  const fetchFlashcardsForCategory = async (category: string) => {
    if (flashcardsByCategory[category] || loadingCategories[category]) return;
    
    setLoadingCategories(prev => ({ ...prev, [category]: true }));
    
    try {
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/flashcards-by-topic/${category}`, {
        params: { limit: 8 } // Get up to 8 flashcards per category
      });
      
      setFlashcardsByCategory(prev => ({
        ...prev,
        [category]: response.data
      }));
    } catch (error) {
      console.error(`Error fetching flashcards for category ${category}:`, error);
    } finally {
      setLoadingCategories(prev => ({ ...prev, [category]: false }));
    }
  };

  // Get related concepts for a category from flashcard hints
  const getRelatedConceptsForCategory = (category: string): string[] => {
    const flashcards = flashcardsByCategory[category] || [];
    
    // Extract concepts from flashcard hints
    const concepts = new Set<string>();
    
    // Use hints as concepts if available
    flashcards.forEach(flashcard => {
      if (flashcard.hint) {
        concepts.add(flashcard.hint);
      }
    });
    
    // If we don't have enough concepts, add some from the questions
    if (concepts.size < 5) {
      flashcards.forEach(flashcard => {
        // Extract meaningful phrases from questions
        const phrases = flashcard.question
          .split(/[.,;:]/)
          .map(phrase => phrase.trim())
          .filter(phrase => phrase.length > 10 && phrase.length < 40);
        
        phrases.forEach(phrase => {
          if (concepts.size < 5) {
            concepts.add(phrase);
          }
        });
      });
    }
    
    return Array.from(concepts).slice(0, 5);
  };

  // Calculate the number of missed questions for each category based on flashcard categories
  const calculateCategoryMissedCounts = () => {
    // Default to 0 for all categories
    const counts: Record<string, number> = {};
    availableCategories.forEach(category => {
      counts[category] = 0;
    });
    
    // For simplicity, just evenly distribute missed questions among available categories
    // In a real implementation, you would analyze the question content to match with categories
    let totalIncorrect = 0;
    
    performanceData.forEach(test => {
      test.questions.forEach(question => {
        if (question.userAnswer !== question.correctAnswer) {
          totalIncorrect++;
        }
      });
    });
    
    // Distribute incorrect count among categories
    if (totalIncorrect > 0 && availableCategories.length > 0) {
      const baseCount = Math.floor(totalIncorrect / availableCategories.length);
      const remainder = totalIncorrect % availableCategories.length;
      
      availableCategories.forEach((category, index) => {
        counts[category] = baseCount + (index < remainder ? 1 : 0);
      });
    }
    
    return counts;
  };

  const categoryMissedCounts = calculateCategoryMissedCounts();
  
  // Sort categories by number of missed questions
  const sortedCategories = availableCategories
    .filter(category => categoryMissedCounts[category] > 0)
    .sort((a, b) => categoryMissedCounts[b] - categoryMissedCounts[a]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Flashcard & Review Suggestions</CardTitle>
          <CardDescription>Loading your personalized study materials...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sortedCategories.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Flashcard & Review Suggestions</CardTitle>
          <CardDescription>We&apos;ll generate personalized study materials based on your test results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No study materials available yet</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Take more tests to receive personalized flashcard and review material suggestions based on your performance
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Flashcard & Review Suggestions
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <p>
                        Focus on these topics to improve your understanding of key medical concepts.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Study materials for your medical education journey
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flashcards" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flashcards">
                <Brain className="h-4 w-4 mr-2" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="resources">
                <BookOpen className="h-4 w-4 mr-2" />
                Review Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flashcards" className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Top Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {sortedCategories.slice(0, 5).map((category, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary flex items-center gap-1"
                    >
                      <span className="capitalize">{category}</span>
                      <span className="bg-primary/20 rounded-full px-1.5 py-0.5 text-xs">
                        {categoryMissedCounts[category]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {sortedCategories.map((category, catIndex) => {
                    const flashcardsForCategory = flashcardsByCategory[category] || [];
                    const isLoadingCategory = loadingCategories[category] || false;
                    
                    return (
                      <motion.div
                        key={catIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: catIndex * 0.1 }}
                      >
                        <h3 className="font-medium text-lg mb-2 capitalize">{category} Flashcards</h3>
                        
                        {isLoadingCategory ? (
                          <div className="flex items-center justify-center h-[100px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : flashcardsForCategory.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {flashcardsForCategory.slice(0, 4).map((flashcard, fIndex) => (
                              <div
                                key={fIndex}
                                className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-hidden"
                              >
                                <div className="p-4 border-b bg-blue-50 dark:bg-blue-900/20">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-muted-foreground">Front</span>
                                    <Star className="h-3 w-3 text-yellow-500" />
                                  </div>
                                  <p className="font-medium">{flashcard.question}</p>
                                </div>
                                <div className="p-4">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-muted-foreground">Back</span>
                                  </div>
                                  <p className="text-sm">{flashcard.answer}</p>
                                  {flashcard.hint && (
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                      Hint: {flashcard.hint}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-muted/30 p-4 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">
                              No flashcards available for this category. We&apos;re working on adding more content!
                            </p>
                          </div>
                        )}
                        
                        {flashcardsForCategory.length > 4 && (
                          <div className="mt-2 text-center">
                            <Button variant="ghost" size="sm">
                              View all {flashcardsForCategory.length} {category} flashcards
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex justify-end">
                <Button>
                  Export All Flashcards
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {sortedCategories.map((category, catIndex) => {
                    const relatedConcepts = getRelatedConceptsForCategory(category);
                    
                    return (
                      <motion.div
                        key={catIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: catIndex * 0.1 }}
                        className="bg-white dark:bg-gray-800 border rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg capitalize">{category}</h3>
                            <p className="text-sm text-muted-foreground">
                              {categoryMissedCounts[category]} questions in this category
                            </p>
                          </div>
                        </div>

                        <div className="ml-10 space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Key Concepts to Review</h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {relatedConcepts.map((concept, cIndex) => (
                                <li key={cIndex} className="flex items-center gap-2">
                                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                    <Brain className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="text-sm">{concept}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Recommended Resources</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium capitalize">{category} Study Guide</span>
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full ml-auto">
                                  PDF
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium capitalize">{category} Chapter Review</span>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full ml-auto">
                                  Article
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium capitalize">Practice Questions: {category}</span>
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full ml-auto">
                                  Quiz
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button variant="outline" size="sm">
                              View All Resources
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}