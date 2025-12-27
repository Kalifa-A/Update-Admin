"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./page.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";

export default function OrderDetailsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [order, setOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");

  /* =====================
     Derived values
     ===================== */
  const orderItems = Array.isArray(order?.orderItems)
    ? order.orderItems
    : [];

  const paidOrCreated = order?.paidAt || order?.createdAt || null;
  const formattedTime = paidOrCreated
    ? new Date(paidOrCreated).toLocaleString()
    : "N/A";

  const subtotal = Number(order?.totalPrice || 0);
  const deliveryCharge = order?.deliveryCharge ?? 100;
  const grandTotal = subtotal + deliveryCharge;

  /* =====================
     Fetch order
     ===================== */
  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No auth token found");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `https://thajanwar.onrender.com/orders/api/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Fetch failed");

        const data = await res.json();
        setOrder(data);
        setOrderStatus(data.status || "");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load order");
      }
    };

    fetchOrder();
  }, [id]);

  /* =====================
     Update order status
     ===================== */
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setOrderStatus(newStatus);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No auth token found");
      return;
    }

    try {
      const res = await fetch(
        `https://thajanwar.onrender.com/orders/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Status update failed");

      setOrder((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );

      toast.success("Order status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  /* =====================
     Guards
     ===================== */
  if (!id) return <p>Order ID missing</p>;
  if (!order) return <p>Loading...</p>;

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
}
