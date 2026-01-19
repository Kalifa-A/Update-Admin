"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState, useRef } from "react";
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
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { se } from "date-fns/locale";
import { set } from "date-fns";

function CategoryTableDemo() {
  const [CategoriesDetails, setTheCatgories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getThedetails = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://thajanwar.onrender.com/api/admin/categories", {
          cache: "no-store",
        });
        const data = await res.json();
        setTheCatgories(Array.isArray(data) ? data : data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setTheCatgories([]);
      } finally {
        setLoading(false);
      }

    };
    getThedetails();
  }, []);

  return (
    <>
      <Table className="w-full border-collapse text-sm rounded table-poppins" style={{ fontFamily: "Poppins,sans-serif" }}>
        <TableCaption>A list of your Product Categories.</TableCaption>
        <TableHeader>
          <TableRow className="h-10">
            <TableHead className="py-1 px-1">Images</TableHead>
            <TableHead className="py-1 px-1">Categories Name</TableHead>
            <TableHead className="py-1 px-1">No. of Product</TableHead>
            <TableHead className="py-1 px-1">Status</TableHead>
          </TableRow>
        </TableHeader>
<TableBody>
  {/* Loading row: shown when loading === true */}
  {loading && (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-4">
        <div className="flex justify-center items-center">
          <img src="/Book.gif" alt="Loading..." className="w-10 h-10" />
        </div>
      </TableCell>
    </TableRow>
  )}

  {/* Empty state: shown only when not loading */}
  {!loading && (!CategoriesDetails || CategoriesDetails.length === 0) && (
    <TableRow key="no-categories">
      <TableCell colSpan={4} className="text-center py-3 text-gray-500">
        No categories found.
      </TableCell>
    </TableRow>
  )}

  {/* Data rows: shown only when not loading */}
  {!loading &&
    CategoriesDetails?.map((each) => (
      <TableRow
        key={each._id}
        className="cursor-pointer hover:bg-muted h-10"
        onClick={() => setSelectedItem(each)}
      >
        <TableCell className="py-2 px-3 font-medium">
          <img
            src={each.img}
            alt={each.categories_name || "Product image"}
            className="h-10 w-10 object-cover rounded-md"
          />
        </TableCell>
        <TableCell className="py-1 px-1">{each.categories_name}</TableCell>
        <TableCell className="py-1 px-1">{each.product_count}</TableCell>
        <TableCell className="py-1 px-1">{each.status}</TableCell>
      </TableRow>
    ))}
</TableBody>

      </Table>

      {selectedItem && (
        <TableCellViewer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          setTheCatgories={setTheCatgories}
        />
      )}
    </>
  );
}

