"use client";
import React, { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "../offer/page.css";

const CouponCreate = () => {
  const [formData, setFormData] = useState({
    coupan_title: "",
    coupan_code: "",
    discount_type: "flat", // default to flat
    min_order_value: "",
    discountValue: "",
    max_users: "",
    description: "",
    status: "active",
  });

  // startDate & endDate are Date objects or null
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // unified change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // keep numeric inputs as strings in state for controlled inputs,
    // we'll parse to Number right before sending.
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "active" ? "inactive" : "active",
    }));
  };

  const resetForm = () => {
    setFormData({
      coupan_title: "",
      coupan_code: "",
      discount_type: "flat",
      min_order_value: "",
      discountValue: "",
      max_users: "",
      description: "",
      status: "active",
    });
    setStartDate(null);
    setEndDate(null);
  };

  // Try canonical POST first (/api/coupons), fallback to /api/coupons/create if 404/405
  const postToServer = async (payload) => {
    // try to pick token from localStorage (common keys)
    let token = null;
    if (typeof window !== "undefined") {
      token =
        window.localStorage.getItem("token") ||
        window.localStorage.getItem("authToken") ||
        window.localStorage.getItem("accessToken") ||
        null;
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const endpoints = [
      // "https://thajanwar.onrender.com/api/coupons",
      "https://thajanwar.onrender.com/api/coupons/create",
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: defaultHeaders,
          credentials: "include", // keep for cookie-based auth
          body: JSON.stringify(payload),
        });

        const text = await res.text().catch(() => "");
        let parsed;
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          parsed = { raw: text };
        }

        // if endpoint not found, try next
        if (res.status === 404 || res.status === 405) {
          console.warn(`POST ${url} returned ${res.status} — trying next endpoint`);
          continue;
        }

        return { url, res, data: parsed };
      } catch (err) {
        console.error(`Network error posting to ${url}:`, err);
        // try next endpoint
        continue;
      }
    }

    // all failed
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic validation
    if (!formData.coupan_title.trim()) {
      alert("Please enter coupon title");
      return;
    }
    if (!formData.coupan_code.trim()) {
      alert("Please enter coupon code");
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      alert("Enter a valid discount value (> 0)");
      return;
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      alert("End date cannot be before start date");
      return;
    }

    setSubmitting(true);

    try {
      // Build a payload that includes multiple common field names
      const numericDiscount = Number(formData.discountValue);
      const base = {
        // Titles / names
        title: formData.coupan_title.trim(),
        coupon_title: formData.coupan_title.trim(),
        coupan_title: formData.coupan_title.trim(),

        // Codes (note: many backends expect `code` or `coupon_code`)
        code: formData.coupan_code.trim(),
        coupon_code: formData.coupan_code.trim(),
        coupan_code: formData.coupan_code.trim(),

        // generic fields
        discount_type: formData.discount_type,
        min_order_value: formData.min_order_value ? Number(formData.min_order_value) : 0,
        min_order: formData.min_order_value ? Number(formData.min_order_value) : 0,
        max_users: formData.max_users ? Number(formData.max_users) : 0,
        max_uses: formData.max_users ? Number(formData.max_users) : 0,
        description: formData.description || "",
        status: formData.status,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };

      const discountFields =
        formData.discount_type === "percent"
          ? {
              discountValue: numericDiscount,
              discount: numericDiscount,
              discount_percent: numericDiscount,
              percent: numericDiscount,
            }
          : {
              discountValue: numericDiscount,
              discount: numericDiscount,
              amount: numericDiscount,
              discount_amount: numericDiscount,
            };

      const payload = { ...base, ...discountFields };

      console.log("Payload Sent (final):");
      console.table(payload);

      const result = await postToServer(payload);

      if (!result) {
        console.error("All POST endpoints failed. Network or CORS issue.");
        alert("Failed to create coupon — network or server unavailable. Check console.");
        return;
      }

      const { url, res, data } = result;

      if (res.status === 401) {
        // unauthenticated
        console.warn("Server returned 401 (No token / unauthenticated). Response:", data);
        // clear any stale tokens localy
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("token");
          window.localStorage.removeItem("authToken");
          window.localStorage.removeItem("accessToken");
        }
        alert("You are not authenticated. Please log in and try again.");
        // optionally redirect to login page:
        // window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        console.error("Coupon creation failed:", {
          url,
          status: res.status,
          statusText: res.statusText,
          responsePreview: data,
        });
        alert(data?.error || data?.message || "Failed to create coupon");
        return;
      }

      // success path
      // try to detect created id/object
      const createdId = data?.id || data?._id || data?.coupon?.id || data?.coupon?._id || data?.data?.id;
      if (createdId) {
        alert(`Coupon created successfully (id: ${createdId}).`);
      } else {
        alert(data?.message || "Coupon created successfully!");
      }

      console.info("Create coupon response:", { url, data });
      resetForm();
    } catch (error) {
      console.error("Coupon creation failed", error);
      alert("Failed to create coupon — network error (see console)");
    } finally {
      setSubmitting(false);
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
          <h2 className="title">Add Coupon</h2>

          {/* ONE FULL FORM CONTAINER */}
          <form
            onSubmit={handleSubmit}
            className="order-sections"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "500px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              background: "#fff",
            }}
          >
            {/* Coupon Info */}
            <div className="order-summary box1" style={{ width: "100%" }}>
              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="coupan_title"
                  value={formData.coupan_title}
                  onChange={handleInputChange}
                />
                <label>Coupan Title</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="coupan_code"
                  value={formData.coupan_code}
                  onChange={handleInputChange}
                />
                <label>Coupan Code</label>
              </div>

              {/* Dropdown for Discount Type */}
              <div className="floating-label-input">
                <label className="input-heading">Discount Type</label>
                <select
                  className="styled-input2"
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                >
                  <option value="">---------</option>
                  <option value="flat">Flat</option>
                  <option value="percent">Percent</option>
                </select>
              </div>


              <div className="floating-label-input animated-input">
                <input
                  type="number"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                />
                <label>Discount Value</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="number"
                  className="styled-input"
                  placeholder=" "
                  name="min_order_value"
                  value={formData.min_order_value}
                  onChange={handleInputChange}
                />
                <label>Min Order Value</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="number"
                  className="styled-input"
                  placeholder=" "
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleInputChange}
                />
                <label>Max Users</label>
              </div>
              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  row="3"
                />
                <label>Description</label>
              </div>
            </div>

            {/* Dates + Status */}
            <div className="product-breakdown box2" style={{ width: "100%", marginTop: "20px" }}>
              {/* Start Date */}
              <Popover open={openStart} onOpenChange={setOpenStart}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !startDate && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    {startDate ? format(startDate, "PPP") : "Pick a Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[390px] h-[370px] p-0">
                  <div className="scale-[0.75] origin-top-left">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </div>
                </PopoverContent>
              </Popover>

              {/* End Date (cannot select before start date) */}
              <Popover open={openEnd} onOpenChange={setOpenEnd}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !endDate && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    {endDate ? format(endDate, "PPP") : "Pick an End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[390px] h-[370px] p-0">
                  <div className="scale-[0.75] origin-top-left">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => (startDate ? date <= new Date(startDate) : false)}
                      initialFocus
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {/* Status Toggle */}
              <div className="toggle-wrapper mt-4">
                <label className="mr-2">Status</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formData.status === "active"}
                    onChange={handleToggleChange}
                  />
                  <span className="slider">
                    <span className={`toggle-text ${formData.status === "active" ? "active" : "inhidden"}`}>
                      {formData.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center w-full">
              <Button className="mt-4" type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default CouponCreate;
