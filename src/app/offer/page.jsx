"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import "./page.css";
import ProtectedRoute from "@/components/ProtectedRoute";



const OfferDetails = () => {
  const [selectedType, setSelectedType] = useState("category");
  const [productSearch, setProductSearch] = useState("");
  const [showOnHomepage, setShowOnHomepage] = useState(false);
  const [products, setProducts] = useState([]);
  const [statusActive, setStatusActive] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductVariants, setSelectedProductVariants] = useState([]); // variants for clicked product
  const [selectedVariants, setSelectedVariants] = useState([]); // ids of chosen variants
  const [categoryData, setCategoryData] = useState('');
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]); // array of selected products
  const [selectedProductVariantsMap, setSelectedProductVariantsMap] = useState({}); 
// key: productId, value: array of selected variantIds
  const [activeProductId, setActiveProductId] = useState(null);




  const [formData, setFormData] = useState({
    bannerImages: [], // array of { file, preview }
    bannerPreviews: [], // array of preview URLs
  });

  const [offerData, setOfferData] = useState({
    name: "",
    offerCategory: "",
    offerType: "",
    discountValue: "",
    description: "",
    startDate: "",
    endDate: "",
  });

        console.log("📤 Offe:", categoryData);


  useEffect(() => {
    axios
      .get("https://thajanwar.onrender.com/products/all")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));

    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://thajanwar.onrender.com/api/categories");
      console.log(res.data)

      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
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

  const handleRemove = (index) => {
    setFormData((prev) => {
      const newBannerImages = prev.bannerImages.filter((_, i) => i !== index);
      const newBannerPreviews = prev.bannerPreviews.filter((_, i) => i !== index);

      // revoke objectURL to avoid memory leak
      try {
        URL.revokeObjectURL(prev.bannerPreviews[index]);
      } catch (e) {}

      return {
        ...prev,
        bannerImages: newBannerImages,
        bannerPreviews: newBannerPreviews,
      };
    });
  };

const handleProductClick = (product) => {
  const exists = selectedProducts.find(p => p._id === product._id);

  if (exists) {
    // Deselect product
    setSelectedProducts(prev => prev.filter(p => p._id !== product._id));
    setSelectedProductVariantsMap(prev => {
      const copy = { ...prev };
      delete copy[product._id];
      return copy;
    });

    if (activeProductId === product._id) {
      setActiveProductId(null);
    }
  } else {
    // Before selecting new product, check if the previous active product has variants selected
    if (activeProductId && (!selectedProductVariantsMap[activeProductId] || selectedProductVariantsMap[activeProductId].length === 0)) {
      // Auto-deselect previous active product (no variants chosen)
      setSelectedProducts(prev => prev.filter(p => p._id !== activeProductId));
      setSelectedProductVariantsMap(prev => {
        const copy = { ...prev };
        delete copy[activeProductId];
        return copy;
      });
    }

    // Add new product and make it active
    setSelectedProducts(prev => [...prev, product]);
    setSelectedProductVariantsMap(prev => ({ ...prev, [product._id]: [] }));
    setActiveProductId(product._id);
  }
};




  const handleOfferChange = (field, value) => {
    setOfferData((prev) => ({ ...prev, [field]: value }));
  };

const handleVariantToggle = (productId, variantId) => {
  setSelectedProductVariantsMap(prev => {
    const currentVariants = prev[productId] || [];
    const updatedVariants = currentVariants.includes(variantId)
      ? currentVariants.filter(v => v !== variantId)
      : [...currentVariants, variantId];
    return { ...prev, [productId]: updatedVariants };
  });
};

const handleRemoveProduct = (productId) => {
  setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  setSelectedProductVariantsMap((prev) => {
    const copy = { ...prev };
    delete copy[productId];
    return copy;
  });
  if (activeProductId === productId) setActiveProductId(null);
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

const handleSaveOffer = async () => {
  try {
    // Basic validation
    if (!offerData.name || !offerData.offerCategory) {
      alert("Please fill the offer title and category.");
      return;
    }

    let bannerImageUrls = "";

    if (formData.bannerImages.length > 0) {
      const files = formData.bannerImages.map((b) => b.file);
      const res = await uploadImage(files);
      console.log("Uploaded Image URLs:", res);

      // Convert the array of URLs to a comma-separated string
      bannerImageUrls = Array.isArray(res) ? res.join(",") : res;
    }

    // Build variantTargets inside the function (fixes ReferenceError)
    const variantTargets = selectedProducts.flatMap((product) => {
      const productId = product._id || product.id;
      const variants = selectedProductVariantsMap[productId] || [];
      return variants.map((variantId) => ({ productId, variantId }));
    });

    const payload = {
      name: offerData.name,
      offerCategory: offerData.offerCategory,
      offerType: offerData.offerType || "flat",
      discountValue: Number(offerData.discountValue) || 0,
      description: offerData.description,
      startDate: offerData.startDate,
      endDate: offerData.endDate,
      categories: categoryData ? categoryData : '',
      variantTargets,
      isActive: statusActive,
      image: bannerImageUrls,
    };

    console.log("📤 Offer payload:", payload);

    const res = await axios.post(
      "https://thajanwar.onrender.com/offer",
      payload,
      {
        headers: { authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );

    console.log("✅ Offer saved:", res.data);
    alert("Offer saved successfully");
  } catch (err) {
    console.error("❌ Error saving offer:", err);
    alert("Error saving offer. Check console for details.");
  }
};

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );


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

        <div className="offer-container">
          <h2 className="title">Add Offers & Highlights</h2>

          <div className="offer-sections">
            {/* Offer Info */}
            <div className="offer-summary box1">
              <h3 style={{ fontWeight: "bold" }}>Offer Information</h3>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  value={offerData.name}
                  onChange={(e) => handleOfferChange("name", e.target.value)}
                />
                <label>Offer Title</label>
              </div>

              <div className="floating-label-input">
                <label className="input-heading">Offer Type</label>
                <select
                  className="styled-input2"
                  value={offerData.offerCategory}
                  onChange={(e) => handleOfferChange("offerCategory", e.target.value)}
                >
                  <option value="">---------</option>
                  <option value="ad_banner">Ad_banner</option>
                  <option value="highlight">Highlights Products</option>
                  <option value="deal_of_the_day">Deal of the day</option>
                </select>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  value={offerData.description}
                  onChange={(e) => handleOfferChange("description", e.target.value)}
                />
                <label>Short Description</label>
              </div>

              <div className="floating-label-input">
                <label className="input-heading">Offer Discount</label>
                <select
                  className="styled-input2"
                  value={offerData.offerType}
                  onChange={(e) => handleOfferChange("offerType", e.target.value)}
                >
                  <option value="">---------</option>
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  type="number"
                  className="styled-input"
                  placeholder=" "
                  required
                  value={offerData.discountValue}
                  onChange={(e) => handleOfferChange("discountValue", e.target.value)}
                />
                <label>Offer Price per Product</label>
              </div>
            </div>

            {/* Offer Timing & Status */}
            <div className="product-breakdown box2">
              <h3 style={{ fontWeight: "bold" }}>Offer Timing & Status</h3>

              <div className="floating-label-input animated-input">
                  <input
                    type="date"
                    className="styled-input"
                    value={offerData.startDate}
                    onChange={(e) => handleOfferChange("startDate", e.target.value)}
                  />
                  <label>Start Date & Time</label>
                </div>

                <div className="floating-label-input animated-input">
                  <input
                    type="date"
                    className="styled-input"
                    value={offerData.endDate}
                    min={offerData.startDate || ""} // <-- restrict end date
                    onChange={(e) => handleOfferChange("endDate", e.target.value)}
                  />
                  <label>End Date & Time</label>
                </div>


              <h4>Status</h4>
              <div className="toggle-wrapper">
                <label className="switch">
                  <input type="checkbox" checked={statusActive} onChange={() => setStatusActive(!statusActive)} />
                  <span className="slider">
                    <span className={`toggle-text ${statusActive ? "active" : "inhidden"}`}>
                      {statusActive ? "Active" : "Hidden"}
                    </span>
                  </span>
                </label>
              </div>

              {offerData.offerCategory === "ad_banner" && (
                <div className="mt-4">
                  <label className="custom-upload-btn">
                    <div className="upload-label">
                      <p className="thumbnail">Upload Product image</p>
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleBannerImageChange} style={{ display: "none" }} />
                  </label>

                  {formData.bannerPreviews.length >= 10 && (
                    <p className="text-red-500 text-sm mt-1">Maximum 10 banner images allowed.</p>
                  )}

                  {formData.bannerPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {formData.bannerPreviews.map((src, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img
                            src={src}
                            alt={`Banner ${idx + 1}`}
                            className="w-24 h-24 object-contain rounded border cursor-pointer"
                            onClick={() => setIsBannerModalOpen(true)}
                          />
                          <button onClick={() => handleRemove(idx)} style={{ position: "absolute", top: 0, right: 0 }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product or Category Link */}
            <div className="order-summary box3">
              <h3 className="product_title">Product or Category Link</h3>

              <div className="radio-group">
                <label>
                  <input className="cat_pro" type="radio" name="linkType" value="category" checked={selectedType === "category"} onChange={(e) => setSelectedType(e.target.value)} />
                  Category
                </label>

                <label style={{ marginLeft: "20px" }}>
                  <input type="radio" name="linkType" value="product" checked={selectedType === "product"} onChange={(e) => setSelectedType(e.target.value)} />
                  Product
                </label>
              </div>

              {/* Category Section */}
              {selectedType === "category" && (
                <div className="floating-label-input Category category-center">
                  <label className="input-heading2">Choose Category</label>
                      <select
                        className="styled-input2"
                        value={categoryData}
                        onChange={(e) => setCategoryData(e.target.value)}
                        style={{ width: "30%" }}
                      >
                    <option value="">--- Select Category ---</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.slug}>
                        {cat.categories_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Section */}
                    {selectedType === "product" && (
                      <div className="product-section">
                        <h3 className="product_title">Select Products</h3>

                        {/* Search bar */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                          <div className="floating-label-input animated-input" style={{ width: "50%", marginLeft: "135px" }}>
                            <input
                              type="text"
                              className="styled-input"
                              placeholder=" "
                              required
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                            />
                            <label>Search Product</label>
                          </div>
                        </div>

              {/* Selected Products & Variants */}
              <h3 className="product_title">Selected Products & Variants</h3>
              <div className="product-variant-options">
                {selectedProducts.length > 0 ? (
                  selectedProducts.map((product) => (
                    <div key={product._id} style={{ marginBottom: "15px" }}>
                      {activeProductId === product._id && (
                        <>
                          <p
                            style={{
                              fontWeight: "bold",
                              backgroundColor: "#f0f0f0",
                              color: "#333",
                              padding: "6px 10px",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                          >
                            {product.name.length > 15 ? product.name.slice(0, 15) : product.name}
                          </p>

                          {product.type && product.type.length > 0 ? (
                            <ul className="Checkbox_ulist">
                              {product.type.map((t) => {
                                const variantId = t.id ?? t._id ?? t.variantId;
                                const isSelected =
                                  selectedProductVariantsMap[product._id]?.includes(variantId);

                                return (
                                  <li
                                    key={variantId}
                                    className={isSelected ? "selected" : ""}
                                    onClick={() => handleVariantToggle(product._id, variantId)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <p>{t.variant}</p>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p style={{ fontStyle: "italic", color: "gray" }}>
                              No variants available for this product.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontStyle: "italic", color: "gray" }}>
                    Click products below to select them and view variants.
                  </p>
                )}
              </div>
                    {/* Selected Products Table */}
<h3 className="product_title">Selected Products Table</h3>

<table className="w-auto border-collapse text-sm rounded table-poppins"  style={{ fontFamily: "Poppins,sans-serif" }}>
  <thead>
    <tr className="text-left">
      <th className="px-3 py-2">#</th>
      <th className="px-3 py-2">Product</th>
      <th className="px-3 py-2">Selected Variants</th>
      <th className="px-3 py-2">Actions</th>
    </tr>
  </thead>

  <tbody>
    {selectedProducts.length === 0 ? (
      <tr>
        <td colSpan={4} className="px-3 py-4 italic text-gray-500">
          No products selected. Click a product to add it here.
        </td>
      </tr>
    ) : (
      selectedProducts.map((prod, index) => {
        const selectedVariantIds = selectedProductVariantsMap[prod._id] ?? [];
        // map variant ids back to their display text (guard if variant object shape differs)
        const selectedVariantNames =
          (prod.type ?? [])
            .filter((v) => {
              const vid = v.id ?? v._id ?? v.variantId;
              return selectedVariantIds.includes(vid);
            })
            .map((v) => v.variant ?? v.name ?? v.title) || [];

        return (
          <tr key={prod._id} className="align-top">
            <td className="px-3 py-2">{index + 1}</td>

            <td className="px-3 py-2 flex items-center gap-3">
              <img
                src={prod.productImg}
                alt={prod.name}
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
              />
              <div>
                <div className="font-medium">
                  {prod.name.length > 20 ? prod.name.slice(0, 20) + "..." : prod.name}
                </div>
                <div className="text-xs text-gray-500">ID: {prod._id}</div>
              </div>
            </td>

            <td className="px-3 py-2">
              {selectedVariantNames.length > 0 ? (
                <ul>
                  {selectedVariantNames.map((vn, i) => (
                    <li key={i} className="text-sm">
                      • {vn}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="italic text-gray-500">No variants selected</span>
              )}
            </td>

            <td className="px-3 py-2">
              <button
                type="button"
                className="ml-2 px-2 py-1 rounded-md border text-red-600"
                onClick={() => handleRemoveProduct(prod._id)}
              >
                Remove
              </button>
            </td>
          </tr>
        );
      })
    )}
  </tbody>
</table>




                        {/* Product Preview Grid */}
                        <h3 className="product_title">Preview All Products</h3>
                        <div className="product-images">
                          {filteredProducts.map((p) => {
                            const isSelected = selectedProducts.find((sp) => sp._id === p._id);
                            return (
                              <div
                                key={p._id}
                                className={`product-card ${isSelected ? "selected" : ""}`} // <-- add selected class
                                onClick={() => handleProductClick(p)}
                                style={{ cursor: "pointer" }}
                              >
                                <img src={p.productImg} alt={p.name} className="product-img" />
                                <p className="product-name">{p.name.length > 10 ? p.name.slice(0, 10) + "..." : p.name}</p>
                              </div>
                            );
                          })}
                        </div>

                      </div>


              )}
            </div>
          </div>

          <div className="save-btn">
            <button className="offersave" onClick={handleSaveOffer}>
              Save Offer
            </button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  );
};

export default OfferDetails;




