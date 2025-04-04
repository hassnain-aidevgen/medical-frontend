import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface MentorBadgeSetProps {
  rating: number
  expertise: string[]
  reviewCount?: number
}

export function MentorBadgeSet({ rating, expertise, reviewCount }: MentorBadgeSetProps) {
  return (
    <div className="space-y-3">
      {/* Rating display */}
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${star <= rating ? "text-primary fill-primary" : "text-muted-foreground"}`}
            />
          ))}
        </div>
        <span className="text-sm ml-2">
          {rating.toFixed(1)} {reviewCount !== undefined && `(${reviewCount} reviews)`}
        </span>
      </div>

      {/* Expertise tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {expertise.slice(0, 2).map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs">
            {skill}
          </Badge>
        ))}
        {expertise.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{expertise.length - 2} more
          </Badge>
        )}
      </div>
    </div>
  )
}

