"use client";

import { useEffect,useState } from "react";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontSize } from "@tiptap/extension-font-size";
import { FontFamily } from "@tiptap/extension-font-family";
import ProtectedRoute from "@/components/ProtectedRoute";
import TextAlign from "@tiptap/extension-text-align";

// --- Static Editor Component ---

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, "_");
}
function StaticEditor({ section, onSave }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [content, setContent] = useState("<p>Loading content...</p>");

  // Editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSize.configure({ types: ["textStyle"] }),
      FontFamily.configure({ types: ["textStyle"] }),
      TextAlign.configure({ types: ["paragraph", "heading"] }),
    ],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
    immediatelyRender: false,
  });

  // Fetch content from API once editor is ready
useEffect(() => {
  fetchContent();
}, [section, editor]);

const fetchContent = async () => {
  if (!editor) return;
  const slug = slugify(section);
  try {
    const res = await fetch(`https://thajanwar.onrender.com/pages/${slug}`);
    if (!res.ok) {
      const fallback = "<p>Start editing here...</p>";
      setContent(fallback);
      editor.commands.setContent(fallback);
      return;
    }
    const data = await res.json();
    const contentFromAPI = data?.content || "<p>Start editing here...</p>";
    setContent(contentFromAPI);
    editor.commands.setContent(contentFromAPI);
  } catch (err) {
    const fallback = "<p>Start editing here...</p>";
    setContent(fallback);
    editor.commands.setContent(fallback);
  }
};

const handleSave = async () => {
  if (!editor) return;

  setLoading(true);
  setMessage("");
  try {
    const html = editor.getHTML();
    const slug = slugify(section);
    await onSave({ slug, title: section, content: html });
    setMessage("✅ Content saved!");
    alert("Content saved successfully!");

    // ⬇️ Re-fetch the latest content
    await fetchContent();
  } catch (err) {
    console.error(err);
    setMessage("❌ Error saving content");
  } finally {
    setLoading(false);
  }
};


  if (!editor) return <p>Loading editor...</p>;

