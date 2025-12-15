import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Skeleton component (exported so other components can reuse it)
 * Props:
 *  - height (Tailwind class, e.g. "h-4")
 *  - width  (Tailwind class, e.g. "w-32")
 *  - shimmer (boolean) use shimmer animation or pulse
 *  - className (extra classes)
 */
export function Skeleton({ height = "h-4", width = "w-full", shimmer = true, className = "" }) {
  const base = `rounded-md bg-muted ${height} ${width} ${className}`

  if (!shimmer) {
    return <div className={`animate-pulse ${base}`} />
  }

  return (
    <div className={`relative overflow-hidden ${base}`}>
      <div className="absolute inset-0 bg-muted" />
      <div
        className="absolute inset-y-0 left-0 w-1/2 transform -translate-x-full animate-shimmer"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
        }}
      />
    </div>
  )
}

/**
 * Named export SectionCards (so `import { SectionCards } from "@/components/section-cards"` works)
 *
 * Props:
 *  - stats: object (or falsy while loading)
 *  - shimmer: boolean (defaults true)
 *  - skeletonCount: number (how many placeholder cards to show)
 */
export function SectionCards({ stats, shimmer = true, skeletonCount = 4 }) {
  // Loading placeholders
  if (!stats) {
    const placeholders = Array.from({ length: skeletonCount })
  // console.log(stats)
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {placeholders.map((_, i) => (
          <Card key={i} className="@container/card p-4">
            <CardHeader className="space-y-3">
              <Skeleton shimmer={shimmer} height="h-4" width="w-24" />
              <Skeleton shimmer={shimmer} height="h-8" width="w-32" />
              <div className="flex items-center gap-2">
                <Skeleton shimmer={shimmer} height="h-6" width="w-16" className="rounded-full" />
                <Skeleton shimmer={shimmer} height="h-6" width="w-10" className="rounded-full" />
              </div>
            </CardHeader>

            <CardFooter className="flex-col items-start gap-1.5 text-sm mt-4">
              <div className="flex gap-2 font-medium">
                <Skeleton shimmer={shimmer} height="h-4" width="w-28" />
                <Skeleton shimmer={shimmer} height="h-4" width="w-6" className="rounded-full" />
              </div>
              <div className="text-muted-foreground">
                <Skeleton shimmer={shimmer} height="h-3" width="w-full" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // Map stats -> card data
  const cardData = Object.entries(stats).map(([key, value]) => {
    let title = key
      .replace("total", "")
      .replace(/([A-Z])/g, " $1")
      .trim()

    const numericValue =
      typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0

    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      value:
        key.toLowerCase().includes("sales") || key.toLowerCase().includes("profit") ? `$${value}` : value,
      trend: numericValue > 0 ? "+10%" : "-5%",
      trendIcon: numericValue > 0 ? <IconTrendingUp /> : <IconTrendingDown />,
      footerTrend: numericValue > 0 ? "Trending up" : "Trending down",
      footerIcon: numericValue > 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />,
      footer: `Latest ${title.toLowerCase()} data`,
    }
  })

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cardData.map((card, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.trendIcon}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>

          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              {card.footerTrend} {card.footerIcon}
            </div>
            <div className="text-muted-foreground">{card.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
