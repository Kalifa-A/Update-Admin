"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { IconPlus, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner'; 
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
import { Label } from "@/components/ui/label"; 
import { useRouter } from "next/navigation"; // add this at the top
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

const OrderStatuses = ["Pending", "Packed", "Out for Delivered", "Delivered", "Cancelled","Returned","Refunded","Exchange"];


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

function CategoryTableDemo() {
  const [offerDetails, setOfferDetails] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  


  useEffect(() => {
    const fetchDetails = async () => {
      const res = await fetch("https://thajanwar.onrender.com/offer/all", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});
      const data = await res.json();
      setOfferDetails(data)
      console.log(data)
 };
    fetchDetails();
  }, []);

  // Pagination logic
  const pageCount = Math.ceil(offerDetails.length / pageSize);
  const currentPageData = offerDetails.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

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
      <Table>
        <TableCaption>A list of Offers.</TableCaption>
        <TableHeader>
          <TableRow>
            
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Offer Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {offerDetails.length === 0 ? (
            <TableRow key="no-categories">
              <TableCell colSpan={8} className="text-center py-4">
                No Orders found.
              </TableCell>
            </TableRow>
          ) : (
            currentPageData.map((each, index) => {
              // actual index in full data = pageIndex * pageSize + index
              const actualIndex = pageIndex * pageSize + index;
              return (
                <TableRow
                  key={actualIndex}
                  className={`cursor-pointer hover:bg-muted ${selectedRows.includes(actualIndex) ? "bg-gray-100" : ""}`}
                  onClick={() => toggleRow(actualIndex)}
                >

                  <TableCell>{each.name || "N/A"}</TableCell>
             <TableCell>{new Date(each.createdAt).toISOString().split('T')[0] || "N/A"}</TableCell>  
                  <TableCell>{each.offerCategory}</TableCell>
                  <TableCell>{each.offerType}</TableCell>
                  <TableCell>
                   <Select
  value={each.status}
  onValueChange={async (value) => {
    try {
      // Local state update
      const updated = [...CategoriesDetails];
      updated[actualIndex] = { ...updated[actualIndex], status: value };
      setCategoriesDetails(updated);

      // Send update to backend
      await fetch(`http://localhost:5000/orders/${each._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`, // optional
        },
        body: JSON.stringify({ status: value }),
      });
    } catch (error) {
      console.error('Status update failed', error);
    }
    toast.success("Order status updated")
  }}
>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select status" />
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
            })
          )}
        </TableBody>
      </Table>

     
    </>
  );
}
export default function Page() {
    const router = useRouter();  
  
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

              {/* ✅ Card added here */}
             

              {/* Filters and Add Product Button */}
              <div className="flex justify-end gap-4">
                <SelectDemo items={Categories_name_list} label="Categories" />
                <SelectDemo items={Status} label="Status" />
                <Button variant="outline" size="sm" className="px-4 py-2"   onClick={() => router.push("/offer")}
>
                  <IconPlus />
                  <span className="hidden lg:inline">Add Offer</span>
                </Button>
              </div>
              <div className="flex justify-center gap-4 w-full flex-wrap">
  <div className="w-full max-w-[315px] rounded-2xl border bg-white p-6 shadow-sm text-center">
    <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
    <p className="mt-2 text-2xl font-semibold text-gray-900">125</p>
  </div>
  <div className="w-full max-w-[315px] rounded-2xl border bg-white p-6 shadow-sm text-center">
    <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
    <p className="mt-2 text-2xl font-semibold text-gray-900">₹12,500</p>
  </div>
</div>

              {/* Order Table */}
              <CategoryTableDemo />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  );
}