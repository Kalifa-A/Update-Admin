"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import "./view.css";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useParams } from "next/navigation";

/* ----------------- Sortable Image ----------------- */
function SortableImage({ src, id, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative w-full h-64 border rounded overflow-hidden flex items-center justify-center"
    >
      <img
        src={src}
        alt="Preview"
        {...listeners}
        className="max-w-full max-h-full object-contain cursor-grab"
      />
      <button
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 text-red rounded-full w-6 h-6 flex items-center justify-center text-sm cursor-pointer"
      >
        &times;
      </button>
    </div>
  );
}

/* ----------------- Banner Modal ----------------- */
const BannerModal = ({ isOpen, onClose, banners, setFormData }) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((i) => i === active.id);
    const newIndex = banners.findIndex((i) => i === over.id);

    const newBanners = arrayMove(banners, oldIndex, newIndex);
    setFormData((prev) => {
      const updatedImages = newBanners.map((preview) =>
        prev.bannerImages.find((img) => img.preview === preview)
      );
      return {
        ...prev,
        bannerPreviews: newBanners,
        bannerImages: updatedImages,
      };
    });
  };

  const handleRemove = (previewToRemove) => {
    setFormData((prev) => {
      const updatedBannerImages = prev.bannerImages.filter(
        (img) => img.preview !== previewToRemove
      );
      URL.revokeObjectURL(previewToRemove);
      return {
        ...prev,
        bannerImages: updatedBannerImages,
        bannerPreviews: updatedBannerImages.map((img) => img.preview),
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Banner Previews</h2>
          <button
            onClick={onClose}
            className="text-red-600 font-bold text-xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={banners} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {banners.map((src) => (
                <SortableImage key={src} id={src} src={src} onRemove={handleRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

/* ----------------- Editable Table ----------------- */
const columns = [
  "id",
  "variant",
  "stock",
  "mrp_price",
  "cost_price",
  "selling_price",
  "gst",
  "profit",
  "amt",
  "net_cost",
  "net_amt",
  "active",
];

const readOnlyColumns = [
  "id",
  "gst_amount",
  "profit",
  "amt",
  "net_cost",
  "net_amt",
];

const createEmptyRow = (id) => ({
  id,
  batchId: `TEMP-${id}-${Date.now()}`, // unique temporary id for editing
  variant: "",
  stock: "",
  mrp_price: "",
  cost_price: "",
  selling_price: "",
  gst_percent: "",
  gst_amount: "",
  profit: "",
  amt: "",
  net_cost: "",
  net_amt: "",
  active: false,
});



const EditableTable = ({ formData, setFormData }) => {
  const parseNumber = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateFields = (row) => {
    const stock = parseNumber(row.stock);
    const costPrice = parseNumber(row.cost_price);
    const sellingPrice = parseNumber(row.selling_price);
    const gstPercent = parseNumber(row.gst_percent);

    const gstAmount = (costPrice * gstPercent) / 100;
    const profit = sellingPrice - costPrice;
    const amt = costPrice * stock;
    const netCost = costPrice + gstAmount;
    const netAmt = sellingPrice * stock + (sellingPrice * gstPercent) / 100;

    return {
      gst_amount: gstAmount.toFixed(2),
      profit: profit.toFixed(2),
      amt: amt.toFixed(2),
      net_cost: netCost.toFixed(2),
      net_amt: netAmt.toFixed(2),
    };
  };

  const handleInputChange = (rowIndex, columnName, value) => {
    setFormData((prev) => {
      const newRows = [...(prev.type || [])];
      const updatedRow = { ...newRows[rowIndex], [columnName]: value };

      if (
        ["stock", "cost_price", "selling_price", "gst_percent"].includes(
          columnName
        )
      ) {
        const calculated = calculateFields(updatedRow);
        Object.assign(updatedRow, calculated);
      }

      newRows[rowIndex] = updatedRow;
      return { ...prev, type: newRows };
    });
  };

// handler inside EditableTable
// handler inside EditableTable
const handleActiveChange = (variantName, identifier) => {
  setFormData((prev) => {
    const newRows = prev.type.map((row) => {
      if (row.variant === variantName) {
        const rowIdentifier = row.batchId || row.id;
        return { ...row, active: rowIdentifier === identifier };
      }
      return row;
    });
    return { ...prev, type: newRows };
  });
};





  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      type: [...(prev.type ?? []), createEmptyRow((prev.type?.length ?? 0) + 1)],
    }));
  };

  const handleDeleteRow = (rowIndex) => {
    setFormData((prev) => ({
      ...prev,
      type: prev.type.filter((_, i) => i !== rowIndex),
    }));
  };

  return (
    <div>
      <div className="p-4 w-full max-w-screen overflow-x-auto">
        <table className="table-fixed border-collapse border border-gray-400 w-full text-xs">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border border-gray-300 p-2 text-center bg-gray-100"
                >
                  {col === "gst_percent"
                    ? "GST (%)"
                    : col === "gst_amount"
                    ? "GST Amt"
                    : col === "active"
                    ? "Active"
                    : col.replace(/_/g, " ").toUpperCase()}
                </th>
              ))}
              <th className="border border-gray-300 p-2 text-center bg-gray-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {(formData?.type || []).map((row, rowIndex) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col} className="border border-gray-300 p-1 text-center">
                    {col === "active" ? (
                    <input
                            type="radio"
                            name={`active-${(row.variant || "noVariant").replace(/\s+/g, "_")}`} 
                            checked={!!row.active}
                            onChange={() => handleActiveChange(row.variant, row.batchId || row.id)}
                          />

                    ) : readOnlyColumns.includes(col) ? (
                      <input
                        type="text"
                        value={row[col] ?? ""}
                        readOnly
                        disabled
                        className="bg-gray-100 text-gray-600 rounded px-1 py-1 text-xs w-full"
                      />
                    ) : (
                      <input
                          type="text"
                          value={row[col] ?? ""}
                          onChange={(e) => {
                            let value = e.target.value;
                            // Prevent spaces if column is variant
                            if (col === "variant") {
                              value = value.replace(/\s+/g, "");
                            }
                            handleInputChange(rowIndex, col, value);
                          }}
                          className="rounded px-1 py-1 text-xs w-full"
                        />  
                    )
                    }
                  </td>
                ))}
                <td className="border border-gray-300 p-2 text-center">
                  <button
                    onClick={() => handleDeleteRow(rowIndex)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex gap-4 justify-start px-4">
        <button
          onClick={addRow}
         className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Add Row
        </button>
      </div>
    </div>
  );
};

