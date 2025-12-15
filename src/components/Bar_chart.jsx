"use client"

import React, { useState } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const dataByYear = {
  2024: [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
  ],
  2025: [
    { month: "January", desktop: 210, mobile: 90 },
    { month: "February", desktop: 320, mobile: 180 },
    { month: "March", desktop: 250, mobile: 130 },
    { month: "April", desktop: 90, mobile: 200 },
    { month: "May", desktop: 220, mobile: 150 },
    { month: "June", desktop: 230, mobile: 160 },
        { month: "June", desktop: 230, mobile: 160 },

            { month: "June", desktop: 230, mobile: 160 },
            { month: "June", desktop: 230, mobile: 160 },
            { month: "June", desktop: 230, mobile: 160 },
            { month: "June", desktop: 230, mobile: 160 },
            { month: "June", desktop: 230, mobile: 160 },
            { month: "June", desktop: 230, mobile: 160 },

  ],
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
}

export function Component() {
  const [year, setYear] = useState(2024)

  // Get data based on selected year
  const chartData = dataByYear[year]

  return (
<div className="w-full lg:w-1/2">  
    <div className="mb-4">
        <label htmlFor="year-select" className="block mb-1 font-semibold">
          Select Year:
        </label>
        <select
          id="year-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded p-2"
        >
          {Object.keys(dataByYear).map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bar Chart - Multiple</CardTitle>
          <CardDescription>
            January - June {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData} width={500} height={300}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="desktop" fill="#3b82f6"  radius={4} />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
