"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { IconPlus, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner'; 
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

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
import { Label } from "@/components/ui/label"; // Make sure to import Label component as used below
import ProtectedRoute from "@/components/ProtectedRoute";

const Status = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const Categories_name_list = [
  { value: "flours-mixes", label: "Flours & Mixes" },
  { value: "baby-care-products", label: "Baby Care Products" },
  { value: "millets", label: "Millets" },
  { value: "rice-grains", label: "Rice & Grains" },
  { value: "spices-masala", label: "Spices & Masala" },
  { value: "lentils", label: "Lentils" },
  { value: "pickles-paste", label: "Pickles & Paste" },
  { value: "ladies-beauty-care", label: "Ladies Beauty Care" },
  { value: "cooking-oils", label: "Cooking Oils" },
  { value: "snacks-health-mixes", label: "Snacks & Health Mixes" },
];

const OrderStatuses = ["Pending", "Packed", "Delivered", "Cancelled",];

/**
 * Simple Select demo component for category/status selection
 */
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

function CategoryTableDemo({searchTerm}) {
  const [CategoriesDetails, setCategoriesDetails] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);  
  const router = useRouter();
  

 useEffect(() => {
  const fetchDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // if you use token-based auth
      const url = "https://thajanwar.onrender.com/orders/";

      console.log("Fetching orders from:", url, "token present?", !!token);

      const res = await fetch(url, {
        method: "GET",
        // include cookies if backend uses cookie sessions
        credentials: "include",
        headers: {
          Accept: "application/json",
          // include Authorization header only if token exists
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // log for debugging
      console.log("Orders fetch status:", res.status, res.statusText);

      if (res.status === 401) {
        // unauthorized — show message and optionally redirect to login
        toast.error("Unauthorized — please login.");
        // If you want to navigate to login automatically (uncomment):
        // router.push("/login");
        setCategoriesDetails([]); // clear
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Failed to fetch orders:", res.status, txt);
        toast.error("Failed to load orders");
        setCategoriesDetails([]);
        return;
      }

      const data = await res.json().catch(() => null);
      const items = Array.isArray(data) ? data : data?.orders ?? [];
      console.debug("Fetched orders:", items.length, items);
      setCategoriesDetails(items);
    } catch (err) {
      console.error("Network or parsing error fetching orders:", err);
      toast.error("Network error — could not load orders");
      setCategoriesDetails([]);
    } finally {
      setLoading(false);
    }
  };
    fetchDetails();
  }, []);


  const filteredData = CategoriesDetails.filter((each) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      each.user?.name?.toLowerCase().includes(lowerSearch) ||
      each.user?.email?.toLowerCase().includes(lowerSearch)
    );
  });

  console.log(filteredData,searchTerm)
const reversedData = [...filteredData].reverse();

// Then paginate
const pageCount = Math.ceil(reversedData.length / pageSize);
const currentPageData = reversedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  // Selection state (simple, count only)
  const [selectedRows, setSelectedRows] = useState([]);

  // Toggle row selection
  const toggleRow = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };
    const handleRowClick = (eachid) => {
    router.push(`/Order?id=${eachid}`);
  };
  return (
    <>
      <Table>
  <TableCaption>A list of orders.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Order ID</TableHead>
      <TableHead>Customer Name</TableHead>
      <TableHead>Date</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Payment Status</TableHead>
      <TableHead>Delivery Slot</TableHead>
      <TableHead>Order Status</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {/* ✅ SHOW LOADING ROW */}
    {loading && (
      <TableRow>
        <TableCell colSpan={8} className="text-center py-6">
          <div className="flex justify-center items-center h-screen">
      <img src="/Book.gif" alt="Loading..." className="w-20 h-20" />
    </div>
        </TableCell>
      </TableRow>
    )}

    {/* ✅ SHOW NO DATA ONLY WHEN NOT LOADING */}
    {!loading && filteredData.length === 0 && (
      <TableRow>
        <TableCell colSpan={8} className="text-center py-4">
          No Orders found.
        </TableCell>
      </TableRow>
    )}

    {/* ✅ SHOW DATA ONLY WHEN NOT LOADING */}
    {!loading &&
      currentPageData.map((each, index) => {
        const actualIndex = pageIndex * pageSize + index;

        return (
          <TableRow
            key={actualIndex}
            className={`cursor-pointer hover:bg-muted ${
              selectedRows.includes(actualIndex) ? "bg-gray-100" : ""
            }`}
            onClick={() => handleRowClick(each._id)}
          >
            <TableCell>{each._id || `#${actualIndex + 1}`}</TableCell>
            <TableCell>{each.user?.name || "N/A"}</TableCell>
            <TableCell>
              {new Date(each.createdAt).toISOString().split("T")[0] || "N/A"}
            </TableCell>
            <TableCell>₹{each.totalPrice}</TableCell>
            <TableCell>{each.paymentMethod}</TableCell>
            <TableCell>{each.deliverySlot}</TableCell>

            <TableCell>
                <Select
                  value={each.status} // must exactly match SelectItem value
                  onValueChange={async (value) => {
                    try {
                      // ✅ Update UI by ID (NOT index)
                      setCategoriesDetails((prev) =>
                        prev.map((item) =>
                          item._id === each._id
                            ? { ...item, status: value }
                            : item
                        )
                      );

                      // ✅ Backend update (with auth if required)
                      await fetch(
                        `https://thajanwar.onrender.com/orders/${each._id}/status`,
                        {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ status: value }),
                        }
                      );

                      toast.success("Order status updated");
                    } catch (error) {
                      console.error("Status update failed", error);
                      toast.error("Failed to update status");
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      {each.status || "Select status"}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {OrderStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
          </TableRow>
        );
      })}
  </TableBody>
</Table>

      {/* Pagination & selection info */}
      <div className="flex items-center justify-between px-4 mt-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {selectedRows.length} of {CategoriesDetails.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={`${pageSize}`} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((old) => Math.max(old - 1, 0))}
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((old) => Math.min(old + 1, pageCount - 1))}
              disabled={pageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}








export default function Page() {

    const [searchTerm, setSearchTerm] = useState("");

      const handleChange = (e) => setSearchTerm(e.target.value);


  return (
    <ProtectedRoute allowedRoles={["admin", "manager","staff"]}>
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
              <div className="flex justify-end gap-4">
                               <div className="w-full max-w-md mx-auto p-2">
                <Input
                  type="text"
                  placeholder="Search Orders..."
                  value={searchTerm}
                  onChange={handleChange}
                  className="rounded-xl border border-gray-300 px-4 py-2 shadow-sm"
                />
              </div>

              </div>
              <CategoryTableDemo searchTerm={searchTerm} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  );
}
