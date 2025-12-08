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

  useEffect(() => {
    // Fetch customers and analytics in parallel
    const fetchData = async () => {
      try {
        // Customers
        const u = await fetch("https://thajanwar.onrender.com/users/");
        if (u.ok) {
          const data = await u.json();
          setCustomers(Array.isArray(data) ? data : []);
        }
        // Analytics (replace with your actual analytics endpoint if available)
        // const a = await fetch(`/api/analytics?from=${from}&to=${to}&g=${granularity}`);
        // if (a.ok) { const ad = await a.json(); setKpis(ad.kpis); setPieData(ad.pie); }
      } catch (err) {
        console.error("Failed fetching analytics or customers", err);
      }
    };
    fetchData();
  }, [from, to, granularity]);

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
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Analytics</h1>
                <p className="text-sm text-muted-foreground">Overview of sales, customers and product metrics</p>
                <div className="mt-2 text-sm text-muted-foreground">Total Customers: <strong>{totalCustomers}</strong> • Today: <strong>{todayCustomers}</strong></div>
              </div>

              <div className="flex items-center gap-2">
                <Input placeholder="Search customer..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                <select value={granularity} onChange={(e) => setGranularity(e.target.value)} className="rounded-md border px-3 py-2">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <Button onClick={exportCSV}>Export CSV</Button>
              </div>
            </div>

            {/* Menubar Tabs */}
            <div className="mb-4">
              <div className="mx-auto flex justify-center">
                <Menubar className="bg-transparent shadow-none ">
                  <MenubarMenu>
                    <MenubarTrigger onClick={() => setActiveTab("customers")} className={activeTab === "customers" ? "font-bold" : ""}>Customers</MenubarTrigger>
                    <MenubarTrigger onClick={() => setActiveTab("orders")} className={activeTab === "orders" ? "font-bold" : ""}>Orders</MenubarTrigger>
                    <MenubarTrigger onClick={() => setActiveTab("products")} className={activeTab === "products" ? "font-bold" : ""}>Products</MenubarTrigger>
                    <MenubarTrigger onClick={() => setActiveTab("reports")} className={activeTab === "reports" ? "font-bold" : ""}>Reports</MenubarTrigger>
                  </MenubarMenu>
                </Menubar>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === "customers" && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Revenue</CardTitle>
                      <CardDescription>Last period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{formatCurrency(kpis.revenue)}</div>
                      <div className="text-sm text-muted-foreground mt-1">{kpis.orders} orders • AOV {kpis.aov}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Orders</CardTitle>
                      <CardDescription>Completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{kpis.orders}</div>
                      <div className="text-sm text-muted-foreground mt-1">New customers: {kpis.newCustomers}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion</CardTitle>
                      <CardDescription>Site conversion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">2.9%</div>
                      <div className="text-sm text-muted-foreground mt-1">Improved vs previous</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Active Customers</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{kpis.newCustomers}</div>
                      <div className="text-sm text-muted-foreground mt-1">Engagement trending</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Sales Trend</CardTitle>
                      <CardDescription>Sales across selected range</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ChartAreaInteractive />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Status</CardTitle>
                      <CardDescription>Active vs Inactive</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label />
                          {pieData.map((_, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Customers table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Customers</CardTitle>
                      <CardDescription>Search and export</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableCaption>List of customers</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Id</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">No customers found</TableCell>
                            </TableRow>
                          ) : (
                            filteredCustomers.map((c, i) => (
                              <TableRow key={c._id || i}>
                                <TableCell>{c._id}</TableCell>
                                <TableCell>{c.name}</TableCell>
                                <TableCell>{c.email}</TableCell>
                                <TableCell>{c.phone}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                      <CardDescription>Quick stats</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span>Total Sales</span><strong>{formatCurrency(kpis.revenue)}</strong></div>
                        <div className="flex justify-between"><span>Orders</span><strong>{kpis.orders}</strong></div>
                        <div className="flex justify-between"><span>Average Order</span><strong>{kpis.aov}</strong></div>
                        <div className="flex justify-between"><span>Export</span><Button onClick={exportCSV}>CSV</Button></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <h2 className="text-lg font-semibold">Orders (placeholder)</h2>
                <p className="text-sm text-muted-foreground">You can list recent orders, status and quick actions here.</p>
              </div>
            )}

            {activeTab === "products" && (
              <div>
                <h2 className="text-lg font-semibold">Products (placeholder)</h2>
                <p className="text-sm text-muted-foreground">Product level analytics – best sellers, stock alerts.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white p-4 rounded shadow">Product pie 1 (placeholder)</div>
                  <div className="bg-white p-4 rounded shadow">Product pie 2 (placeholder)</div>
                  <div className="bg-white p-4 rounded shadow">Product pie 3 (placeholder)</div>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div>
                <h2 className="text-lg font-semibold">Reports</h2>
                <p className="text-sm text-muted-foreground">Custom downloadable reports and scheduled exports.</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">Tip: replace demo analytics calls with your real endpoints and tune the charts. Need help wiring a specific endpoint? I can wire it for you.</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
