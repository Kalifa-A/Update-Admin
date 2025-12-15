"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import "./Customer.css";
import ProtectedRoute from "@/components/ProtectedRoute";

const CustomerDetails = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCustomerAndOrders = async () => {
      try {
        setLoading(true);

        /* ================= USERS ================= */
        const usersRes = await fetch(
          "https://thajanwar.onrender.com/users/"
        );
        const users = await usersRes.json();

        const foundCustomer = users.find((u) => u._id === id);
        if (!foundCustomer) {
          setCustomer(null);
          setLoading(false);
          return;
        }

        /* ================= ORDERS ================= */
        const ordersRes = await fetch(
          "https://thajanwar.onrender.com/orders/order/"
        );
        const ordersJson = await ordersRes.json();

        const orders = Array.isArray(ordersJson)
          ? ordersJson
          : Array.isArray(ordersJson.orders)
          ? ordersJson.orders
          : Array.isArray(ordersJson.data)
          ? ordersJson.data
          : [];


        const customerOrders = orders.filter((o) => {
  const userId =
    o.user?._id ||
    o.user ||
    o.customer?._id ||
    o.userId;
  return String(userId) === String(id);
});
        const totalSpend = customerOrders.reduce(
          (sum, o) =>
            sum +
            Number(o.amount_spend || o.total || o.totalPrice || 0),
          0
        );

        setCustomer({
          ...foundCustomer,
          orderHistory: customerOrders,
          amount_spend: totalSpend,
        });

        setLoading(false);
      } catch (err) {
        console.error("Customer details fetch error:", err);
        setLoading(false);
      }
    };

    fetchCustomerAndOrders();
  }, [id]);

  /* ================= LOADING ================= */
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
          <div className="flex justify-center items-center h-screen">
            <img src="/Book.gif" alt="Loading..." className="w-20 h-20" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );

  if (!customer) return <p className="p-6">Customer not found.</p>;

  /* ================= UI ================= */
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

          <div className="order-container">
            <h2 className="title">Customer Details</h2>

            <div className="order-sections">
              {/* Personal Info */}
              <div className="order-summary box1">
                <h3 style={{ fontWeight: "bold" }}>Personal Info</h3>

                <div className="floating-label-input animated-input">
                  <input className="styled-input" value={customer.name} readOnly />
                  <label>Name</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input className="styled-input" value={customer.phone} readOnly />
                  <label>Phone</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input className="styled-input" value={customer.email} readOnly />
                  <label>Email</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input
                    className="styled-input"
                    value={
                      customer.address?.length
                        ? customer.address
                            .map(
                              (a) =>
                                `${a.name}, ${a.street}, ${a.district}, ${a.state}, ${a.zip}`
                            )
                            .join(" | ")
                        : "N/A"
                    }
                    readOnly
                  />
                  <label>Address</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input
                    className="styled-input"
                    value={new Date(customer.createdAt).toLocaleDateString()}
                    readOnly
                  />
                  <label>Joined Date</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input
                    className="styled-input"
                    value={customer.account_type || "N/A"}
                    readOnly
                  />
                  <label>Status</label>
                </div>
              </div>

              {/* Orders & Spending */}
              <div className="product-breakdown box2">
                <h3 style={{ fontWeight: "bold" }}>Orders & Spending</h3>

                <div className="floating-label-input animated-input">
                  <input
                    className="styled-input"
                    value={customer.orderHistory.length}
                    readOnly
                  />
                  <label>Total Orders</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input
                    className="styled-input"
                    value={customer.amount_spend}
                    readOnly
                  />
                  <label>Total Spend</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input
                    className="styled-input"
                    value={customer._id}
                    readOnly
                  />
                  <label>Customer ID</label>
                </div>
              </div>
            </div>
            {/* ================= ORDER DETAILS TABLE ================= */}
<div className="mt-8">
  <h3 className="text-lg font-semibold mb-4">Order History</h3>

  <div className="overflow-x-auto rounded-xl border">
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-3 font-medium">Order ID</th>
          <th className="px-4 py-3 font-medium">Date</th>
          <th className="px-4 py-3 font-medium">Items</th>
          <th className="px-4 py-3 font-medium">Amount</th>
          <th className="px-4 py-3 font-medium">Payment</th>
          <th className="px-4 py-3 font-medium">Status</th>
        </tr>
      </thead>

      <tbody>
        {customer.orderHistory?.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
              No orders found for this customer
            </td>
          </tr>
        ) : (
          customer.orderHistory.map((order, index) => (
            <tr
              key={order._id || index}
              className="border-t hover:bg-gray-50 transition"
            >
              <td className="px-4 py-3">
                {order._id || "—"}
              </td>

              <td className="px-4 py-3">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : "—"}
              </td>

              <td className="px-4 py-3">
                {order.items?.length || order.products?.length || 0}
              </td>

              <td className="px-4 py-3 font-semibold">
                ₹{order.total || order.amount_spend || 0}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.payment_status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.payment_status || "Pending"}
                </span>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : order.status === "Cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {order.status || "Processing"}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default CustomerDetails;
