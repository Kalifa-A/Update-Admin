"use client";

import { useState, useEffect, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import './page.css';

export default function Page() {
  const [formData, setFormData] = useState({
    name: "",
    sub_category: "",
    description: "",
    status: "active",
    imageFile: null,
    previewUrl: "", // thumbnail preview
    slug: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    bannerImages: null, // single banner file
    bannerPreviews: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // refs to revoke object URLs later
  const lastThumbUrl = useRef(null);
  const lastBannerUrl = useRef(null);

  useEffect(() => {
    return () => {
      if (lastThumbUrl.current) URL.revokeObjectURL(lastThumbUrl.current);
      if (lastBannerUrl.current) URL.revokeObjectURL(lastBannerUrl.current);
    };
  }, []);

  // helper to read token from localStorage (adjust if you store it elsewhere)
  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || localStorage.getItem("authToken") || null;
  };

  function toSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name") next.slug = toSlug(value);
      return next;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (lastThumbUrl.current) URL.revokeObjectURL(lastThumbUrl.current);
    const url = URL.createObjectURL(file);
    lastThumbUrl.current = url;

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      previewUrl: url,
    }));
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (lastBannerUrl.current) URL.revokeObjectURL(lastBannerUrl.current);
    const url = URL.createObjectURL(file);
    lastBannerUrl.current = url;

    setFormData((prev) => ({
      ...prev,
      bannerImages: file,
      bannerPreviews: url,
    }));
  };

  const handleToggleChange = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "active" ? "inactive" : "active",
    }));
  };

  // unified upload (single file or array)
  const uploadImage = async (files) => {
    if (!files) return null;
    const list = Array.isArray(files) ? files : [files];

    const uploadedUrls = await Promise.all(
      list.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("img", file);

        console.log("Uploading file:", file.name, file.type, file.size);

        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch("https://thajanwar.onrender.com/new/upload", {
          method: "POST",
          body: uploadData,
          headers,
          credentials: 'include',
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("Upload failed:", res.status, text);
          throw new Error(`Image upload failed: ${res.status} ${text || res.statusText}`);
        }

        let result;
        try {
          result = await res.json();
        } catch (err) {
          const txt = await res.text().catch(() => "");
          console.warn("Upload returned non-JSON response:", txt);
          return txt || null;
        }

        if (Array.isArray(result.imageUrls) && result.imageUrls.length > 0) {
          return result.imageUrls[0];
        } else if (result.imageUrl) {
          return result.imageUrl;
        } else if (result.url) {
          return result.url;
        } else if (typeof result === "string") {
          return result;
        } else {
          console.error("Unexpected upload response shape:", result);
          throw new Error("Unexpected upload response");
        }
      })
    );

    return uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = getAuthToken();
      if (!token) {
        setMessage("❌ Authorization token not found. Please login first.");
        setSaving(false);
        return;
      }
      // quick client-side validation
      if (!formData.name?.trim()) {
        setMessage("❌ Please provide a category name");
        setSaving(false);
        return;
      }

      let thumbnailUrl = null;
      let bannerUrl = null;

      if (formData.imageFile) {
        try {
          thumbnailUrl = await uploadImage(formData.imageFile);
        } catch (err) {
          console.error("Thumbnail upload error:", err);
          throw new Error("Thumbnail upload failed: " + (err.message || err));
        }
      }

      if (formData.bannerImages) {
        try {
          bannerUrl = await uploadImage(formData.bannerImages);
        } catch (err) {
          console.error("Banner upload error:", err);
          throw new Error("Banner upload failed: " + (err.message || err));
        }
      }

      const payload = {
        categories_name: formData.name,
        sub_category: formData.sub_category,
        description: formData.description,
        status: formData.status,
        img: thumbnailUrl,
        bannerImg: bannerUrl,
        slug: formData.slug,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        seo_keywords: (formData.seo_keywords || "")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      };

      console.log("Sending add_category payload:", payload);

      // try JSON POST first
      let res = await fetch("https://thajanwar.onrender.com/api/add_category", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      let resText = await res.text().catch(() => "");

      if (!res.ok) {
        console.warn("add_category returned non-ok:", res.status, resText);

        // fallback: try sending as FormData (some servers expect multipart)
        try {
          const form = new FormData();
          Object.entries(payload).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              form.append(k, JSON.stringify(v));
            } else if (v !== null && v !== undefined) {
              form.append(k, v);
            }
          });

          // If the backend expects files in the same request, append raw files:
          // if (formData.imageFile) form.append('imgFile', formData.imageFile);
          // if (formData.bannerImages) form.append('bannerFile', formData.bannerImages);

          console.log("Trying fallback FormData POST to add_category");
          const res2 = await fetch("https://thajanwar.onrender.com/api/add_category", {
            method: "POST",
            body: form,
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            credentials: 'include',
          });
          const text2 = await res2.text().catch(() => "");
          if (!res2.ok) {
            console.error("Fallback failed:", res2.status, text2);
            throw new Error("Failed to add category: " + (text2 || res2.statusText));
          }

          setMessage("✅ Category added successfully (fallback).");
        } catch (fallbackErr) {
          console.error("Fallback error:", fallbackErr);
          throw new Error("Failed to add category: " + (fallbackErr.message || "unknown"));
        }
      } else {
        try {
          const json = JSON.parse(resText || "{}");
          console.log("add_category response:", json);
        } catch {
          console.log("add_category returned text:", resText);
        }
        setMessage("✅ Category added successfully!");
      }

      // cleanup (revoking object URLs)
      if (lastThumbUrl.current) {
        URL.revokeObjectURL(lastThumbUrl.current);
        lastThumbUrl.current = null;
      }
      if (lastBannerUrl.current) {
        URL.revokeObjectURL(lastBannerUrl.current);
        lastBannerUrl.current = null;
      }

      setFormData({
        name: "",
        sub_category: "",
        description: "",
        status: "active",
        imageFile: null,
        previewUrl: "",
        seo_title: "",
        seo_description: "",
        seo_keywords: "",
        slug: "",
        bannerImages: null,
        bannerPreviews: "",
      });
    } catch (error) {
      console.error("handleSubmit error:", error);
      setMessage("❌ Error: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="order-container">
          <h1 className="title">Add Category</h1>

          <form onSubmit={handleSubmit} className="order-sections">
            {/* Left box */}
            <div className="box1">
              <div className="floating-label-input animated-input">
                <input
                  name="name"
                  type="text"
                  className="styled-input"
                  placeholder=" "
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <label>Category Name</label>
              </div>

              <div className="floating-textarea">
                <label>Description</label>
                <textarea
                  name="description"
                  className="styled-textarea"
                  placeholder=" "
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                />
                
              </div>

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

              <div className="toggle-wrapper">
                <label className="checkbox-label">Status</label>
                <label className="switch" style={{ marginLeft: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.status === "active"}
                    onChange={handleToggleChange}
                  />
                  <span className="slider">
                    <span className={`toggle-text ${formData.status === "active" ? "active" : "inhidden"}`}>
                      {formData.status === "active" ? "Active" : "Hidden"}
                    </span>
                  </span>
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="custom-upload-btn">
                  <div className="upload-label">
                    <p className="thumbnail">Upload Banner image</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {formData.bannerPreviews && (
                <div className="preview-container" style={{ marginTop: 8 }}>
                  <div className="image-preview">
                    <img src={formData.bannerPreviews} alt="Banner preview" className="product-img" />
                  </div>
                </div>
              )}
            </div>

            {/* Right box (SEO) */}
            <div className="box2">
              <label className="sub">SEO Details</label>

              <div className="floating-label-input animated-input">
                <input
                  name="seo_title"
                  type="text"
                  className="styled-input2"
                  placeholder=" "
                  required
                  value={formData.seo_title}
                  onChange={handleInputChange}
                />
                <label>SEO Title</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  name="seo_description"
                  type="text"
                  className="styled-input2"
                  placeholder=" "
                  required
                  value={formData.seo_description}
                  onChange={handleInputChange}
                />
                <label>SEO Description</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  name="seo_keywords"
                  type="text"
                  className="styled-input2"
                  placeholder=" "
                  required
                  value={formData.seo_keywords}
                  onChange={handleInputChange}
                />
                <label>SEO keywords</label>
              </div>

              <div className="floating-label-input animated-input">
                <input
                  name="slug"
                  type="text"
                  className="styled-input2"
                  placeholder=" "
                  // removed required to avoid blocking submit if slug generation fails
                  readOnly
                  value={formData.slug}
                  onChange={handleInputChange}
                />
                <label>Slug</label>
              </div>
              {formData.previewUrl && (
                <div className="preview-container">
                  <div className="image-preview">
                    <img src={formData.previewUrl} alt="Preview" className="product-img" />
                  </div>
                </div>
              )}
            </div>

            {/* Submit area (full width below boxes) */}
            <div className="full-width-submit">
              <button
                type="submit"
                disabled={saving}
                className="save_btn"
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                <span className="productsave">{saving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>

          {message && <p style={{ textAlign: "center", marginTop: 12 }}>{message}</p>}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
