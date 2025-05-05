"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface ProgressData {
  totalScheduled: number
  totalCompleted: number
  reviewLaterCount: number
  progressPercentage: number
}

export function ReviewProgressMeter() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [triggerRefresh, setTriggerRefresh] = useState(0)

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "review_later_update_trigger") {
        // Trigger a refresh when localStorage changes
        setTriggerRefresh(prev => prev + 1);
      }
    };

    // For same-tab updates
    const checkLocalStorage = () => {
      const updateCount = localStorage.getItem("review_later_update_trigger");
      if (updateCount && updateCount !== lastUpdateCount.current) {
        lastUpdateCount.current = updateCount;
        setTriggerRefresh(prev => prev + 1);
      }
    };
    
    const lastUpdateCount = { current: localStorage.getItem("review_later_update_trigger") };
    const interval = setInterval(checkLocalStorage, 1000);
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch data from API and localStorage
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true)
        setError(null)
    
        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          setError("User ID not found")
          setLoading(false)
          return
        }
    
        // Get review later count from localStorage if available, otherwise from API
        let reviewLaterCount = 0;
        const storedCount = localStorage.getItem("review_later_count");
        
        if (storedCount && !isNaN(parseInt(storedCount, 10))) {
          reviewLaterCount = parseInt(storedCount, 10);
        } else {
          // Fallback to API call
          const reviewLaterResponse = await fetch(`http://localhost:5000/api/reviews/review-later-count?userId=${userId}`);
          const reviewLaterData = await reviewLaterResponse.json();
          reviewLaterCount = reviewLaterData.reviewLaterCount || 0;
          
          // Update localStorage with the latest count
          localStorage.setItem("review_later_count", reviewLaterCount.toString());
        }
    
        // Also get the completed reviews count
        const completedResponse = await fetch(`http://localhost:5000/api/reviews/completed-count?userId=${userId}`);
        const completedData = await completedResponse.json();
        const totalCompleted = completedData.completedReviews || 0;
        
        // Calculate total as completed + pending review
        const totalScheduled = totalCompleted + reviewLaterCount;
        
        // Calculate progress percentage
        const progressPercentage = totalScheduled > 0 
          ? Math.round((totalCompleted / totalScheduled) * 100) 
          : 0;
    
        setProgressData({
          totalScheduled,
          totalCompleted,
          reviewLaterCount,
          progressPercentage,
        });
    
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch progress data:", error);
        setError("Failed to load progress data");
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [triggerRefresh]);  // Re-fetch when triggerRefresh changes

  // The rest of your component remains the same
  const calculateDonutValues = (percentage: number) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    return {
      circumference,
      offset: circumference - (percentage / 100) * circumference,
    };
  };

  const renderDonutChart = () => {
    if (!progressData) return null;

    const { circumference, offset } = calculateDonutValues(progressData.progressPercentage);

    return (
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="60" cy="60" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold">{progressData.progressPercentage}%</span>
          <span className="text-xs text-muted-foreground">Reviewed</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Progress</CardTitle>
          <CardDescription>Track your overall review progress</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Progress</CardTitle>
          <CardDescription>Track your overall review progress</CardDescription>
        </CardHeader>
        <CardContent className="py-2">
          <div className="text-center text-sm text-muted-foreground">
            <p>Unable to load progress data</p>
            <button onClick={() => setTriggerRefresh(prev => prev + 1)} className="text-primary underline mt-1">
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Progress</CardTitle>
        <CardDescription>Track how much of your scheduled content you&apos;ve reviewed</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-between">
        {renderDonutChart()}
        <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
          <h3 className="text-lg font-medium mb-2">Your Progress</h3>
          <p className="text-sm text-muted-foreground mb-1">
            You&apos;ve reviewed <span className="font-medium">{progressData?.progressPercentage}%</span> of your total
            scheduled content.
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{progressData?.totalCompleted}</span> of{" "}
            <span className="font-medium">{progressData?.totalScheduled}</span> items completed
            {progressData && progressData.reviewLaterCount !== undefined && progressData.reviewLaterCount > 0 && (
              <> + <span className="font-medium text-amber-500">{progressData.reviewLaterCount}</span> waiting for review</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReviewProgressMeter;