"use client";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
 import{IconPlus} from "@tabler/icons-react"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import ProtectedRoute from "@/components/ProtectedRoute";


function SelectDemo({ items, label ,onValueChange }) {
  return (
    <Select  onValueChange={onValueChange}>
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
const Status = [
  { label: "All", value: "all" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];







import { useRouter } from "next/navigation"; // add this at the top


function CategoryTableDemo({searchTerm , status}) {
  const [ProductDetails, setTheProduct] = useState([]);
  const router = useRouter();  

  useEffect(() => {
    const getThedetails = async () => {
      const res = await fetch("https://thajanwar.onrender.com/products/all", {
        cache: "no-store",
      });
      const product = await res.json();
      console.log(product)

      setTheProduct(product);
    };
    getThedetails();
  }, []);

const deleteTheProduct = async (productId) => {
  console.log(productId)
  const confirmDelete = window.confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`http://localhost:5000/products/${productId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" ,authorization: `Bearer ${localStorage.getItem('token')}`},
    });
const data = await res.json(); // <- important to capture the message
console.log("Delete Response:", data);

if (!res.ok) {
  throw new Error(data.message || "Failed to delete product");
}

    if (!res.ok) {
      throw new Error("Failed to delete product");
    }

    // Assuming you're using useState to manage product list
    setTheProduct((prev) => prev.filter((item) => item._id !== productId));

    alert("Product deleted successfully!");
  } catch (err) {
    console.error("Error deleting product:", err);
    alert("Failed to delete product. Try again.");
  }
};
const filteredData = ProductDetails.filter((each) => {
  const lowerSearch = searchTerm.toLowerCase();

  const matchesSearch =
    each.name?.toLowerCase().includes(lowerSearch) ||
    each.category?.toLowerCase().includes(lowerSearch);

  const matchesStatus =
    status === "all" || each.status === (status === "true");

  return matchesSearch && matchesStatus;
});




  return (
<Table>
  <TableCaption>A list of your Products.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Images</TableHead>
      <TableHead>Product Name</TableHead>
      <TableHead>Categories</TableHead>
      <TableHead>Cost Price</TableHead>
      <TableHead>Selling Price</TableHead>
      <TableHead>Profit</TableHead>
      <TableHead>Stock</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {filteredData.length === 0 ? (
      <TableRow key="no-products">
        <TableCell colSpan={9} className="text-center py-4">
          No Products found.
        </TableCell>
      </TableRow>
    ) : (
      filteredData.map((each) => {
        // Step 1: Find first batch with active: true
        let activeBatch = null;
       each.type?.forEach((variant) => {
  if (!variant || !Array.isArray(variant.batches)) return; // <-- safeguard

  const found = variant.batches.find(batch => batch.active);
  if (found && !activeBatch) {
    activeBatch = { ...found, variant: variant.variant };
  }
});


        return (
          <TableRow
            key={`${each.name}-${each.createdAt}`}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => router.push(`/viewProduct/${each._id}`)}
          >
            <TableCell className="font-medium">
              <img
                src={each.productImg}
                alt={each.name}
                className="h-12 w-12 object-contain"
              />
            </TableCell>
            <TableCell>{each.name?.slice(0,30)}</TableCell>
            <TableCell>{each.category}</TableCell>
            <TableCell>₹{activeBatch?.cost_price ?? "-"}</TableCell>
            <TableCell>₹{activeBatch?.selling_price ?? "-"}</TableCell>
            <TableCell>
              {activeBatch
                ? `₹${(activeBatch.selling_price - activeBatch.cost_price).toFixed(2)}`
                : "-"}
            </TableCell>
            <TableCell>{activeBatch?.stock ?? "-"}</TableCell>
            <TableCell
              onClick={(e) => {
                e.stopPropagation();
                deleteTheProduct(each._id);
              }}
            >
              Delete
            </TableCell>
          </TableRow>
        );
      })
    )}
  </TableBody>
</Table>

  )}

function TableCellViewer({ item, onClose }) {
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(item.img || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    product_name: item.product_name,
    purchase_price: item.purchase_price,
    selling_price: item.selling_price,
    category: item.category,
    available_stock: item.available_stock,
    weight: item.weight.join(", "), // Join array into string
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(file);
      setPreviewUrl(imageUrl);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    if (!previewUrl) {
      setMessage("❌ Please upload an image before saving.");
      setSaving(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("product_name", formData.product_name);
      payload.append("purchase_price", formData.purchase_price);
      payload.append("selling_price", formData.selling_price);
      payload.append("category", formData.category);
      payload.append("available_stock", formData.available_stock);
      payload.append("weight", formData.weight); // still as comma-separated string

      if (selectedImage) {
        payload.append("image", selectedImage);
      } else {
        payload.append("imageUrl", previewUrl);
      }

      const res = await fetch(`http://localhost:5000/api/products/${item.id}`, {
        method: "PUT",
        body: payload,
      });

      if (!res.ok) throw new Error("Failed to update");
      setMessage("✅ Saved successfully!");
    } catch (error) {
      setMessage("❌ Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={true} direction={isMobile ? "bottom" : "right"} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Edit Product: {formData.product_name}</DrawerTitle>
          <DrawerDescription>Category: {formData.category}</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col items-center gap-2">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-40 h-40 object-cover rounded-md border shadow"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full max-w-sm"
            />
          </div>

          <form className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-3">
              <Label>Product Name</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Purchase Price</Label>
              <Input
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Selling Price</Label>
              <Input
                type="number"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Stock</Label>
              <Input
                type="number"
                value={formData.available_stock}
                onChange={(e) => setFormData({ ...formData, available_stock: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Weight (comma-separated)</Label>
              <Input
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>

            {message && <p className="text-sm text-center text-red-500">{message}</p>}
          </form>
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default function Page() {

const [status, setStatus] = useState("all"); // correct
    const [searchTerm, setSearchTerm] = useState("");

      const handleChange = (e) => setSearchTerm(e.target.value);

  const router = useRouter();  


  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)"
        }
      }>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col px-6 gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

                          <div className="flex justify-end gap-4">
                                        <SelectDemo items={Status} label="Status"  onValueChange={(val) => setStatus(val)} />
                                      <Button
  variant="outline"
  size="sm"
  className="px-4 py-2"
  onClick={() => router.push("/addProduct")}
>
  <IconPlus size={18} className="mr-2" />
  Add Product
</Button>
                                      </div>
                                                                     <div className="w-full max-w-md mx-auto p-2">
                <Input
                  type="text"
                  placeholder="Search a Products..."
                  value={searchTerm}
                  onChange={handleChange}
                  className="rounded-xl border border-gray-300 px-4 py-2 shadow-sm"
                />
              </div>
                  <CategoryTableDemo searchTerm={searchTerm} status={status}/>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  );
}
