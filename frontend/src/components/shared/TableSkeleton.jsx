import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

const colClass = (col, cols) => {
  if (col === 0) return "w-14"
  if (col === cols - 1) return "w-14 rounded-full"
  if (col === 1) return "flex-1"
  if (col === 2 && cols >= 5) return "flex-1"
  return "w-20"
}

const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div>
    <div className="flex items-center gap-4 px-4 py-3 bg-muted border-b border-border">
      {Array.from({ length: cols }, (_, i) => (
        <Skeleton key={i} className={cn("h-3", colClass(i, cols))} />
      ))}
    </div>
    {Array.from({ length: rows }, (_, row) => (
      <div
        key={row}
        className="flex items-center gap-4 px-4 py-[18px] border-b border-border last:border-0"
        style={{ opacity: Math.max(0.2, 1 - row * 0.15) }}
      >
        {Array.from({ length: cols }, (_, col) => (
          <Skeleton key={col} className={cn("h-4", colClass(col, cols))} />
        ))}
      </div>
    ))}
  </div>
)

export const StatCardSkeleton = () => (
  <Card>
    <CardContent className="flex items-center gap-4 p-6">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-12" />
      </div>
    </CardContent>
  </Card>
)

export default TableSkeleton
