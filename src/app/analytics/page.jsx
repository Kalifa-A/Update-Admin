"use client";
import React, { useEffect, useState, useMemo } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { ChartAreaInteractive } from "@/components/area-chart";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Small utility for currency formatting
function formatCurrency(n) {
  return n?.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) || "-";
}

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444"];

// Placeholder/demo datasets (replace from API)
const demoKpis = { revenue: 12540, orders: 342, aov: 36.7, newCustomers: 58 };
const demoPie = [ { name: "Active", value: 680 }, { name: "Inactive", value: 220 } ];

export default function Page() {
  const [activeTab, setActiveTab] = useState("customers");
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [kpis, setKpis] = useState(demoKpis);
  const [pieData, setPieData] = useState(demoPie);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [granularity, setGranularity] = useState("7d");
  const [productSales, setProductSales] = useState([]);
 const [locationOrders, setLocationOrders] = useState([]);
 
useEffect(() => {
  const fetchData = async () => {
    try {
      /* ---------- CUSTOMERS ---------- */
      const u = await fetch("https://thajanwar.onrender.com/users/");
      if (u.ok) {
        const data = await u.json();
        setCustomers(Array.isArray(data) ? data : []);
      }

      /* ---------- ANALYTICS ---------- */
      const a = await fetch("https://thajanwar.onrender.com/api/analytics/" ,
        { method: 'GET', credentials: 'include' }
      );

      if (a.ok) {
        const res = await a.json();
        const analytics = res?.data || {};
        
        console.log("Fetched analytics:", analytics);
        // KPI calculation from analytics
        const totalRevenue = analytics.productSales?.reduce(
          (sum, p) => sum + Number(p.revenue || 0),
          0
        );

        const totalOrders = analytics.locationOrders?.reduce(
          (sum, l) => sum + Number(l.orders || 0),
          0
        );

        const totalQty = analytics.productSales?.reduce(
          (sum, p) => sum + Number(p.quantitySold || 0),
          0
        );

        setKpis({
          revenue: totalRevenue,
          orders: totalOrders,
          aov: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
          newCustomers: totalQty, // you can change meaning later
        });

        // Category revenue → Pie chart
        setPieData(
          analytics.categoryRevenue?.map((c) => ({
            name: c.category?.trim(),
            value: Number(c.revenue || 0),
          })) || []
        );

        // Save product & location analytics
        setProductSales(analytics.productSales || []);
        setLocationOrders(analytics.locationOrders || []);
      }
    } catch (err) {
      console.error("Analytics fetch failed", err);
    }
  };

  fetchData();
}, []);


  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.phone || "").includes(q);
    });
  }, [customers, query]);

  // Quick counts for header
  const totalCustomers = customers.length;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const todayCustomers = customers.filter((u) => new Date(u.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === today).length;

  function exportCSV() {
    const rows = [ ["id", "name", "email", "phone", "createdAt"], ...customers.map((c) => [c._id || "", c.name || "", c.email || "", c.phone || "", c.createdAt || ""]) ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const formatINR = (value) =>
  value?.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });


return (
  <ProtectedRoute allowedRoles={["admin", "manager"]}>
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="p-6 space-y-6">
          {/* ================= HEADER ================= */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Overview of sales, customers and product metrics
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                Total Customers: <strong>{totalCustomers}</strong> • Today:{" "}
                <strong>{todayCustomers}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search customer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64"
              />
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                className="rounded-md border px-3 py-2"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button onClick={exportCSV}>Export CSV</Button>
            </div>
          </div>

          {/* ================= MENUBAR ================= */}
          <div className="flex justify-center">
            <Menubar className="bg-transparent shadow-none">
              <MenubarMenu>
                {["customers", "orders", "products", "reports"].map((tab) => (
                  <MenubarTrigger
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={activeTab === tab ? "font-bold" : ""}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </MenubarTrigger>
                ))}
              </MenubarMenu>
            </Menubar>
          </div>

          {/* ================= CUSTOMERS TAB ================= */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              {/* ===== KPI CARDS ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                    <CardDescription>Last period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {formatCurrency(kpis.revenue)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {kpis.orders} orders • AOV {kpis.aov}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>Completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{kpis.orders}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      New customers: {kpis.newCustomers}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conversion</CardTitle>
                    <CardDescription>Site conversion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">2.9%</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Improved vs previous
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Customers</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {kpis.newCustomers}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Engagement trending
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ===== TOP SELLING PRODUCTS ===== */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Based on quantity sold</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productSales.slice(0, 8).map((p, i) => (
                        <TableRow key={p.productId || i}>
                          <TableCell className="max-w-[280px] truncate">
                            {p.productName}
                          </TableCell>
                          <TableCell>{p.quantitySold}</TableCell>
                          <TableCell className="text-right">
                            {formatINR(p.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* ===== CHARTS ===== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 h-full">
                  <CardHeader>
                    <CardTitle>Sales Trend</CardTitle>
                    <CardDescription>Sales across selected range</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ChartAreaInteractive />
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-25">
                  <Card className="h-72 ">
                        <CardHeader>
                          <CardTitle>Customer Status</CardTitle>
                          <CardDescription>Active vs Inactive</CardDescription>
                        </CardHeader>

                        <CardContent className="h-[220px] p-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={85}
                                innerRadius={40}   
                                paddingAngle={2}
                              >
                                {pieData.map((_, idx) => (
                                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                ))}
                              </Pie>

                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                  <Card className="h-64 overflow-auto">
                    <CardHeader>
                      <CardTitle>Orders by Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          {locationOrders.map((l, i) => (
                            <TableRow key={i}>
                              <TableCell>{l.location?.trim()}</TableCell>
                              <TableCell>{l.orders}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ===== CUSTOMERS TABLE ===== */}
              <Card>
                <CardHeader>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>Search and export</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((c, i) => (
                        <TableRow key={c._id || i}>
                          <TableCell>{c._id}</TableCell>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === "orders" && (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold">Orders Analytics</h2>

    <Card>
      <CardHeader>
        <CardTitle>Orders by Location</CardTitle>
        <CardDescription>Distribution of orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locationOrders.map((l, i) => (
              <TableRow key={i}>
                <TableCell>{l.location?.trim()}</TableCell>
                <TableCell>{l.orders}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
      )}
          {activeTab === "products" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Product Analytics</h2>

              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Based on quantity sold</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productSales.slice(0, 15).map((p, i) => (
                        <TableRow key={p.productId || i}>
                          <TableCell className="max-w-[300px] truncate">
                            {p.productName}
                          </TableCell>
                          <TableCell>{p.quantitySold}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(p.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

{activeTab === "reports" && (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold">Reports</h2>

    <Card>
      <CardHeader>
        <CardTitle>Available Reports</CardTitle>
        <CardDescription>Download or schedule reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline">Download Sales Report</Button>
        <Button variant="outline">Download Customer Report</Button>
        <Button variant="outline">Download Product Report</Button>
      </CardContent>
    </Card>
  </div>
)}

        </div>
      </SidebarInset>
    </SidebarProvider>
  </ProtectedRoute>
);
}