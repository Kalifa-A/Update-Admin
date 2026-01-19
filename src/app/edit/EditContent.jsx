"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useEditor, EditorContent } from "@tiptap/react";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontSize } from "@tiptap/extension-font-size";
import { FontFamily } from "@tiptap/extension-font-family";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";


export default function EditPage() {
  const searchParams = useSearchParams();
  const initialText = searchParams.get("text") || "<p>Start editing...</p>";

  const [content, setContent] = useState(initialText);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontSize.configure({ types: ["textStyle"] }),
      FontFamily.configure({ types: ["textStyle"] }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    immediatelyRender: false,

  });

  if (!editor) {
    return null; // or a loader
  }

  return (
    
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="mb-4 text-xl font-bold">Edit Content</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded border ${
            editor.isActive("bold") ? "bg-blue-600 text-white" : ""
          }`}
        >
          Bold
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded border ${
            editor.isActive("italic") ? "bg-blue-600 text-white" : ""
          }`}
        >
          Italic
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 rounded border ${
            editor.isActive("underline") ? "bg-blue-600 text-white" : ""
          }`}
        >
          Underline
        </button>

        <select
          value={editor.getAttributes("textStyle")?.fontSize || "16px"}
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          className="border rounded px-2"
        >
          {["12px", "14px", "16px", "18px", "20px", "24px", "32px"].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <select
          value={editor.getAttributes("textStyle")?.fontFamily || "Arial"}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="border rounded px-2"
        >
          {["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana"].map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        <input
          type="color"
          value={editor.getAttributes("textStyle")?.color || "#000000"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          title="Text Color"
          className="w-8 h-8 p-0 border rounded cursor-pointer"
        />

        <button
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="px-2 py-1 rounded border text-sm text-red-600 hover:bg-red-100"
        >
          Clear Color
        </button>

        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-2 py-1 rounded border text-sm text-red-600 hover:bg-red-100"
        >
          Clear All Formatting
        </button>
      </div>

      {/* Editable content */}
      <EditorContent
        editor={editor}
        className="border p-4 rounded min-h-[300px] prose max-w-full"
      />

      {/* You can add a Save button here to send the content to backend */}
      <div className="mt-4">
        <button
          onClick={() => alert("Saved content:\n" + content)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Content
        </button>
      </div>
    </div>
  );
}
