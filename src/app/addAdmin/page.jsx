"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useEffect, useState } from "react";
import axios from "axios";
import "../offer/page.css";

const OrderDetails = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "",
  });


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(name,value)
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match ❌");
      return;
    }

    try {
      const token = localStorage.getItem('token'); // replace with actual token
      const response = await axios.post(
        "http://localhost:5000/api/admin/register",
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          Confirm_password: formData.confirm_password,
          role: formData.role.toLowerCase().replace(" ", ""),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
                        credentials: 'include', // ✅ include cookies in request/response

        }
      );

      console.log("Success:", response.data);
      setFormData({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "",
  })
      alert("Admin registered successfully ✅");
    } catch (error) {
      console.error("Error submitting form:", error.response?.data || error);
      alert("Error registering admin ❌");
    }
  };

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

        {/* Centered Container */}
        <div
          className="order-container"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - var(--header-height))",
          }}
        >
          <h2 className="title">Add Admin</h2>

          <form
            className="order-sections"
            onSubmit={handleSubmit}
            style={{ width: "400px" }}
          >
            <div className="order-summary box1">
              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <label>Name</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="email"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <label>Email</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                <label>Phone No</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="password"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <label>Password</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="password"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                />
                <label>Confirm Password</label>
              </div>

              <div className="floating-label-input animated-input">
                <select
                  className="styled-input"
                  required
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <label>Admin Role</label>
              </div>

              <button
                type="submit"
                className="submit-btn"
                style={{
                  marginTop: "20px",
                  padding: "10px 20px",
                  background: "#4CAF50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default OrderDetails;