/* ----------------- Page ----------------- */

export default function Page() {
  const { id } = useParams();
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    subCategory: "",
    // alias: "",
    details: "",
    brand: "",
    code: "",
    alert: "",
    description: "",
    category: "",
    status: true,
    thumbnail: null, // { file?, preview, url? }
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    bannerImages: [], // array of { file?, preview, url? }
    type: [createEmptyRow(1)],
  });

  /* ----------------- useEffect ----------------- */
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const res = await axios.get(
          `https://thajanwar.onrender.com/products/${id}`
        );
        const product = res.data;

        let idCounter = 1;
        const rows = [];
        if (product.type && product.type.length > 0) {
          product.type.forEach((variant) => {
            if (variant.batches && variant.batches.length > 0) {
              variant.batches.forEach((batch, batchIndex) => {
                rows.push({
                  id: idCounter++,
                  batchId:
                    batch.batchId ||
                    batch._id ||
                    `BATCH-${idCounter}-${batchIndex}`,
                  variant: variant.variant || "",
                  stock: batch.stock ?? "",
                  mrp_price: batch.mrp_price ?? "",
                  cost_price: batch.cost_price ?? "",
                  selling_price: batch.selling_price ?? "",
                  gst_percent: batch.gst_percent ?? "",
                  gst_amount: batch.gst_amount ?? "",
                  profit: batch.profit ?? "",
                  amt:
                    batch.cost_price && batch.stock
                      ? (batch.cost_price * batch.stock).toFixed(2)
                      : "",
                  net_cost: batch.net_cost ?? "",
                  net_amt: batch.net_amt ?? "",
                  active:
                    typeof batch.active === "boolean"
                      ? batch.active
                      : batchIndex === 0,
                });
              });
            } else {
              rows.push({
                id: idCounter++,
                batchId:
                  variant.batchId ||
                  variant._id ||
                  `BATCH-${idCounter}-0`,
                variant: variant.variant || "",
                stock: variant.stock ?? "",
                mrp_price: variant.mrp_price ?? "",
                cost_price: variant.cost_price ?? "",
                selling_price: variant.selling_price ?? "",
                gst_percent: variant.gst_percent ?? "",
                gst_amount: variant.gst_amount ?? "",
                profit: variant.profit ?? "",
                amt:
                  variant.cost_price && variant.stock
                    ? (variant.cost_price * variant.stock).toFixed(2)
                    : "",
                net_cost: variant.net_cost ?? "",
                net_amt: variant.net_amt ?? "",
                active:
                  typeof variant.active === "boolean"
                    ? variant.active
                    : true,
              });
            }
          });
        }

        // Normalize rows: only one active per variant
        const groupedByVariant = rows.reduce((acc, r) => {
          const key = r.variant || "__no_variant__";
          (acc[key] = acc[key] || []).push(r);
          return acc;
        }, {});

        const normalizedRows = [];
        Object.values(groupedByVariant).forEach((group) => {
          const firstActiveIndex = group.findIndex((r) => r.active);
          if (firstActiveIndex === -1) group[0].active = true;
          else
            group.forEach((r, i) => (r.active = i === firstActiveIndex));
          normalizedRows.push(...group);
        });

        setFormData((prev) => ({
          ...prev,
          name: product.name || "",
          description: product.description || "",
          brand: product.brand || "",
          details: product.details || "",
          subCategory: product.subCategory || "",
          category: product.category || "",
          seo_title: product.seo_title || "",
          alias:product.alias|| "",
          seo_description: product.seo_description || "",
          thumbnail: product.productImg
            ? { preview: product.productImg, url: product.productImg }
            : null,
          bannerImages: (product.bannerImgs || []).map((img) => ({
            preview: img,
            url: img,
          })),
          statusActive: product.statusActive ?? true,
          type:
            normalizedRows.length > 0
              ? normalizedRows
              : [createEmptyRow(1)],
        }));
      } catch (error) {
        console.error("❌ Error fetching product:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get("https://thajanwar.onrender.com/api/admin/categories");
        setCategories(res.data);
      } catch (error) {
        console.error("❌ Failed to fetch categories", error);
      }
    };

    fetchCategories();
    if (id) fetchProductData();
  }, [id]);

  /* ----------------- Upload Helper ----------------- */
  const uploadImage = async (files) => {
    if (!Array.isArray(files)) {
      files = [files];
    }

    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("img", file);

        const res = await fetch("https://thajanwar.onrender.com/new/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!res.ok) throw new Error("Image upload failed");
        const result = await res.json();
        return Array.isArray(result.imageUrls)
          ? result.imageUrls[0]
          : result.imageUrls;
      })
    );

    return uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls;
  };

  /* ----------------- Handlers ----------------- */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        thumbnail: {
          file,
          preview: URL.createObjectURL(file),
        },
      }));
    }
  };

  const handleUploadProductImage = (e) => {
    const files = Array.from(e.target.files);
    const maxAllowed = 10;
    const remainingSlots = maxAllowed - formData.bannerImages.length;

    if (remainingSlots <= 0) {
      alert("You can only upload up to 10 banner images.");
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    const filesWithPreview = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({
      ...prev,
      bannerImages: [...prev.bannerImages, ...filesWithPreview],
    }));
  };

  const handleRemoveProductImage = (index) => {
    setFormData((prev) => {
      const updated = [...prev.bannerImages];
      updated.splice(index, 1);
      return { ...prev, bannerImages: updated };
    });
  };

  const handlesubCategoryUpdate = async () => {
    try {
      await axios.put(`https://thajanwar.onrender.com/products/${id}`, {
        subCategory: formData.subCategory,
      });
      console.log("Subcategory updated!");
    } catch (err) {
      console.error(
        "Failed to update subcategory:",
        err.response?.data || err.message
      );
    }
  };

  /* ----------------- Submit ----------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Upload thumbnail
      let thumbnailUrl = formData.thumbnail?.url || null;
      if (formData.thumbnail?.file) {
        thumbnailUrl = await uploadImage(formData.thumbnail.file);
      }

      // Upload banner images
      const bannerUrls = await Promise.all(
        formData.bannerImages.map(async (img) => {
          if (img.file) return await uploadImage(img.file);
          return img.url;
        })
      );

      // Batch logic
      const batchCodeMap = new Map();
      const getBatchCode = (n) => {
        let code = "";
        while (n >= 0) {
          code = String.fromCharCode((n % 26) + 65) + code;
          n = Math.floor(n / 26) - 1;
        }
        return code + "1";
      };

      const rowsWithBatchId = (formData.type || []).map((row) => {
        const key = row.variant;
        const count = batchCodeMap.get(key) || 0;
        const batchCode = getBatchCode(count);
        batchCodeMap.set(key, count + 1);
        return { ...row, batchId: batchCode };
      });

      const groupedVariants = {};
      rowsWithBatchId.forEach((row) => {
        const key = row.variant;
        if (!groupedVariants[key])
          groupedVariants[key] = {
            id: Object.keys(groupedVariants).length + 1,
            variant: row.variant,
            offer_price: row.offer_price || 0,
            batches: [],
          };
        groupedVariants[key].batches.push({
          batchId: row.batchId,
          active: row.active ?? false,
          cost_price: parseFloat(row.cost_price) || 0,
          selling_price: parseFloat(row.selling_price) || 0,
          mrp_price: parseFloat(row.mrp_price) || 0,
          gst_percent: parseFloat(row.gst_percent) || 0,
          gst_amount: parseFloat(row.gst_amount) || 0,
          profit: parseFloat(row.profit) || 0,
          stock: parseFloat(row.stock) || 0,
          net_cost: parseFloat(row.net_cost) || 0,
          net_amt: parseFloat(row.net_amt) || 0,
          units_sold: parseInt(row.units_sold) || 0,
        });
      });

      Object.values(groupedVariants).forEach((variantGroup) => {
        const activeIndex = variantGroup.batches.findIndex(
          (b) => b.active
        );
        if (activeIndex === -1) variantGroup.batches[0].active = true;
        else
          variantGroup.batches.forEach(
            (b, i) => (b.active = i === activeIndex)
          );
      });

      const payload = {
        name: formData.name,
        description: formData.description,
        alias: formData.alias,
        brand: formData.brand,
        details: formData.details,
        subCategory: formData.subCategory,
        category: formData.category,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        productImg: thumbnailUrl,
        bannerImgs: bannerUrls,
        status: formData.statusActive,
        type: Object.values(groupedVariants),
      };
      console.log(payload)

      const response = await fetch(
        `https://thajanwar.onrender.com/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("✅ Product updated successfully!");
        setFormData((prev) => ({
          ...prev,
          thumbnail: { url: thumbnailUrl, preview: thumbnailUrl },
          bannerImages: bannerUrls.map((url) => ({
            url,
            preview: url,
          })),
        }));
      } else throw new Error(result.message || "Failed to update product");
    } catch (err) {
      console.error("❌ Error saving product:", err);
      alert("Failed to save product.");
    }
  };
  if (!formData.name)
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

  /* ----------------- Render ----------------- */
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
        <div className="order-container">
          <h2 className="title">View Products</h2>
          <div className="order-sections">
            {/* Product Info */}
            <div className="order-summary box1">
                <div className="sub">
                  <h3>Product info & Upload images</h3>
                </div>

              {formData.thumbnail?.preview && (
                <img
                  src={formData.thumbnail.preview}
                  alt="Thumbnail"
                  className="w-32 h-32 object-contain rounded"
                />
              )}

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={formData.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder=""
                />
                <label>Product Name</label>
              </div>

              <div className="floating-label-input">
                <label className="input-heading">Choose Category</label>
                <select
                  className="styled-input2"
                  value={formData.category}
                  onChange={(e) =>
                    updateField("category", e.target.value)
                  }
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.categories_name}>
                      {cat.categories_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  value={formData.subCategory}
                  onChange={(e) =>
                    updateField("subCategory", e.target.value)
                  }
                  onBlur={handlesubCategoryUpdate}
                />
                <label>Sub Category</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  value={formData.brand}
                  onChange={(e) =>
                    updateField("brand", e.target.value)
                  }
                />
                <label>Brand</label>
              </div>
                 <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  value={formData.alias}
                  onChange={(e) =>
                    updateField("alias", e.target.value)
                  }
                />
                <label>Alias</label>
              </div>

               <div className="floating-textarea">
                    <textarea
                      className="styled-textarea"
                      type="textarea"
                      placeholder=" "
                      required
                      value={formData.details}
                      onChange={(e) => {
                        updateField("details", e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      rows={1}
                    />
                    <label>Product Details</label>
                  </div>

              <div className="floating-textarea">
                    <textarea
                      className="styled-textarea"
                      placeholder=" "
                      required
                      value={formData.description}
                      onChange={(e) => {
                        updateField("description", e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      rows={1}
                    />
                    <label>Description</label>
                  </div>


              <label className="custom-upload-btn">
                <div className="upload-label">
                  <p className="thumbnail">Upload Thumbnail</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  style={{ display: "none" }}
                />
              </label>

              <label className="custom-upload-btn">
                <div className="upload-label">
                  <p className="thumbnail">Upload Product Images</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUploadProductImage}
                  style={{ display: "none" }}
                />
              </label>

              <div className="preview-container">
                {formData.bannerImages?.map((banner, index) => (
                  <div key={index} className="relative">
                    <img
                      src={banner.preview || banner.url}
                      alt={`Banner ${index}`}
                      className="w-32 h-20 object-contain rounded"
                    />
                    <span
                      className="remove absolute top-0 right-0 bg-red-500 text-white cursor-pointer px-1 "
                      onClick={() =>
                        handleRemoveProductImage(index)
                      }
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SEO Info */}
            <div className="product-breakdown box1">
              <h3 className="sub">Product and status</h3>
              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  value={formData.seo_title}
                  onChange={(e) =>
                    updateField("seo_title", e.target.value)
                  }
                />
                <label>Meta Title</label>
              </div>
              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  value={formData.seo_description}
                  onChange={(e) =>
                    updateField("seo_description", e.target.value)
                  }
                />
                <label>Meta Description</label>
              </div>
              <h4>Status</h4>
              <div className="toggle-wrapper">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formData.statusActive}
                    onChange={() =>
                      updateField(
                        "statusActive",
                        !formData.statusActive
                      )
                    }
                  />
                  <span className="slider">
                    <span
                      className={`toggle-text ${
                        formData.statusActive
                          ? "active"
                          : "inhidden"
                      }`}
                    >
                      {formData.statusActive ? "Active" : "Hidden"}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Editable Table */}
            <EditableTable
              formData={formData}
              setFormData={setFormData}
            />

            <div className="save_btn">
            <button className="productsave" onClick={handleSubmit}>
              Save Product
            </button>
          </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
