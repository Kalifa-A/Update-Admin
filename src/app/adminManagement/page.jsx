"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  IconPlus,
} from "@tabler/icons-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute"; // ✅ import wrapper

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Status = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function SelectDemo({ items, label }) {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={`Select a ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

// ✅ Extracted AdminManagementPage as component
function AdminManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [CustomerDetails, setCustomerDetails] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

useEffect(() => {
  const fetchDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://thajanwar.onrender.com/api/admin/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (err) {
        console.warn("Failed to parse JSON from /api/admin/all:", err);
        data = text; // fallback to raw text
      }

      if (!res.ok) {
        console.error("Fetch /api/admin/all failed:", res.status, data);
        // optional: show toast
        toast.error(data?.message || "Failed to fetch admins");
        setCustomerDetails([]); // set safe default
        return;
      }

      // Normalize to array — try common shapes
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data?.admins)) {
        list = data.admins;
      } else if (Array.isArray(data?.result)) {
        list = data.result;
      } else if (data && typeof data === "object") {
        // If server returns object keyed by ids: convert to array of values
        list = Object.values(data).filter((v) => v && typeof v === "object");
      } else {
        list = [];
      }

      console.log("Normalized admin list:", list);
      setCustomerDetails(list);
    } catch (err) {
      console.error("Error fetching admin details:", err);
      toast.error("Unable to fetch admin list");
      setCustomerDetails([]);
    } finally {
      setLoading(false);
    }
  };

  fetchDetails();
}, []);

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

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const deleteTheRole = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`https://thajanwar.onrender.com/api/admin/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },

      });
      const data = await res.json();
      console.log("Delete Response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      setCustomerDetails((prev) => prev.filter((item) => item._id !== id));
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user. Try again.");
    }
  };

function CategoryTableDemo({ CustomerDetails, pageIndex, pageSize, searchTerm }) {
  // ensure we have an array
  const dataArray = Array.isArray(CustomerDetails)
    ? CustomerDetails
    : (CustomerDetails?.data || CustomerDetails?.admins || Object.values(CustomerDetails || {}).filter(v => v && typeof v === 'object') || []);

  const filteredData = dataArray.filter((each) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      (each?.name || "").toLowerCase().includes(lowerSearch) ||
      (each?.email || "").toLowerCase().includes(lowerSearch)
    );
  });

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const currentPageData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

    const [selectedRows, setSelectedRows] = useState([]);

    const toggleRow = (index) => {
      setSelectedRows((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    };
      

    return (
      <>
        <Table style={{ fontFamily: "Poppins,sans-serif" }}>
          <TableCaption>A list of Admins.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email ID</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow key="no-customers">
                <TableCell colSpan={8} className="text-center py-4">
                  No Admin found.
                </TableCell>
              </TableRow>
            ) : (
              currentPageData.map((each, index) => {
                const actualIndex = pageIndex * pageSize + index;

                return (
                  <TableRow
                    key={actualIndex}
                    className={`cursor-pointer hover:bg-muted ${
                      selectedRows.includes(actualIndex) ? "bg-gray-100" : ""
                    }`}
                    onClick={() => toggleRow(actualIndex)}
                  >
                    <TableCell>{each.name || "N/A"}</TableCell>
                    <TableCell>{each.email}</TableCell>
                    <TableCell>{each.phone}</TableCell>
                    <TableCell>{each.role}</TableCell>
                    <TableCell>
                      <Select
                        value={each.status}
                        onValueChange={async (value) => {
                          try {
                            const token = localStorage.getItem("token");

                            const updated = [...CustomerDetails];
                            updated[actualIndex] = {
                              ...updated[actualIndex],
                              status: value,
                            };
                            setCustomerDetails(updated);

                            const res = await fetch(
                              `https://thajanwar.onrender.com/api/admin/${each._id}/status`,
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ status: value }),
                              }
                            );

                            const data = await res.json();
                            if (!res.ok) {
                              throw new Error(
                                data.message || "Failed to update status"
                              );
                            }

                            toast.success(data.message || "Admin status updated");
                          } catch (error) {
                            console.error("Status update failed", error);
                            toast.error(
                              error.message || "Failed to update admin status"
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Status.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTheRole(each._id);
                      }}
                    className="bg-black text-white hover:bg-gray-800"

                   >
                      Delete
                   </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </>
    );
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col px-6 gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="w-full max-w-md mx-auto p-2">
                <Input
                  type="text"
                  placeholder="Search Admin..."
                  value={searchTerm}
                  onChange={handleChange}
                  className="rounded-xl border border-gray-300 px-4 py-2 shadow-sm"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-4 py-2 w-[140px]"
                  onClick={() => router.push("/addAdmin")}
                >
                  <IconPlus size={18} className="mr-2" />
                  Add Admin
                </Button>
              </div>

              <CategoryTableDemo
                CustomerDetails={CustomerDetails}
                pageIndex={pageIndex}
                pageSize={pageSize}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ✅ Export wrapped page with role protection
export default function Page() {
  return (
    <ProtectedRoute allowedRoles={[ "admin"]}>
      <AdminManagementPage />
    </ProtectedRoute>
  );
}
