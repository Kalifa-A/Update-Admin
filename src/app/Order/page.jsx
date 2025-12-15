"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./page.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";

const OrderDetails = () => {
  // Next's search params (client-only hook)
  const searchParams = useSearchParams();

  // keep id in state so we can set a fallback from window.location if needed
  const [id, setId] = useState(() => {
    try {
      // initial attempt (may be null during SSR/hydration)
      return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("id");
    } catch {
      return null;
    }
  });

  const [order, setOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");

  // Sync `id` with useSearchParams when available (runs on client)
  useEffect(() => {
    const paramId = searchParams?.get?.("id") ?? null;
    if (paramId && paramId !== id) {
      setId(paramId);
    } else if (!paramId && typeof window !== "undefined") {
      // fallback: try reading from window.location once (covers hosting/static cases)
      const maybe = new URLSearchParams(window.location.search).get("id");
      if (maybe && maybe !== id) setId(maybe);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!id) {
      console.error("No order id found in URL");
      return;
    }

    const Token = localStorage.getItem("token");
    if (!Token) {
      console.error("No token found");
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`https://thajanwar.onrender.com/orders/api/${id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            ...(Token ? { Authorization: `Bearer ${Token}` } : {}),
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed to fetch order: ${res.status} - ${text}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setOrder(data);
          setOrderStatus(data?.status || "");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load order details.");
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setOrderStatus(newStatus);

    const Token = localStorage.getItem("token");
    if (!Token) {
      console.error("No token found");
      toast.error("No auth token.");
      return;
    }

    try {
      const res = await fetch(`https://thajanwar.onrender.com/orders/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(Token ? { Authorization: `Bearer ${Token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to update status: ${res.status} - ${text}`);
      }

      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success("✅ Order status updated successfully!");
    } catch (error) {
      console.error("Status update failed", error);
      toast.error("❌ Failed to update order status!");
    }
  };

  if (!id) return <p>Order ID not provided in URL (missing `?id=...`).</p>;
if (!order)
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
  const orderItems = Array.isArray(order.orderItems) ? order.orderItems : [];
  const paidOrCreated = order.paidAt || order.createdAt || null;
  const formattedTime = paidOrCreated ? new Date(paidOrCreated).toLocaleString() : "N/A";
  const subtotal = Number(order.totalPrice || 0);
  const deliveryCharge = order.deliveryCharge ?? 100;
  const grandTotal = subtotal + deliveryCharge;

  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="order-container">
            <h2 className="title">View Order Details</h2>

            <div className="order-section">
              <div className="order-summary box-1">
                <h3 style={{ fontWeight: "bold", fontSize: "larger" }}>Order Summary</h3>
                <hr />
                <div className="order-row">
                  <span className="label">Order ID:</span>
                  <span className="value">{order._id}</span>
                </div>
                <div className="order-row">
                  <span className="label">Order Time:</span>
                  <span className="value">{formattedTime}</span>
                </div>
                <div className="order-row">
                  <span className="label">Delivery Slot:</span>
                  <span className="value">{order.deliverySlot || "N/A"}</span>
                </div>
                <div className="order-row">
                  <span className="label">Payment Method:</span>
                  <span className="value">{order.paymentMethod || "N/A"}</span>
                </div>
                <div className="order-row">
                  <span className="label">Payment Status:</span>
                  <span className="value">{order.paymentMethod === "Online" ? "Paid" : "Pending"}</span>
                </div>
                <div className="order-row">
                  <span className="label">Order Status:</span>
                  <span className="value">{orderStatus}</span>
                </div>
                <h3 style={{ fontWeight: "bold", fontSize: "larger" }}>Customer Info</h3>
                <p>{order.shippingAddress?.name || "N/A"}</p>
                <p>{order.shippingAddress?.phone || "N/A"}</p>
                <p>
                  {order.shippingAddress?.street || ""}{" "}
                  {order.shippingAddress?.district ? `, ${order.shippingAddress.district}` : ""}{" "}
                  {order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ""}{" "}
                  {order.shippingAddress?.zip ? ` - ${order.shippingAddress.zip}` : ""}
                </p>
              </div>

              <div className="product-breakdown box-2">
                <h3 style={{ fontWeight: "bold", fontSize: "larger" }}>Product Breakdown</h3>
                <hr />
                <div className="table-wrapper">
                  <div className="breakdown">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Weight</th>
                          <th>Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name || `product-${idx}`}
                                  className="w-12 h-12 object-contain rounded"
                                />
                              ) : null}
                              <span className="text-justify ">{(item.name || "").slice(0, 30)}</span>
                            </td>
                            <td>{item.quantity || 0}</td>
                            <td>{item.variant?.label || "-"}</td>
                            <td>₹{Number(item.selling_price || 0)}</td>
                            <td>₹{(Number(item.quantity || 0) * Number(item.selling_price || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                        {orderItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center">No items</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="total-box">
                  <p>Sub Total: ₹{subtotal.toFixed(2)}</p>
                  <p>Delivery: ₹{deliveryCharge}</p>
                  <p>
                    <strong>Grand Total: ₹{grandTotal.toFixed(2)}</strong>
                  </p>
                </div>

                <div className="admin-action">
                  <label htmlFor="order-status-select">Update Order Status:</label>
                  <select id="order-status-select" value={orderStatus} onChange={handleStatusChange}>
                    <option value="Pending">Pending</option>
                    <option value="Packed">Packed</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default OrderDetails;
