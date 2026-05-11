import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ContentLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
