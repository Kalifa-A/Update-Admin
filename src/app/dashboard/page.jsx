"use client"

import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Component } from "@/components/Bar_chart"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"




import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ProtectedRoute from "@/components/ProtectedRoute"

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
]

















export default function Page() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [range, setRange] = useState("today"); // ✅ default range



  
 function TableDemo() {
  return (
    <div className="w-full md:w-1/2 mx-auto ">
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dashboardStats?.bestSelling.map((each) => (
            <TableRow >
              <TableCell>{each.name?.slice(0,20)}</TableCell>
              <TableCell>{each.category}</TableCell>
              <TableCell className="text-right">{each.brand}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}





  useEffect(() => {
    const eventSource = new EventSource("https://thajanwar.onrender.com/dashboard/stream");

    eventSource.addEventListener("dashboard_stats", (e) => {
      const stats = JSON.parse(e.data);
      console.log("📊 Live Dashboard Stats:", stats);
      setDashboardStats(stats);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Pick the stats for the currently selected range
  const currentStats = dashboardStats ? dashboardStats[range] : null;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* ✅ Range Selector */}
              <div className="px-4">
                <label className="mr-2 text-sm font-medium">Select Range:</label>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="allTime">All Time</option>
                </select>
              </div>

              {/* ✅ Pass only currentStats instead of full dashboardStats */}
              <SectionCards stats={currentStats} />

              <div className="px-4 lg:px-6 flex flex-col lg:flex-row gap-6 items-center">
                <Component stats={currentStats} />
                <TableDemo stats={currentStats} />
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  );
}
