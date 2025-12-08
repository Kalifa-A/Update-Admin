"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // ✅ to get ?id= from URL
import axios from "axios";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import "./page.css";
import ProtectedRoute from "@/components/ProtectedRoute";

const CustomerDetails = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // get ?id=
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchCustomer = async () => {
        try {
          const res = await axios.get("https://thajanwar.onrender.com/users/");
          const data = res.data;
          const foundCustomer = data.find((user) => user._id === id);
          setCustomer(foundCustomer || null);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching customer:", err);
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [id]);

  if (loading) return <p className="p-6">Loading customer details...</p>;
  if (!customer) return <p className="p-6">Customer not found.</p>;

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
        {/* Box 1: Personal Info */}
        <div className="order-summary box1">
          <h3 style={{fontWeight:"bold"}}>Personal Info</h3>
        <div className="floating-label-input animated-input">
            <input type="text" className="styled-input" value={customer.name} readOnly />
            <label>Name</label>
          </div>
          

          <div className="floating-label-input animated-input">
            <input type="text" className="styled-input" value={customer.phone} readOnly />
            <label>Phone</label>
          </div>

          <div className="floating-label-input animated-input">
            <input type="text" className="styled-input" value={customer.email} readOnly />
            <label>Email</label>
          </div>

          <div className="floating-label-input animated-input">
            <input
              type="text"
              className="styled-input"
              value={
                customer.address?.length > 0
                  ? customer.address.map((a) => `${a.name}, ${a.street}, ${a.district}, ${a.state}, ${a.zip}`).join(" | ")
                  : "N/A"
              }
              readOnly
            />
            <label>Address</label>
          </div>

          <div className="floating-label-input animated-input">
            <input
              type="text"
              className="styled-input"
              value={new Date(customer.createdAt).toLocaleDateString()}
              readOnly
            />
            <label>Joined Date</label>
          </div>

          <div className="floating-label-input animated-input">
            <input tpe="text" className="styled-input" value={customer.account_type || "N/A"} readOnly />
            <label>Status</label>
          </div>
        </div>

        {/* Box 2: Orders & Spending */}
        <div className="product-breakdown box2">
          <h3 style={{fontWeight:"bold"}}>Orders & Spending</h3>

          <div className="floating-label-input animated-input">
            <input type="text" className="styled-input" value={customer.orderHistory?.length || 0} readOnly />
            <label>Total Orders</label>
          </div>

          <div className="floating-label-input animated-input">
            <input type="text" className="styled-input" value={customer.amount_spend || 0} readOnly />
            <label>Total Spend</label>
          </div>

          <div className="floating-label-input animated-input">
            <input type="text" className="styled-input" value={customer._id} readOnly />
            <label>Customer ID</label>
          </div>
        </div>
      </div>
    </div>

      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  );
 }
export default CustomerDetails;