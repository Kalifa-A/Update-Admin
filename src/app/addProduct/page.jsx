"use client";

import React,{ useState ,useEffect} from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import './page.css'

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

// Sortable image component
function SortableImage({ src, id, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

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
        className="absolute top-2 right-2 text-red  rounded-full w-6 h-6 flex items-center justify-center text-sm cursor-pointer"
      >
        &times;
      </button>
    </div>
  );
}

let batchCounter = 0;

export const createEmptyRow = (id) => ({
  id,
  variant: "",
  stock: "",
  cost_price: "",
  selling_price: "",
  mrp_price: "",
  gst_percent: "",
  gst_amount: "",
  profit: "",
  amt: "",
  net_cost: "",
  net_amt: "",
  batchId: "", // auto-generated, not shown
});
// Banner modal component
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
          <button onClick={onClose} className="text-red-600 font-bold text-xl cursor-pointer">
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
  "active", // New column added
];

const readOnlyColumns = [
  "id",
  "gst_amount",
  "profit",
  "amt",
  "net_cost",
  "net_amt",
];

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

  const handleActiveChange = (rowIndex, variant) => {
    setFormData((prev) => {
      const newRows = prev.type.map((row, index) => {
        if (row.variant === variant) {
          return {
            ...row,
            active: index === rowIndex,
          };
        }
        return row;
      });
      return { ...prev, type: newRows };
    });
  };

  const createEmptyRow = (id) => ({
    id,
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
                  {col === "gst"
                    ? "GST (%) + Amt"
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
                    {col === "gst" ? (
                      <div className="flex gap-1 justify-center">
                        <input
                          type="text"
                          placeholder="%"
                          value={row.gst_percent ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              rowIndex,
                              "gst_percent",
                              e.target.value
                            )
                          }
                          className="w-[45px] rounded px-1 py-1 text-xs border-gray-300"
                        />
                        <input
                          type="text"
                          placeholder="Amt"
                          value={row.gst_amount ?? ""}
                          readOnly
                          disabled
                          className="w-[45px] rounded px-1 py-1 text-xs border-gray-300 bg-gray-100 text-gray-600"
                        />
                      </div>
                    ) : col === "active" ? (
                      <input
                        type="radio"
                        checked={row.active === true}
                        onChange={() =>
                          handleActiveChange(rowIndex, row.variant)
                        }
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
                    )}
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
export default function Page() {
  
 const [formData, setFormData] = useState({
  name: "",
  subCategory:"",
  alias:"",
  details:'',
  brand:'',
  code:'',
  alert:'',
  description: "",
  category:"",
  status: true,
  previewUrl: "",
  thumbnailFile: null,
  thumbnailPreview: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  bannerImages: [],     // array of { file, preview }
  bannerPreviews: [],   // array of preview URLs (strings)
  type: [createEmptyRow(1)],  // your initial table rows state
});



  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [CategoriesDetails, setTheCatgories] = useState([]);
  
    useEffect(() => {
      const getThedetails = async () => {
        const res = await fetch("https://thajanwar.onrender.com/api/admin/categories", {
          cache: "no-store",
        });
        const orders = await res.json();
        setTheCatgories(orders);
      };
      getThedetails();
    }, []);

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};



const handleToggleChange = () => {
  setFormData((prev) => ({
    ...prev,
    status: prev.status === true ? false : true,
  }));
};


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        thumbnailFile: file,
        thumbnailPreview: URL.createObjectURL(file),
      }));
    }
  };


  const handleBannerImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxAllowed = 10;
    const remainingSlots = maxAllowed - formData.bannerPreviews.length;

    if (remainingSlots <= 0) {
      alert("You can only upload up to 10  banner images.");
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
      bannerPreviews: [...prev.bannerPreviews, ...filesWithPreview.map((f) => f.preview)],
    }));
  };

const uploadImage = async (files) => {
  if (!Array.isArray(files)) {
    files = [files]; // wrap single file into array
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
      console.log("Uploaded Image URL:", result.imageUrls);
     return Array.isArray(result.imageUrls) ? result.imageUrls[0] : result.imageUrls;    })
  );

return uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls;

};




 const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  setMessage("");

  try {
const productImageUrl = await uploadImage(formData.thumbnailFile);
// Multiple
const bannerImageUrls = await uploadImage(formData.bannerImages.map(b => b.file));

    // 3. Convert keys with spaces to snake_case
    const convertKeys = (obj) =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k.replace(/\s+/g, "_"), v])
      );

    // 4. Validate each row
    const isValidRow = (row, index) => {
      const requiredFields = ["variant", "stock", "cost_price", "selling_price"];
      for (const field of requiredFields) {
        if (!row[field] || row[field].toString().trim() === "") {
          throw new Error(`Row ${index + 1}: "${field}" is required.`);
        }
        if (["stock", "cost_price", "selling_price"].includes(field)) {
          const num = parseFloat(row[field]);
          if (isNaN(num) || num < 0) {
            throw new Error(`Row ${index + 1}: "${field}" must be a valid number ≥ 0.`);
          }
        }
      }
      const profit = parseFloat(row.profit);
      if (isNaN(profit) || profit < 0) {
        throw new Error(`Row ${index + 1}: Profit cannot be negative.`);
      }
      return true;
    };

  const rawRows = (formData.type || []).map((row, index) => {
  const cleaned = convertKeys(row);
  isValidRow(cleaned, index); // Will throw if invalid
  return cleaned;
});


const batchCodeMap = new Map(); // Key: variant, Value: count

const getBatchCode = (n) => {
  let code = "";
  while (n >= 0) {
    code = String.fromCharCode((n % 26) + 65) + code;
    n = Math.floor(n / 26) - 1;
  }
  return code;
};
// STEP 1: Assign unique batchId to each row
const rowsWithBatchId = rawRows.map((row) => {
  const key = row.variant;
  const count = batchCodeMap.get(key) || 0;
  const batchCode = getBatchCode(count) + "1"; // e.g., A1, B1...
  batchCodeMap.set(key, count + 1);
  return { ...row, batchId: batchCode };
});

// STEP 2: Group by variant and add batches
const groupedVariants = {};

