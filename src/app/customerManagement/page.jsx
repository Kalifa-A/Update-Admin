"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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



function CategoryTableDemo({ CustomerDetails, pageIndex, pageSize, searchTerm }) {
  const router = useRouter();
  const filteredData = CustomerDetails.filter((each) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      each.name?.toLowerCase().includes(lowerSearch) ||
      each.email?.toLowerCase().includes(lowerSearch)
    );
  });

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const currentPageData = filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const [selectedRows, setSelectedRows] = useState([]);

  const toggleRow = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <Table>
      <TableCaption>A list of Customers.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Customer ID</TableHead>
          <TableHead>Customer Name</TableHead>
          <TableHead>Phone Number</TableHead>
          <TableHead>Total Orders</TableHead>
          <TableHead>Total Spends</TableHead>
          <TableHead>Last Order Status</TableHead>
          <TableHead>Email ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.length === 0 ? (
          <TableRow key="no-customers">
            <TableCell colSpan={8} className="text-center py-4">
              No customers found.
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
                onClick={() => router.push(`/customerDetails?id=${each._id}`)}
              >
                <TableCell>{each._id || `#${actualIndex + 1}`}</TableCell>
                <TableCell>{each.name || "N/A"}</TableCell>
                <TableCell>{each.phone || "N/A"}</TableCell>
                <TableCell>{each.orderHistory?.length || 0}</TableCell>
                <TableCell>{each.amount_spend ?? "N/A"}</TableCell>
                <TableCell>{each.last_order || "N/A"}</TableCell>
                <TableCell>{each.email || "N/A"}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [CustomerDetails, setCustomerDetails] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchDetails = async () => {
      const response = await fetch("https://thajanwar.onrender.com/users/");
      const data = await response.json();
      console.log(data);
      setCustomerDetails(data);
    };
    fetchDetails();
  }, []);

  const handleChange = (e) => setSearchTerm(e.target.value);

  const istDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const todayCustomers = CustomerDetails.filter((user) => {
    const userDate = new Date(user.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return userDate === istDate;
  });

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col px-6 gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Filters */}
              <div className="flex justify-center mb-5 gap-4">
                <SelectDemo items={Categories_name_list} label="Categories" />
                <SelectDemo items={Status} label="Status" />
              </div>

              {/* Stats Cards */}
              <div className="flex justify-center gap-4 w-full flex-wrap">
                <div className="w-full max-w-[315px] rounded-2xl border bg-white p-6 shadow-sm text-center">
                  <h3 className="text-sm font-medium text-gray-500">Total Customer</h3>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{CustomerDetails.length}</p>
                </div>
                <div className="w-full max-w-[315px] rounded-2xl border bg-white p-6 shadow-sm text-center">
                  <h3 className="text-sm font-medium text-gray-500">Today Customer</h3>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{todayCustomers.length}</p>
                </div>
              </div>

              {/* Search */}
              <div className="w-full max-w-md mx-auto p-2">
                <Input
                  type="text"
                  placeholder="Search Customer..."
                  value={searchTerm}
                  onChange={handleChange}
                  className="rounded-xl border border-gray-300 px-4 py-2 shadow-sm"
                />
              </div>

              {/* Customer Table */}
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
    </ProtectedRoute>
  );
}
