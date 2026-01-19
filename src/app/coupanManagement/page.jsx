"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus as IconPlus } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


/**
 * CouponsPage with Delete action (robust/fallback endpoints + optimistic UI)
 */
export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [deletingIds, setDeletingIds] = useState(new Set());
  const router = useRouter();

  // Normalize coupon fields (same normalization used before)
// updated normalizeCoupon: map discount_type and prettify it
const normalizeCoupon = (raw) => {
  raw = raw || {};
  // detect discount type from several possible keys (your API uses `discount_type`)
  const discountTypeRaw =
    raw.discount_type ?? raw.discountType ?? raw.type ?? raw.kind ?? (raw.discount && raw.discount.type) ?? null;

  // pretty label for UI
  const discountTypeLabel =
    discountTypeRaw === "flat" ? "Flat amount" : discountTypeRaw === "percent" ? "Percentage" : (discountTypeRaw ?? "—");

  return {
    _id: raw._id ?? raw.id ?? raw._doc?.id ?? String(Math.random()).slice(2),
    code:
      raw.code ??
      raw.coupan_code ??
      raw.coupon_code ??
      raw.coupan?.code ??
      raw.fields?.code ??
      "—",
    discount:
      typeof raw.discount !== "undefined"
        ? raw.discount
        : typeof raw.discountValue !== "undefined"
        ? raw.discountValue
        : raw.discount_value ?? null,
    discount_type: discountTypeRaw,       // raw value (flat | percent | ...)
    discount_type_label: discountTypeLabel, // pretty label for UI
    maxUsage: raw.maxUsage ?? raw.max_users ?? raw.max_usage ?? raw.maxUses ?? null,
    used: raw.used ?? raw.used_count ?? raw.uses ?? 0,
    expiresAt: raw.expiresAt ?? raw.end_date ?? raw.expires_at ?? raw.endDate ?? null,
    active:
      typeof raw.active === "boolean"
        ? raw.active
        : typeof raw.status === "string"
        ? raw.status.toLowerCase() === "active"
        : raw.is_active ?? false,
    raw,
  };
};


  // Fetch coupons list
  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await fetch("https://thajanwar.onrender.com/api/coupons/list", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`GET /list failed ${res.status}: ${text}`);
      }
      const data = await res.json();
      console.debug("Raw coupons response:", data);
      const list = Array.isArray(data) ? data : data.coupons ?? [];
      setCoupons(list.map(normalizeCoupon));
    } catch (err) {
      console.error("Error fetching coupons:", err);
      toast.error("Could not load coupons from server");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Try several DELETE endpoints until one succeeds
  // verbose delete + fallbacks
  const deleteFromServer = async (id) => {
  const res = await fetch(
    `https://thajanwar.onrender.com/api/coupons/delete/${id}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    }
  );

  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("Delete API returned HTML:", text);
    throw new Error("Server returned HTML instead of JSON");
  }

  if (!res.ok) {
    throw new Error(data?.message || `Delete failed (${res.status})`);
  }

  return data;
};


  const handleDelete = async (id, code) => {
  if (!window.confirm(`Delete coupon "${code || id}"?`)) return;

  const previousCoupons = coupons;

  // Optimistic UI
  setCoupons((prev) => prev.filter((c) => c._id !== id));
  setDeletingIds((s) => new Set(s).add(id));

  try {
    await deleteFromServer(id);
    alert(`Coupon "${code || id}" deleted successfully.`);
  } catch (err) {
    console.error("Delete error:", err);
    toast.error(err.message || "Delete failed");
    setCoupons(previousCoupons); // rollback
  } finally {
    setDeletingIds((s) => {
      const ns = new Set(s);
      ns.delete(id);
      return ns;
    });
  }
};


  const filtered = coupons.filter((c) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.code || "").toLowerCase().includes(q) ||
      String(c.discount ?? "").toLowerCase().includes(q) ||
      String(c._id || "").toLowerCase().includes(q)
    );
  });
if (loading) {
    return  <SidebarProvider
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
  }
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
        <div className="flex flex-1 flex-col px-6 gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold py-4">Coupons</h2>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => fetchCoupons()} disabled={loading}>
                Refresh
              </Button>

              <Link href="/addCoupan">
                <Button variant="outline" size="sm" className="px-4 py-2 flex items-center">
                  <IconPlus className="mr-2" />
                  <span className="hidden lg:inline">Add Coupon</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full flex items-center gap-2 mb-2">
            <Input
              placeholder="Filter by code, discount or id..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="overflow-x-auto">
            <Table style={{ fontFamily: "Poppins,sans-serif" }}>
  <TableCaption>List of coupons</TableCaption>

  <TableHeader>
    <TableRow>
      <TableHead>Code</TableHead>
      <TableHead>Discount</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Max Usage</TableHead>
      <TableHead>Used</TableHead>
      <TableHead>Expires</TableHead>
      <TableHead>Active</TableHead>
      <TableHead>Edit</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {filtered.length === 0 ? (
      <TableRow>
        <TableCell colSpan={9} className="text-center py-8">
          No coupons found.
        </TableCell>
      </TableRow>
    ) : (
      filtered.map((c) => (
        <TableRow key={c._id}>
          <TableCell>{c.code ?? "—"}</TableCell>
          <TableCell>{c.discount ?? "Nope"}</TableCell>
          <TableCell>{c.discount_type ?? "—"}</TableCell>
          <TableCell>{c.maxUsage ?? "—"}</TableCell>
          <TableCell>{c.used ?? 0}</TableCell>
          <TableCell>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</TableCell>
          <TableCell>{c.active ? "Yes" : "No"}</TableCell>

          <TableCell>
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => router.push(`/editcoupon?id=${c._id}`)}
            >
              Edit
            </Button>
          </TableCell>

          <TableCell>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="bg-black text-white hover:bg-gray-800"
                onClick={() => handleDelete(c._id, c.code)}
                disabled={deletingIds.has(c._id)}
              >
                {deletingIds.has(c._id) ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
