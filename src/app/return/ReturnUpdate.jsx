"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./Return.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ReturnPage() {
  const searchParams = useSearchParams();
  const retId = searchParams.get("id");

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  /* ---------------- FETCH RETURN BY ID ---------------- */
  const fetchReturnById = async () => {
    try {
      const res = await fetch("https://thajanwar.onrender.com/api/returns");
      const data = await res.json();

      const ret = Array.isArray(data)
        ? data.find((r) => r._id === retId)
        : null;

      if (!ret) {
        setReturnData(null);
      } else {
        setReturnData({
          ...ret,
          returnItems: Array.isArray(ret.returnItems)
            ? ret.returnItems
            : [],
        });
        setStatus(ret.status || "");
      }
    } catch (err) {
      console.error("Error fetching return:", err);
      setReturnData(null);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    if (!retId) return;

    setLoading(true);
    fetchReturnById().finally(() => setLoading(false));
  }, [retId]);

  /* ---------------- UPDATE STATUS ---------------- */
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);

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

      await res.json();          // consume response
      await fetchReturnById();   // re-fetch full data

      alert("Return status updated successfully");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
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
          <div className="flex justify-center items-center h-screen">
            <img src="/Book.gif" alt="Loading..." className="w-20 h-20" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!returnData) {
    return <div className="p-6">Return request not found.</div>;
  }

  /* ---------------- UI ---------------- */
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

        <div className="order-container">
          <h2 className="title">Return and Refund Details</h2>

          <div className="order-sections">
            {/* -------- LEFT -------- */}
            <div className="box">
              <h3 className="summary">Return Summary</h3>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={returnData.orderId?._id || ""}
                  readOnly
                />
                <label>Order ID</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={returnData._id || ""}
                  readOnly
                />
                <label>Request ID</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={returnData.userId?.name || ""}
                  readOnly
                />
                <label>Customer Name</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={returnData.userId?.email || ""}
                  readOnly
                />
                <label>Customer Email</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={returnData.reason || ""}
                  readOnly
                />
                <label>Reason</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={returnData.userId?.phone || ""}
                  readOnly
                />
                <label>Phone</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={
                    returnData.requestedAt
                      ? new Date(returnData.requestedAt).toLocaleString()
                      : ""
                  }
                  readOnly
                />
                <label>Requested At</label>
              </div>
            </div>

            {/* -------- RIGHT -------- */}
            <div className="box2 product-breakdown">
              <h3 className="summary">Products</h3>

              <div className="breakdown-r">
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnData.returnItems.length > 0 ? (
                      returnData.returnItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="flex items-center gap-2">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-contain rounded"
                            />
                            <span>{item.name?.slice(0, 30)}</span>
                          </td>
                          <td>{item.quantity}</td>
                          <td>₹{item.selling_price}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="field1 admin-action">
                <label>Request Status:</label>
                <select value={status} onChange={handleStatusChange}>
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
