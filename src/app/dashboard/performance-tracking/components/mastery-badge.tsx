import { Badge } from "@/components/ui/badge"
import { getMasteryColor, getMasteryIcon, type MasteryBadgeProps } from "../types"

export const MasteryBadge = ({ level }: MasteryBadgeProps) => {
  return (
    <Badge variant="outline" className={`${getMasteryColor(level)} flex items-center gap-1 px-2 py-1`}>
      {getMasteryIcon(level)}
      <span>{level}</span>
    </Badge>
  )
}