return (
  <div className="max-w-4xl mx-auto mt-6 p-6 bg-white shadow-lg rounded-lg">
    <h3 className="mb-6 text-2xl font-semibold text-gray-800">{section}</h3>

    {/* Toolbar */}
    <div className="flex flex-wrap items-center gap-3 mb-5 border-b border-gray-200 pb-3">
      {/* Text formatting */}
      <div className="flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded-md border ${editor.isActive("bold") ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded-md border ${editor.isActive("italic") ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 rounded-md border ${editor.isActive("underline") ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          U
        </button>
      </div>

      {/* Font Size */}
      <select
        value={editor.getAttributes("textStyle")?.fontSize || "16px"}
        onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
        className="border rounded-md px-2 py-1 bg-gray-50 text-gray-700"
      >
        {["12px", "14px", "16px", "18px", "20px", "24px", "32px"].map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>

      {/* Font Family */}
      <select
        value={editor.getAttributes("textStyle")?.fontFamily || "Arial"}
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="border rounded-md px-2 py-1 bg-gray-50 text-gray-700"
      >
        {["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Purple Purse"].map(font => (
          <option key={font} value={font}>{font}</option>
        ))}
      </select>

      {/* Color Picker */}
      <input
        type="color"
        value={editor.getAttributes("textStyle")?.color || "#000000"}
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        className="w-8 h-8 border rounded-md cursor-pointer"
        title="Text Color"
      />

      <button
        onClick={() => editor.chain().focus().unsetColor().run()}
        className="px-2 py-1 rounded-md border text-red-600 bg-gray-100 hover:bg-red-50"
      >
        Clear Color
      </button>

      {/* Text Align */}
      <div className="flex gap-1 ml-auto">
        {["left", "center", "right", "justify"].map(align => (
          <button
            key={align}
            onClick={() => editor.chain().focus().setTextAlign(align).run()}
            className={`px-3 py-1 rounded-md border ${editor.isActive({ textAlign: align }) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {align.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>

      <button
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className="px-3 py-1 rounded-md border text-red-600 bg-gray-100 hover:bg-red-50 ml-3"
      >
        Clear All
      </button>
    </div>

    {/* Editor Content */}
    <EditorContent
      editor={editor}
      className="border border-gray-200 rounded-lg p-4 min-h-[350px] focus:outline-none focus:ring-2 focus:ring-blue-400"
    />

    {/* Save Button */}
    {/* Save button */}
       {/* Save button */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`inline-block cursor-pointer rounded-md px-5 py-2 mt-2 shadow-inner 
                              font-semibold text-white text-sm transition-colors 
                              ${loading ? "bg-gray-400" : "bg-black hover:bg-gray-600"}`}
                >
                  {loading ? "Saving..." : "Save Content"}
                </button>
              </div>
  </div>
);

}


// --- Main Settings Page ---
export default function Page() {
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    phone: "",
    gst: "",
    pan: "",
  });
  const [selectedStatic, setSelectedStatic] = useState(null);
  const [savedContent, setSavedContent] = useState({});

  const staticSections = [
    "About",
    "Announcements",
    "Account Privacy",
    "Return and Refund Policy",
    "Terms & Conditions",
    "Customer Support"
  ];

  const [settings, setSettings] = useState({
    businessName: "Your Business Name",
    invoiceNumber: "INV-001",
    fromAddress: "123 Street Name, City, State, ZIP",
    gstNumber: "GST12345678",
    notes: "Thank you for your business!",
    declaration: "We declare that this invoice is true and correct.",
    signature: null,
  });

  const [items, setItems] = useState([{ name: "Sample Item", qty: 1, price: 100 }]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { name: "", qty: 1, price: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);

  const handleSaveContent = async ({ slug, title, content }) => {
    const res = await fetch("https://thajanwar.onrender.com/pages/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, content }),
    });

    if (!res.ok) throw new Error("Failed to save content");
    setSavedContent((prev) => ({ ...prev, [slug]: content }));
  };

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

        {/* Tabs */}
        <div className="mb-4 w-full mt-4">
          <div className="mx-auto w-[500px]">
            <Menubar className="bg-transparent shadow-none w-full flex justify-center items-center relative">
              <MenubarMenu>
                <div className="flex gap-8 relative">
                  {["static", "invoice"].map((tab) => (
                    <div key={tab} className="relative inline-flex flex-col items-center">
                      <MenubarTrigger
                        onClick={() => setActiveTab(tab)}
                        className={activeTab === tab ? "font-bold" : ""}
                      >
                        {tab === "static"
                          ? "Static Page Editor"
                          : "Invoice Settings"}
                      </MenubarTrigger>
                      {activeTab === tab && (
                        <motion.div layoutId="underline" className="w-full h-[2px] bg-black mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>

        {/* General Tab
        {activeTab === "general" && (
          <div className="w-full mt-4 flex justify-center">
            <div className="w-[520px] flex flex-col gap-4 px-4 py-8 bg-white shadow rounded">
              {["businessName", "businessEmail", "phone", "gst", "pan"].map((field) => (
                <input
                  key={field}
                  name={field}
                  placeholder={field.replace(/([A-Z])/g, " $1")}
                  value={formData[field]}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                />
              ))}
            </div>
          </div>
        )} */}

        {/* Static Pages Tab */}
        {activeTab === "static" && (
          <div className="w-full mt-4 flex flex-col items-center gap-3">
            {staticSections.map((item) => (
              <div
                key={item}
                onClick={() => setSelectedStatic(item)}
                className={`w-[520px] p-4 bg-white border rounded shadow-sm cursor-pointer transition-all duration-200 ${
                  selectedStatic === item ? "border-blue-600 shadow-md font-semibold" : "border-gray-200"
                } hover:shadow-md`}
              >
                {item}
              </div>
            ))}
            {selectedStatic && <StaticEditor section={selectedStatic} onSave={handleSaveContent} />}
          </div>
        )}

        {/* Invoice Tab */}
        {activeTab === "invoice" && (
          <div className="flex gap-8 p-8 bg-gray-100">
            {/* Left Settings */}
            <div className="w-1/3 bg-white shadow p-6 rounded flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-4">Invoice Settings</h2>
              {[
                { label: "Business Name", key: "businessName" },
                { label: "Invoice Number", key: "invoiceNumber" },
                { label: "From Address", key: "fromAddress" },
                { label: "GST Number", key: "gstNumber" },
                { label: "Notes", key: "notes" },
                { label: "Declaration", key: "declaration" },
              ].map((field) => (
                <div key={field.key} className="mb-4">
                  <label className="block font-semibold mb-1">{field.label}</label>
                  <textarea
                    value={settings[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full border p-2 rounded"
                    rows={field.key === "notes" || field.key === "declaration" ? 3 : 1}
                  />
                </div>
              ))}
              <div className="mb-4">
                <label className="block font-semibold mb-1">Signature</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => handleChange("signature", reader.result);
                    reader.readAsDataURL(file);
                  }}
                  className="w-full border p-1 rounded cursor-pointer"
                />
              </div>
              {/* Print Button */}
  <div className="mt-4">
    <button
      onClick={() => {
        const printContents = document.getElementById("invoice-preview").innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // reload to restore event listeners
      }}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Print Invoice
    </button>
  </div>
            </div>
              {/* Right Preview */}
              <div id="invoice-preview" className="w-full mt-6 bg-white p-6 rounded shadow">
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold font-purplepurse">{settings.businessName}</h1>
                  <div className="text-right font-bold mb-6">To:</div>
                  <p className="text-sm">GST: {settings.gstNumber}</p>
                  <p className="text-sm font-semibold mt-1">Invoice No: {settings.invoiceNumber}</p>
                </div>

                <div className="mb-4">
                  <p className="font-semibold">From:</p>
                  <p className="whitespace-pre-line">{settings.fromAddress}</p>
                </div>

                <table className="w-full border border-gray-300 mb-6 text-right">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="border border-gray-300 px-2 py-1">Item</th>
                      <th className="border border-gray-300 px-2 py-1">Qty</th>
                      <th className="border border-gray-300 px-2 py-1">Price</th>
                      <th className="border border-gray-300 px-2 py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-2 py-1">{item.name}</td>
                        <td className="border border-gray-300 px-2 py-1">{item.qty}</td>
                        <td className="border border-gray-300 px-2 py-1">{item.price}</td>
                        <td className="border border-gray-300 px-2 py-1">{Number(item.qty) * Number(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-right font-bold mb-6">Grand Total: {calculateTotal()}</div>

                <div className="mb-6">
                  <p className="font-semibold">Notes:</p>
                  <p className="whitespace-pre-line">{settings.notes}</p>
                </div>

                <div className="mb-6">
                  <p className="font-semibold">Declaration:</p>
                  <p className="whitespace-pre-line">{settings.declaration}</p>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Signature</label>
                  {settings.signature ? (
                    <img src={settings.signature} alt="Signature" className="h-16 mb-2" />
                  ) : (
                    <div className="h-16 w-full border border-gray-300 flex items-center justify-center text-gray-400 mb-2">
                      No Signature
                    </div>
                  )}
                </div>
              </div>


          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