rowsWithBatchId.forEach((row) => {
  const key = row.variant;

  if (!groupedVariants[key]) {
    groupedVariants[key] = {
      id: Object.keys(groupedVariants).length + 1,
      variant: row.variant,
      batches: [],
    };
  }

  groupedVariants[key].batches.push({
    batchId: row.batchId,
    active: false, // default to false for now
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

// STEP 3: Set the first batch in each variant as active
Object.values(groupedVariants).forEach((variantGroup) => {
  if (variantGroup.batches.length > 0) {
    variantGroup.batches[0].active = true;
  }
});

// STEP 4: Convert object to array
const groupedVariantsArray = Object.values(groupedVariants);

// STEP 5: Final payload
const payload = {
  name: formData.name,
  alias: formData.alias,
  subCategory: formData.subCategory,
  brand: formData.brand,
  description: formData.description,
  details: formData.details,
  category: formData.category,
  status: formData.status,
productImg: Array.isArray(productImageUrl)
        ? productImageUrl[0]
        : productImageUrl,
  bannerImgs: bannerImageUrls,
  seo_title: formData.seo_title,
  seo_description: formData.seo_description,
  seo_keywords: formData.seo_keywords,
  type: groupedVariantsArray, // Contains variants with active batches
};

console.log("Grouped Variants Array:", groupedVariantsArray);
console.log("Final Payload:", payload);


    // 8. Send to backend
    const res = await fetch("https://thajanwar.onrender.com/products/addProduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" ,        Authorization: `Bearer ${localStorage.getItem("token")}`
 },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to add product");

    setMessage("✅ Product added successfully!");

    // 9. Reset form
    
  } catch (error) {
    setMessage("❌ Error: " + error.message);
  } finally {
    setSaving(false);
  }
};
console.log("Description:", formData.description);
 console.log(formData.category)

  return (<SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
<div className="w-[98%] overflow-x-auto p-4 mt-4 md:mt-10 mx-2 bg-white shadow rounded-lg box-border ">
          <h1 className="text-xl font-semibold mb-4">Add Product</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Container for Left + Right sections */}
           <div className="flex flex-col lg:flex-row gap-6 w-full">
              {/* Left Section */}
<div className="w-[40%]  ml-0 max-w-full gap-2" >
                {formData.thumbnailPreview && (
                  <img
                    src={formData.thumbnailPreview}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded border"
                    style={{ objectFit: 'contain' }}
                  />
                )}

               
                  <div className="floating-label-input animated-input">
                <input
                  name="name"
                  type="text"
                  className=" border p-2 rounded-xl w-full"
                  placeholder=" "
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <label>Product Name</label>
          </div> 
                  

                 <div className="floating-label-input animated-input">
                <input
                  name="alias"
                  type="text"
                  className=" border p-2 rounded-xl w-full"
                  placeholder=" "
                  required
                  value={formData.alias}
                  onChange={handleInputChange}
                />
                <label>Alias</label>
          </div>
                 

                 <div className="floating-label-input animated-input">
                <input
                  name="subCategory"
                  type="text"
                  className=" border p-2 rounded-xl w-full"
                  placeholder=" "
                  required
                  value={formData.subCategory}
                  onChange={handleInputChange}
                />
                <label>Sub Category</label>
          </div>

           <div className="floating-label-input animated-input">
                <input
                  name="brand"
                  type="text"
                  className=" border p-2 rounded-xl w-full"
                  placeholder=" "
                  required
                  value={formData.brand}
                  onChange={handleInputChange}
                />
                 <label>Brand </label>
          </div>
                
               <select
  name="category"
  value={formData.category}
  onChange={handleInputChange}
  required
                  className=" border p-2 rounded-xl w-full mb-4" 
>
  <option value="" disabled>Select a Category</option>
  {CategoriesDetails.map((each) => (
    <option key={each._id} value={each.categories_name}>
      {each.categories_name}
    </option>
  ))}
</select>



                 

                <textarea
                name="description"
                  value={formData.description}

                  onChange={handleInputChange}
                  placeholder="Description"
                  required
                  className="border p-2 rounded-xl w-full mb-4"
                />

                <textarea
  name="details"
  rows={6}
  value={formData.details}
                  onChange={handleInputChange}
  placeholder="Enter full product details..."
                    className="border p-2 rounded-xl w-full"

/>

              
              
              </div>

              {/* Right Section */}
<div className="w-[40%] lg:ml-[120px] ml-0 max-w-full" >

<div>
    <label className="custom-upload-btn">
            <div className="upload-label">
              <p className="thumbnail">Upload Thumbnail</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>
          
</div>
<div>
            <label className="custom-upload-btn">
            <div className="upload-label">
              <p className="thumbnail">Upload Product image</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
                  onChange={handleBannerImageChange}
              style={{ display: "none" }}
            />
          </label>
          </div>
            {formData.bannerPreviews.length >= 10 && (
                  <p className="text-red-500 text-sm mt-1">
                    Maximum 4 banner images allowed.
                  </p>
                )}
                {formData.bannerPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.bannerPreviews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Banner ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded border cursor-pointer"
                        onClick={() => setIsBannerModalOpen(true)}
                      />
                    ))}
                  </div>
                )}
 
                
                <div className="mb-4">
    <div className="floating-label-input animated-input">
                <input
                  name="seo_title"
                  type="text"
                  className=" border p-2 rounded-xl w-full   max-w-[380px]"
                  placeholder=" "
                  required
                  value={formData.seo_title}
                  onChange={handleInputChange}
                />
                 <label>SEO Title </label>
          </div>
          </div>
                <div className="mb-4">
           <div className="floating-label-input animated-input">
                <input
                  name="seo_description"
                  type="text"
                  className=" border p-2 rounded-xl w-full  max-w-[380px]"
                  placeholder=" "
                  required
                  value={formData.seo_description}
                  onChange={handleInputChange}
                />
                 <label>SEO Description</label>
          </div>
          </div>
               
           <div className="floating-label-input animated-input">
                <input
                  name="seo_keywords"
                  type="text"
                  className=" border p-2 rounded-xl w-full  max-w-[380px]"
                  placeholder=" "
                  required
                  value={formData.seo_keywords}
                  onChange={handleInputChange}
                />
                 <label>SEO Keywords</label>
          </div>
                
<div>



 <h4>Status</h4>
              <div className="toggle-wrapper">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formData.status === true}
      onChange={handleToggleChange}
                  />
                  <span className="slider">
                    <span
                      className={`toggle-text ${
                        formData.status === true ? "active" : "inhidden"
                      }`}
                    >
                      {formData.status === true ? "Active" : "Hidden"}
                    </span>
                  </span>
                </label>
              </div>


   
                </div>
              
              </div>
           

            </div>

            {/* Submit Button */}
           
          </form>
        </div>
           <div className="overflow-x-auto">
<EditableTable formData={formData} setFormData={setFormData} />  
      </div>
       <button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="bg-black text-white px-4 py-2 rounded-[2px]  hover:bg-gray-700 disabled:opacity-50 max-w-[250px] w-full mx-auto transition-all duration-300"
            >
              {saving ? "Saving..." : "Add Product"}
            </button>

            {/* Message */}
            {message && (
              <div
                className={`text-sm ${
                  message.startsWith("✅") ? "text-green-600" : "text-red-600"
                }`}
              >
                {message}
              </div>
            )}

        {/* Banner Modal */}
        <BannerModal
          isOpen={isBannerModalOpen}
          onClose={() => setIsBannerModalOpen(false)}
          banners={formData.bannerPreviews}
          setFormData={setFormData}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
