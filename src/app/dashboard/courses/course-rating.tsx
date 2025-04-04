import { Star, StarHalf } from "lucide-react"
import { cn } from "@/lib/utils"

interface CourseRatingProps {
  rating?: number
  reviewCount?: number
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function CourseRating({ rating, reviewCount, size = "md", showText = true, className }: CourseRatingProps) {
  // If no rating is provided, return null or a placeholder
  if (!rating && rating !== 0) {
    return showText ? <span className="text-muted-foreground text-sm">No ratings yet</span> : null
  }

  // Calculate full and half stars
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  // Determine star size based on the size prop
  const starSize = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size]

  // Determine text size based on the size prop
  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size]

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex">
        {/* Render full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`star-${i}`} className={cn(starSize, "fill-primary text-primary")} />
        ))}

        {/* Render half star if needed */}
        {hasHalfStar && <StarHalf className={cn(starSize, "fill-primary text-primary")} />}

        {/* Render empty stars */}
        {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <Star key={`empty-star-${i}`} className={cn(starSize, "text-muted-foreground")} />
        ))}
      </div>

      {showText && (
        <span className={cn("text-muted-foreground", textSize)}>
          {rating.toFixed(1)} {reviewCount !== undefined && `(${reviewCount})`}
        </span>
      )}
    </div>
  )
}

