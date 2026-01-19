"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import "../offer/page.css";

export default function EditCouponPage() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params?.get?.("id") || null;

  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const [formData, setFormData] = useState({
    coupan_title: "",
    coupan_code: "",
    discount_type: "flat",
    min_order_value: "",
    discountValue: "",
    max_users: "",
    description: "",
    status: "active",
  });

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return (
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("authToken") ||
      window.localStorage.getItem("accessToken") ||
      null
    );
  };

  const normalizeCoupon = (raw = {}) => {
    // Handles many common shapes
    const code =
      raw.code ??
      raw.coupan_code ??
      raw.coupon_code ??
      raw.coupon?.code ??
      raw.fields?.code ??
      "";
    const title = raw.title ?? raw.coupon_title ?? raw.coupan_title ?? raw.name ?? "";
    const discount =
      raw.discountValue ??
      raw.discount ??
      raw.discount_value ??
      raw.amount ??
      raw.discount_amount ??
      "";
    const discount_type = raw.discount_type ?? raw.type ?? raw.kind ?? "";
    const min_order_value =
      raw.min_order_value ?? raw.minOrderValue ?? raw.min_order ?? raw.minOrder ?? "";
    const max_users = raw.max_users ?? raw.maxUses ?? raw.max_usage ?? raw.max_users ?? "";
    const description = raw.description ?? raw.desc ?? raw.details ?? "";
    const status = raw.status ?? (typeof raw.active === "boolean" ? (raw.active ? "active" : "inactive") : "active");
    const start = raw.start_date ?? raw.startDate ?? raw.start ?? null;
    const end = raw.end_date ?? raw.endDate ?? raw.expires_at ?? raw.expiresAt ?? raw.end ?? null;

    return {
      coupan_title: title,
      coupan_code: code,
      discount_type,
      min_order_value: min_order_value ?? "",
      discountValue: discount ?? "",
      max_users: max_users ?? "",
      description,
      status,
      start_date_raw: start,
      end_date_raw: end,
    };
  };

  // Fetch coupon robustly
  const fetchCoupon = async () => {
    if (!id) {
      setLoading(false);
      toast.error("Missing coupon id");
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Try one canonical endpoint (server may support this)
      const res = await fetch(`https://thajanwar.onrender.com/api/coupons/${id}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", ...headers },
      });

      const text = await res.text().catch(() => "");
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      console.debug("Edit fetch single result:", res.status, data);

      if (res.ok) {
        // normalize possible wrapping
        let payload = data ?? {};
        if (payload.coupon) payload = payload.coupon;
        else if (payload.data) payload = payload.data;
        else if (payload.result) payload = payload.result;

        const normalized = normalizeCoupon(payload);
        setFormData((p) => ({ ...p, ...normalized }));
        // set dates if available
        const parsedStart = normalized.start_date_raw ? new Date(normalized.start_date_raw) : null;
        const parsedEnd = normalized.end_date_raw ? new Date(normalized.end_date_raw) : null;
        setStartDate(parsedStart);
        setEndDate(parsedEnd);
      } else {
        // If single endpoint fails, fallback to list & search
        console.warn("Single coupon endpoint failed, trying list fallback.");
        const listRes = await fetch("https://thajanwar.onrender.com/api/coupons/list", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json", ...headers },
        });
        const listText = await listRes.text().catch(() => "");
        let listData;
        try {
          listData = listText ? JSON.parse(listText) : null;
        } catch {
          listData = { raw: listText };
        }

        let arr = [];
        if (Array.isArray(listData)) arr = listData;
        else if (Array.isArray(listData.coupons)) arr = listData.coupons;
        else if (Array.isArray(listData.data)) arr = listData.data;
        else arr = Object.values(listData ?? {}).filter((v) => v && (v._id || v.id || v.code));

        const found = arr.find((it) => String(it._id ?? it.id ?? it._doc?.id ?? it.code) === String(id));
        if (found) {
          const normalized = normalizeCoupon(found);
          setFormData((p) => ({ ...p, ...normalized }));
          const parsedStart = normalized.start_date_raw ? new Date(normalized.start_date_raw) : null;
          const parsedEnd = normalized.end_date_raw ? new Date(normalized.end_date_raw) : null;
          setStartDate(parsedStart);
          setEndDate(parsedEnd);
        } else {
          console.error("Coupon not found on server:", id);
          toast.error("Coupon not found on server");
        }
      }
    } catch (err) {
      console.error("fetchCoupon error:", err);
      toast.error(err.message || "Failed to load coupon");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCoupon();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = () => {
    setFormData((prev) => ({ ...prev, status: prev.status === "active" ? "inactive" : "active" }));
  };

  const handleCancel = () => router.push("/coupons");

  const tryUpdate = async (url, method, payload, token) => {
    try {
      const headers = { "Content-Type": "application/json", Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => "");
      let parsed;
      try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
      return { ok: res.ok, status: res.status, parsed, res };
    } catch (err) {
      console.warn("Network error during update attempt", url, err);
      return { ok: false, status: 0, parsed: { error: String(err) } };
    }
  };

// Replace your existing handleSubmit with this
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!id) {
    toast.error("Coupon ID missing");
    return;
  }

  if (!formData.coupan_title.trim()) return toast.error("Enter coupon title");
  if (!formData.coupan_code.trim()) return toast.error("Enter coupon code");
  if (!formData.discountValue || Number(formData.discountValue) <= 0)
    return toast.error("Enter valid discount");

  setSubmitting(true);

  try {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token missing");
      setSubmitting(false);
      return;
    }

    const payload = {
      coupan_title: formData.coupan_title.trim(),
      coupan_code: formData.coupan_code.trim(),
      discount_type: formData.discount_type,
      discountValue: Number(formData.discountValue),
      min_order_value: Number(formData.min_order_value || 0),
      max_users: Number(formData.max_users || 0),
      description: formData.description || "",
      status: formData.status,
      start_date: startDate ? startDate.toISOString() : null,
      end_date: endDate ? endDate.toISOString() : null,
    };

    const res = await fetch(
      `https://thajanwar.onrender.com/api/coupons/update/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Update failed:", data);
      toast.error(data?.message || "Failed to update coupon");
      setSubmitting(false);
      return;
    }
      alert("Coupon updated successfully");
  } catch (err) {
    console.error("Update error:", err);
    toast.error("Something went wrong");
  } finally {
    setSubmitting(false);
  }
};


  // loading UI
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

        {/* Centered Container (same design as create) */}
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
          <h2 className="title">Edit Coupon</h2>

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

            <div className="product-breakdown box2" style={{ width: "100%", marginTop: "20px" }}>
              <Popover open={openStart} onOpenChange={setOpenStart}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal mt-2", !startDate && "text-muted-foreground")}
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

              <Popover open={openEnd} onOpenChange={setOpenEnd}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal mt-2", !endDate && "text-muted-foreground")}
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

              <div className="toggle-wrapper mt-4">
                <label className="mr-2">Status</label>
                <label className="switch">
                  <input type="checkbox" checked={formData.status === "active"} onChange={handleToggleChange} />
                  <span className="slider">
                    <span className={`toggle-text ${formData.status === "active" ? "active" : "inhidden"}`}>
                      {formData.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <Button className="mt-4" type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save Changes"}
              </Button>
              <Button variant="ghost" className="mt-4 ml-2" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