function TableCellViewer({ item, onClose, setTheCatgories }) {
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState(null); // File for thumbnail
  const lastPreviewRef = useRef(null); // revoke preview when changed
  const [previewUrl, setPreviewUrl] = useState(item.img || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: item.categories_name,
    slug: item.slug,
    count: item.product_count,
    status: item.status,
    seoTitle: item.seo_title || "",
    seoDesc: item.seo_description || "",
    seo_key: item.seo_keywords || "",
    bannerImages: null,
    bannerPreviews: item.bannerImg || "",
  });

  // cleanup preview object URLs on unmount
  useEffect(() => {
    return () => {
      if (lastPreviewRef.current) {
        URL.revokeObjectURL(lastPreviewRef.current);
        lastPreviewRef.current = null;
      }
      // revoke banner preview if it was an objectURL
      if (formData.bannerPreviews && String(formData.bannerPreviews).startsWith("blob:")) {
        URL.revokeObjectURL(formData.bannerPreviews);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // upload helper — returns single URL or array of URLs (same as before)
  const uploadImage = async (files) => {
    if (!files) return null;
    const list = Array.isArray(files) ? files : [files];

    const uploadedUrls = await Promise.all(
      list.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("img", file);

        const res = await fetch("https://thajanwar.onrender.com/new/upload", {
          method: "POST",
          body: uploadData,
          // include credentials if your upload needs cookies:
          credentials: "include",
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error("Image upload failed: " + (txt || res.statusText));
        }

        const result = await res.json();
        if (Array.isArray(result.imageUrls) && result.imageUrls.length > 0) {
          return result.imageUrls[0];
        } else if (result.imageUrl) {
          return result.imageUrl;
        } else if (typeof result === "string") {
          return result;
        } else {
          throw new Error("Unexpected upload response");
        }
      })
    );

    return uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // revoke previous preview
    if (lastPreviewRef.current) {
      URL.revokeObjectURL(lastPreviewRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    lastPreviewRef.current = objectUrl;

    setSelectedImage(file);
    setPreviewUrl(objectUrl);
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // revoke previous banner preview if objectURL
    if (formData.bannerPreviews && String(formData.bannerPreviews).startsWith("blob:")) {
      URL.revokeObjectURL(formData.bannerPreviews);
    }
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, bannerImages: file, bannerPreviews: url }));
  };

  // MAIN Save handler — robust update flow
    const handleSave = async (id) => {
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token") || "";

      // 1) Upload banner if changed
      let finalBannerUrl = item.bannerImg || formData.bannerPreviews || null;
      if (formData.bannerImages) {
        finalBannerUrl = await uploadImage(formData.bannerImages);
      }

      // 2) Upload thumbnail if changed
      let finalThumbnailUrl = item.img || "";
      if (selectedImage) {
        const thumbUploadData = new FormData();
        thumbUploadData.append("img", selectedImage);

        const thumbRes = await fetch("https://thajanwar.onrender.com/api/upload", {
          method: "POST",
          body: thumbUploadData,
          credentials: "include",
        });

        // Read body text for debugging if non-ok
        const thumbText = await thumbRes.text().catch(() => "");
        if (!thumbRes.ok) {
          console.error("Thumbnail upload failed:", thumbRes.status, thumbText);
          throw new Error("Thumbnail upload failed: " + (thumbText || thumbRes.statusText));
        }
        const thumbJson = JSON.parse(thumbText || "{}");
        if (!thumbJson.imageUrl) {
          console.error("Thumbnail upload response missing imageUrl:", thumbJson);
          throw new Error("Thumbnail upload returned no imageUrl");
        }
        finalThumbnailUrl = thumbJson.imageUrl;
      }

      // 3) Prepare payload (only real URLs)
      const payload = {
        categoryId: id,
        categories_name: formData.name,
        slug: formData.slug,
        status: formData.status,
        img: finalThumbnailUrl,
        description: formData.seoDesc,
        seo_title: formData.seoTitle,
        seo_description: formData.seoDesc,
        seo_keywords: formData.seo_key,
        bannerImg: finalBannerUrl,
      };

      // Helper to attempt an update and return parsed body or throw
      const tryUpdate = async (url, method = "PUT") => {
        console.log(`Attempting ${method} ${url} with payload:`, payload);
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        // Read response body (try JSON, fallback to text)
        const raw = await res.text().catch(() => "");
        let body;
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch (err) {
          body = raw;
        }
        console.log(`${method} ${url} response:`, { status: res.status, ok: res.ok, body, headers: Object.fromEntries(res.headers) });

        if (!res.ok) {
          // Throw object with useful info so outer catch can show it
          const err = new Error("Update failed");
          err.status = res.status;
          err.body = body;
          err.url = url;
          throw err;
        }
        return body;
      };

      // 4) Try primary update endpoint (PUT). Adjust to your API if needed.
      let updateBody;
      try {
        updateBody = await tryUpdate(`https://thajanwar.onrender.com/api/category/${id}`, "PUT");
      } catch (err) {
        console.warn("Primary update failed:", err.status, err.body);

        // If server responds 404/405 or indicates POST expected, try POST fallback
        if (err.status === 404 || err.status === 405 || (typeof err.body === "string" && err.body.toLowerCase().includes("method"))) {
          try {
            updateBody = await tryUpdate(`https://thajanwar.onrender.com/api/add_category`, "POST");
          } catch (err2) {
            console.error("Fallback POST /api/add_category also failed:", err2.status, err2.body);
            throw err2;
          }
        } else if (err.status === 401 || (err.body && err.body.message && err.body.message.toLowerCase().includes("unauthor"))) {
          // Auth error
          throw new Error("Unauthorized. Please login and ensure token is valid.");
        } else {
          throw err;
        }
      }

      // 5) Success — update local state
      setTheCatgories((prev) =>
        prev.map((cat) =>
          cat._id === id
            ? {
                ...cat,
                categories_name: formData.name,
                slug: formData.slug,
                status: formData.status,
                img: finalThumbnailUrl,
                description: formData.seoDesc,
                seo_title: formData.seoTitle,
                seo_description: formData.seoDesc,
                seo_keywords: formData.seo_key,
                bannerImg: finalBannerUrl,
              }
            : cat
        )
      );

      setMessage("✅ Saved successfully!");
      onClose();
    } catch (error) {
      console.error("handleSave error:", error);
      // Show useful message to user
      if (error.status) {
        setMessage(`❌ Failed to update (status ${error.status}): ${JSON.stringify(error.body)}`);
      } else {
        setMessage("❌ Error: " + (error.message || "Unknown error"));
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteTheCategory = async (categoryID) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this category and all products under it?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`https://thajanwar.onrender.com/api/category/${categoryID}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to delete category");

      setTheCatgories((prev) => prev.filter((it) => it._id !== categoryID));
      alert("Category and its products deleted successfully!");
      if (onClose) onClose();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category. Please try again.");
    }
  };

  return (
    <Drawer open={true} direction={isMobile ? "bottom" : "right"} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.categories_name}</DrawerTitle>
          <DrawerDescription>Status: {item.status}</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col items-center gap-2">
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-40 h-40 object-cover rounded-md border shadow" />
            )}
            <Input type="file" accept="image/*" onChange={handleImageChange} className="w-full max-w-sm" />
          </div>

          <form className="flex flex-col gap-4 mt-4">
            <Label>Category Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <Label>Slug</Label>
            <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
            <Label>Status</Label>
            <Select defaultValue={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Label>SEO Title</Label>
            <Input value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} />
            <Label>SEO Description</Label>
            <Input value={formData.seoDesc} onChange={(e) => setFormData({ ...formData, seoDesc: e.target.value })} />
            <Label>SEO Keywords</Label>
            <Input value={formData.seo_key} onChange={(e) => setFormData({ ...formData, seo_key: e.target.value })} />

            <div>
              <label className="custom-upload-btn">
                <div className="upload-label">
                  <p className="thumbnail">Upload Banner image</p>
                </div>
                <input type="file" accept="image/*" onChange={handleBannerImageChange} style={{ display: "none" }} />
              </label>
            </div>
            {formData.bannerPreviews && (
              <img src={formData.bannerPreviews} alt="Preview" className="h-24 w-24 object-contain rounded border" />
            )}
          </form>
        </div>

        <DrawerFooter>
          <Button type="button" onClick={() => handleSave(item._id)} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" onClick={() => deleteTheCategory(item._id)} className="bg-red-500">
            Delete
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
                <div className="flex justify-end">
                  <Link href="/addCategory">
                    <Button variant="outline" size="sm" className="px-4 py-2">
                      <IconPlus className="mr-2" />
                      <span className="hidden lg:inline">Add Category</span>
                    </Button>
                  </Link>
                </div>
                <CategoryTableDemo />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
