"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

export default function ReturnsAdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch return requests
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await fetch("https://thajanwar.onrender.com/api/returns");
        const data = await res.json();
        // normalize to ensure returnItems present
        const safe = (Array.isArray(data) ? data : []).map((r) => ({
          returnItems: [],
          ...r,
        }));
        setReturnRequests(safe);
      } catch (err) {
        console.error("Error fetching returns:", err);
        setReturnRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const handleChange = (e) => setSearchTerm(e.target.value);

  const filteredReturns = (returnRequests || []).filter((ret) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      ret.userId?.name?.toLowerCase().includes(lowerSearch) ||
      ret.userId?.email?.toLowerCase().includes(lowerSearch) ||
      ret.orderId?._id?.toLowerCase().includes(lowerSearch)
    );
  });

  // Navigate to Return details page on row click
  const handleRowClick = (retId) => {
    router.push(`/return?id=${retId}`);
  };

  // Update status for a specific return (retId, newStatus)
  const handleStatusChange = async (retId, newStatus, e) => {
    // stop row click if passed event
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();

    // optimistic update
    setReturnRequests((prev) =>
      prev.map((r) => (r._id === retId ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await fetch(
        `https://thajanwar.onrender.com/api/returns/${retId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();

      // If API returns the updated object, merge it in
      if (updated && updated._id) {
        setReturnRequests((prev) =>
          prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r))
        );
      }
      // optional: show a toast/alert
      // alert("Status updated");
    } catch (err) {
      console.error("Error updating status:", err);
      // revert optimistic update on failure
      setReturnRequests((prev) =>
        prev.map((r) => (r._id === retId ? { ...r, status: r.status } : r))
      );
      alert("Failed to update status. Try again.");
    }
  };

  if (loading)
    return (
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="p-6">Loading return requests...</div>
        </SidebarInset>
      </SidebarProvider>
    );

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col px-6 gap-2">
          <h2 className="text-2xl font-bold py-4 text-center">Return Requests</h2>

          {/* Search */}
          <div className="w-full max-w-md mb-4 mx-auto">
            <Input
              type="text"
              placeholder="Search by user name, email, or order ID..."
              value={searchTerm}
              onChange={handleChange}
              className="rounded-xl border border-gray-300 px-4 py-2 shadow-sm"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto font-poppins">
            <Table>
              <TableCaption>List of Return Requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No return requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  // display newest first without mutating original array
                  [...filteredReturns].reverse().map((ret) => {
                    const items = Array.isArray(ret.returnItems) ? ret.returnItems : [];

                    return (
                      <TableRow
                        key={ret._id}
                        className="hover:bg-gray-50 cursor-pointer font-poppins"
                        onClick={() => handleRowClick(ret._id)}
                      >
                        <TableCell className="font-poppins">
                          {ret.userId?.name ?? "—"}
                        </TableCell>

                        <TableCell className="flex overflow-hidden">
                          {items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 mb-1 overflow-hidden"
                              title={item.name}
                            >
                              <img
                                src={item.image}
                                alt={item.name ?? `product-${idx}`}
                                className="w-10 h-10 object-contain rounded"
                              />
                            </div>
                          ))}
                        </TableCell>

                        <TableCell>{ret.reason ?? "—"}</TableCell>

                        <TableCell>
                          <label style={{ fontWeight: "bold", marginRight: 6 }}>
                            Status:
                          </label>
                          <select
                            value={ret.status ?? "requested"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(ret._id, e.target.value, e)}
                            className="rounded px-2 py-1"
                          >
                            <option value="requested">Requested</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </TableCell>

                        <TableCell>
                          {ret.requestedAt
                            ? new Date(ret.requestedAt).toLocaleString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
