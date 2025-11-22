/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  SiteContent,
  PricingTier,
  EcosystemItem,
  FeatureBlock,
  HardwareItem,
  ProductItem,
} from "../types";
import {
  Save,
  RotateCcw,
  LogOut,
  Type,
  DollarSign,
  Phone,
  Image as ImageIcon,
  Layers,
  Star,
  Cpu,
  Plus,
  Trash2,
  Check,
  Upload,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";

interface AdminPanelProps {
  content: SiteContent;
  onUpdate: (content: SiteContent) => void;
  onLogout: () => void;
  onReset: () => void;
}

type Tab =
  | "general"
  | "images"
  | "ecosystem"
  | "features"
  | "hardware"
  | "products"
  | "pricing"
  | "contact";

const AVAILABLE_ICONS = [
  "Monitor",
  "Settings",
  "CreditCard",
  "Box",
  "Users",
  "Smartphone",
  "QrCode",
  "Printer",
  "LayoutGrid",
  "Zap",
  "Globe",
  "Shield",
];

const AdminPanel: React.FC<AdminPanelProps> = ({
  content,
  onUpdate,
  onLogout,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [localContent, setLocalContent] = useState<SiteContent>(content);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleSave = async () => {
    console.log("🔄 handleSave called");
    setIsSaving(true);
    setSaveError(false);

    try {
      console.log("📡 Importing saveSiteContent...");
      const { saveSiteContent } = await import("../services/database");
      console.log("📡 Calling saveSiteContent with data:", localContent);
      const success = await saveSiteContent(localContent);

      if (success) {
        console.log("✅ Save successful, updating content");
        onUpdate(localContent);
        setTimeout(() => setIsSaving(false), 800);
      } else {
        console.log("❌ Save failed - no success returned");
        setSaveError(true);
        setIsSaving(false);
      }
    } catch (error) {
      console.error("💥 Save error:", error);
      setSaveError(true);
      setIsSaving(false);
    }
  };

  const updateField = (path: string[], value: any) => {
    setLocalContent((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Helper for generic file uploads (returns base64)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- List Management Helpers ---

  const addEcosystemItem = () => {
    const newItem: EcosystemItem = {
      id: `eco-${Date.now()}`,
      title: "New Module",
      description: "Description of the module.",
      icon: "Zap",
      bgClass: "bg-gray-50",
    };
    setLocalContent((prev) => ({
      ...prev,
      ecosystem: [...prev.ecosystem, newItem],
    }));
  };

  const removeEcosystemItem = (index: number) => {
    setLocalContent((prev) => ({
      ...prev,
      ecosystem: prev.ecosystem.filter((_, i) => i !== index),
    }));
  };

  const updateEcosystemItem = (
    index: number,
    field: keyof EcosystemItem,
    value: string
  ) => {
    const newItems = [...localContent.ecosystem];
    newItems[index] = { ...newItems[index], [field]: value };
    setLocalContent((prev) => ({ ...prev, ecosystem: newItems }));
  };

  const addFeatureBlock = () => {
    const newBlock: FeatureBlock = {
      id: `feat-${Date.now()}`,
      tagline: "New Feature",
      title: "Feature Title",
      description: "Description of this feature.",
      bullets: ["Benefit 1", "Benefit 2"],
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2370&auto=format&fit=crop",
      layout: localContent.features.length % 2 === 0 ? "left" : "right",
      visualType: "image",
    };
    setLocalContent((prev) => ({
      ...prev,
      features: [...prev.features, newBlock],
    }));
  };

  const removeFeatureBlock = (index: number) => {
    setLocalContent((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeatureBlock = (
    index: number,
    field: keyof FeatureBlock,
    value: any
  ) => {
    const newItems = [...localContent.features];
    newItems[index] = { ...newItems[index], [field]: value };
    setLocalContent((prev) => ({ ...prev, features: newItems }));
  };

  const updateFeatureBullet = (
    blockIndex: number,
    bulletIndex: number,
    value: string
  ) => {
    const newItems = [...localContent.features];
    newItems[blockIndex].bullets[bulletIndex] = value;
    setLocalContent((prev) => ({ ...prev, features: newItems }));
  };

  const addFeatureBullet = (blockIndex: number) => {
    const newItems = [...localContent.features];
    newItems[blockIndex].bullets.push("New Point");
    setLocalContent((prev) => ({ ...prev, features: newItems }));
  };

  const removeFeatureBullet = (blockIndex: number, bulletIndex: number) => {
    const newItems = [...localContent.features];
    newItems[blockIndex].bullets = newItems[blockIndex].bullets.filter(
      (_, i) => i !== bulletIndex
    );
    setLocalContent((prev) => ({ ...prev, features: newItems }));
  };

  // --- Product Management ---
  const addProduct = () => {
    const newProduct: ProductItem = {
      id: `p-${Date.now()}`,
      category: "kiosk",
      name: "New Product Model",
      description: "Product description here.",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2000&auto=format&fit=crop",
      specs: ["Spec 1", "Spec 2"],
      pricePurchase: "0",
      priceRent: "0",
    };
    setLocalContent((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));
  };

  const removeProduct = (index: number) => {
    setLocalContent((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const updateProduct = (
    index: number,
    field: keyof ProductItem,
    value: any
  ) => {
    const newItems = [...localContent.products];
    newItems[index] = { ...newItems[index], [field]: value };
    setLocalContent((prev) => ({ ...prev, products: newItems }));
  };

  const addProductSpec = (productIndex: number) => {
    const newItems = [...localContent.products];
    newItems[productIndex].specs.push("New Spec");
    setLocalContent((prev) => ({ ...prev, products: newItems }));
  };

  const removeProductSpec = (productIndex: number, specIndex: number) => {
    const newItems = [...localContent.products];
    newItems[productIndex].specs = newItems[productIndex].specs.filter(
      (_, i) => i !== specIndex
    );
    setLocalContent((prev) => ({ ...prev, products: newItems }));
  };

  const updateProductSpec = (
    productIndex: number,
    specIndex: number,
    value: string
  ) => {
    const newItems = [...localContent.products];
    newItems[productIndex].specs[specIndex] = value;
    setLocalContent((prev) => ({ ...prev, products: newItems }));
  };

  return (
    <div className="min-h-screen bg-gray-100 font-brand flex text-slate-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">
            is
          </div>
          <span className="font-bold text-lg text-black">Admin CMS</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "general", icon: Type, label: "General" },
            { id: "images", icon: ImageIcon, label: "Images & BG" },
            { id: "ecosystem", icon: Layers, label: "Ecosystem" },
            { id: "features", icon: Star, label: "Features" },
            { id: "hardware", icon: Cpu, label: "Hardware Intro" },
            { id: "products", icon: ShoppingBag, label: "Products Store" },
            { id: "pricing", icon: DollarSign, label: "Software Pricing" },
            { id: "contact", icon: Phone, label: "Contact" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors mb-1 ${
                activeTab === item.id
                  ? "bg-[#ADE8F4] text-black"
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen custom-scrollbar text-black">
        <header className="flex justify-between items-center mb-8 sticky top-0 bg-gray-100/90 backdrop-blur-sm z-20 py-4">
          <div>
            <h1 className="text-3xl font-bold text-black capitalize">
              {activeTab}
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your website content.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-black text-white hover:bg-[#498FB3] transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Check className="w-4 h-4 animate-bounce" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : saveError ? "Retry" : "Save Changes"}
              </button>
            </div>
            {saveError && (
              <p className="text-red-500 text-xs">
                Failed to save. Please try again.
              </p>
            )}
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-3xl">
              <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-100 text-black">
                Hero Section
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={localContent.hero.badge}
                    onChange={(e) =>
                      updateField(["hero", "badge"], e.target.value)
                    }
                    className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Title Line 1
                    </label>
                    <input
                      type="text"
                      value={localContent.hero.titleLine1}
                      onChange={(e) =>
                        updateField(["hero", "titleLine1"], e.target.value)
                      }
                      className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Title Line 2 (Color)
                    </label>
                    <input
                      type="text"
                      value={localContent.hero.titleLine2}
                      onChange={(e) =>
                        updateField(["hero", "titleLine2"], e.target.value)
                      }
                      className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <textarea
                    value={localContent.hero.subtitle}
                    onChange={(e) =>
                      updateField(["hero", "subtitle"], e.target.value)
                    }
                    rows={3}
                    className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* IMAGES TAB */}
          {activeTab === "images" && (
            <div className="space-y-8 max-w-3xl">
              {/* LOGO */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-100 text-black">
                  Site Logo
                </h2>
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-black rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-100 shrink-0">
                    {localContent.images.logo ? (
                      <img
                        src={localContent.images.logo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-white font-bold text-2xl">is</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Upload New Logo (PNG/JPG)
                    </label>
                    <div className="flex gap-4">
                      <label className="cursor-pointer bg-[#ADE8F4] hover:bg-[#9ADFF0] text-black px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (url) =>
                              updateField(["images", "logo"], url)
                            )
                          }
                        />
                      </label>
                      {localContent.images.logo && (
                        <button
                          onClick={() => updateField(["images", "logo"], null)}
                          className="text-red-500 font-bold text-sm hover:underline"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* HERO DASHBOARD */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-100 text-black">
                  Hero Dashboard Image
                </h2>
                <div className="space-y-4">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                    <img
                      src={localContent.images.heroDashboard}
                      alt="Dashboard"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localContent.images.heroDashboard}
                      onChange={(e) =>
                        updateField(["images", "heroDashboard"], e.target.value)
                      }
                      className="flex-1 p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 shrink-0">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, (url) =>
                            updateField(["images", "heroDashboard"], url)
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* GLOBAL BACKGROUND */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-100 text-black">
                  Global Background Image
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Add a custom background image that appears behind all content.
                  Leave empty for the default animated fluid background.
                </p>

                <div className="space-y-4">
                  {localContent.images.backgroundImage && (
                    <div className="aspect-[21/9] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative mb-4">
                      <img
                        src={localContent.images.backgroundImage}
                        alt="Background"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          updateField(["images", "backgroundImage"], null)
                        }
                        className="absolute top-2 right-2 bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localContent.images.backgroundImage || ""}
                      onChange={(e) =>
                        updateField(
                          ["images", "backgroundImage"],
                          e.target.value
                        )
                      }
                      className="flex-1 p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                      placeholder="Image URL (optional)"
                    />
                    <label className="cursor-pointer bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 shrink-0">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, (url) =>
                            updateField(["images", "backgroundImage"], url)
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ECOSYSTEM TAB */}
          {activeTab === "ecosystem" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={addEcosystemItem}
                  className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#498FB3] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Card
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {localContent.ecosystem.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative group"
                  >
                    <button
                      onClick={() => removeEcosystemItem(idx)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Icon
                        </label>
                        <select
                          value={item.icon}
                          onChange={(e) =>
                            updateEcosystemItem(idx, "icon", e.target.value)
                          }
                          className="w-full p-2 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:border-[#498FB3]"
                        >
                          {AVAILABLE_ICONS.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            updateEcosystemItem(idx, "title", e.target.value)
                          }
                          className="w-full p-2 bg-white text-black font-bold border-b border-gray-200 focus:border-[#498FB3] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Description
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) =>
                            updateEcosystemItem(
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-white text-black focus:border-[#498FB3] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Background Style
                        </label>
                        <input
                          type="text"
                          value={item.bgClass}
                          onChange={(e) =>
                            updateEcosystemItem(idx, "bgClass", e.target.value)
                          }
                          className="w-full p-2 text-xs font-mono border-b border-gray-200 bg-white text-black focus:border-[#498FB3] focus:outline-none"
                          placeholder="Tailwind Classes (e.g. bg-gray-50)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FEATURES TAB */}
          {activeTab === "features" && (
            <div className="space-y-8">
              <div className="flex justify-end">
                <button
                  onClick={addFeatureBlock}
                  className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#498FB3] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Feature Section
                </button>
              </div>

              <div className="space-y-12">
                {localContent.features.map((block, idx) => (
                  <div
                    key={block.id}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative"
                  >
                    <div className="absolute top-6 right-6 flex gap-2">
                      <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
                        <button
                          onClick={() =>
                            updateFeatureBlock(idx, "layout", "left")
                          }
                          className={`p-1 rounded ${
                            block.layout === "left"
                              ? "bg-white shadow-sm"
                              : "text-gray-400"
                          }`}
                          title="Image Left"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            updateFeatureBlock(idx, "layout", "right")
                          }
                          className={`p-1 rounded ${
                            block.layout === "right"
                              ? "bg-white shadow-sm"
                              : "text-gray-400"
                          }`}
                          title="Image Right"
                        >
                          <Layers className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFeatureBlock(idx)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Remove Section"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-400 mb-6">
                      Section {idx + 1}
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Tagline
                          </label>
                          <input
                            type="text"
                            value={block.tagline}
                            onChange={(e) =>
                              updateFeatureBlock(idx, "tagline", e.target.value)
                            }
                            className="w-full p-2 bg-white text-black rounded-lg border border-gray-200 focus:border-[#498FB3] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={block.title}
                            onChange={(e) =>
                              updateFeatureBlock(idx, "title", e.target.value)
                            }
                            className="w-full p-2 text-xl font-bold border-b border-gray-200 bg-white text-black focus:border-[#498FB3] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Description
                          </label>
                          <textarea
                            value={block.description}
                            onChange={(e) =>
                              updateFeatureBlock(
                                idx,
                                "description",
                                e.target.value
                              )
                            }
                            rows={4}
                            className="w-full p-2 bg-white text-black rounded-lg border border-gray-200 focus:border-[#498FB3] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                            Bullet Points
                          </label>
                          <div className="space-y-2">
                            {block.bullets.map((bullet, bIdx) => (
                              <div
                                key={bIdx}
                                className="flex gap-2 items-center"
                              >
                                <div className="w-1.5 h-1.5 bg-[#ADE8F4] rounded-full shrink-0"></div>
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) =>
                                    updateFeatureBullet(
                                      idx,
                                      bIdx,
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 p-1 border-b border-transparent hover:border-gray-200 focus:border-[#498FB3] bg-transparent text-black focus:outline-none"
                                />
                                <button
                                  onClick={() => removeFeatureBullet(idx, bIdx)}
                                  className="text-gray-300 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addFeatureBullet(idx)}
                              className="text-xs font-bold text-[#498FB3] mt-2 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Point
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Visual Content
                        </label>
                        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative">
                          {block.visualType === "image" ? (
                            <img
                              src={block.image}
                              alt="Feature"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-black text-white text-center p-4">
                              <div>
                                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="font-bold text-sm">
                                  Using Custom UI Component
                                </p>
                                <p className="text-xs text-gray-500">
                                  ({block.visualType})
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={block.image}
                            onChange={(e) =>
                              updateFeatureBlock(idx, "image", e.target.value)
                            }
                            className="flex-1 p-2 bg-white text-black rounded-lg border border-gray-200 focus:border-[#498FB3] focus:outline-none text-sm"
                            disabled={block.visualType !== "image"}
                          />
                          {block.visualType === "image" && (
                            <label className="cursor-pointer bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleFileUpload(e, (url) =>
                                    updateFeatureBlock(idx, "image", url)
                                  )
                                }
                              />
                            </label>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm cursor-pointer text-black">
                            <input
                              type="radio"
                              checked={block.visualType === "image"}
                              onChange={() =>
                                updateFeatureBlock(idx, "visualType", "image")
                              }
                              className="text-black focus:ring-black"
                            />
                            Standard Image
                          </label>
                          {block.visualType !== "image" && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer text-black">
                              <input
                                type="radio"
                                checked={true}
                                readOnly
                                className="text-black focus:ring-black"
                              />
                              Current Custom UI
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HARDWARE INTRO TAB */}
          {activeTab === "hardware" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-3xl">
              <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-100 text-black">
                Hardware Section
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={localContent.hardware.title}
                    onChange={(e) =>
                      updateField(["hardware", "title"], e.target.value)
                    }
                    className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <textarea
                    value={localContent.hardware.subtitle}
                    onChange={(e) =>
                      updateField(["hardware", "subtitle"], e.target.value)
                    }
                    rows={3}
                    className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                  />
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Hardware Items
                  </h3>
                  <div className="space-y-6">
                    {localContent.hardware.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const newItems = [
                                  ...localContent.hardware.items,
                                ];
                                newItems[idx].title = e.target.value;
                                updateField(["hardware", "items"], newItems);
                              }}
                              className="w-full p-2 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:border-[#498FB3]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                              Icon
                            </label>
                            <select
                              value={item.icon}
                              onChange={(e) => {
                                const newItems = [
                                  ...localContent.hardware.items,
                                ];
                                newItems[idx].icon = e.target.value;
                                updateField(["hardware", "items"], newItems);
                              }}
                              className="w-full p-2 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:border-[#498FB3]"
                            >
                              {AVAILABLE_ICONS.map((icon) => (
                                <option key={icon} value={icon}>
                                  {icon}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Description
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...localContent.hardware.items];
                              newItems[idx].description = e.target.value;
                              updateField(["hardware", "items"], newItems);
                            }}
                            rows={2}
                            className="w-full p-2 bg-white text-black border border-gray-200 rounded-lg focus:outline-none focus:border-[#498FB3] text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === "products" && (
            <div className="space-y-8">
              <div className="flex justify-end">
                <button
                  onClick={addProduct}
                  className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#498FB3] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {localContent.products.map((product, idx) => (
                  <div
                    key={product.id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative flex flex-col md:flex-row gap-6"
                  >
                    <button
                      onClick={() => removeProduct(idx)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-10"
                      title="Remove Product"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* Image Side */}
                    <div className="w-full md:w-1/3 space-y-4">
                      <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={product.image}
                          onChange={(e) =>
                            updateProduct(idx, "image", e.target.value)
                          }
                          className="flex-1 p-2 bg-white text-black rounded-lg border border-gray-200 text-xs focus:border-[#498FB3] focus:outline-none"
                          placeholder="Image URL"
                        />
                        <label className="cursor-pointer bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0">
                          <Upload className="w-3 h-3" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) =>
                                updateProduct(idx, "image", url)
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {/* Data Side */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) =>
                              updateProduct(idx, "name", e.target.value)
                            }
                            className="w-full p-2 font-bold text-lg border-b border-gray-200 bg-white text-black focus:border-[#498FB3] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Category
                          </label>
                          <select
                            value={product.category}
                            onChange={(e) =>
                              updateProduct(idx, "category", e.target.value)
                            }
                            className="w-full p-2 bg-white text-black rounded-lg border border-gray-200 focus:border-[#498FB3] focus:outline-none"
                          >
                            <option value="kiosk">Kiosk</option>
                            <option value="pos">POS</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Description
                        </label>
                        <textarea
                          value={product.description}
                          onChange={(e) =>
                            updateProduct(idx, "description", e.target.value)
                          }
                          rows={3}
                          className="w-full p-2 text-sm bg-white text-black rounded-lg border border-gray-200 focus:border-[#498FB3] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Purchase Price (฿)
                          </label>
                          <input
                            type="text"
                            value={product.pricePurchase}
                            onChange={(e) =>
                              updateProduct(
                                idx,
                                "pricePurchase",
                                e.target.value
                              )
                            }
                            className="w-full p-2 font-bold border border-gray-200 rounded bg-white text-black focus:border-[#498FB3] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Rent Price (฿)
                          </label>
                          <input
                            type="text"
                            value={product.priceRent}
                            onChange={(e) =>
                              updateProduct(idx, "priceRent", e.target.value)
                            }
                            className="w-full p-2 font-bold border border-gray-200 rounded bg-white text-black focus:border-[#498FB3] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                          Tech Specs
                        </label>
                        <div className="space-y-2">
                          {product.specs.map((spec, sIdx) => (
                            <div key={sIdx} className="flex gap-2 items-center">
                              <Tag className="w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={spec}
                                onChange={(e) =>
                                  updateProductSpec(idx, sIdx, e.target.value)
                                }
                                className="flex-1 p-1 text-sm border-b border-transparent hover:border-gray-200 bg-transparent text-black focus:border-[#498FB3] focus:outline-none"
                              />
                              <button
                                onClick={() => removeProductSpec(idx, sIdx)}
                                className="text-gray-300 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addProductSpec(idx)}
                            className="text-xs font-bold text-[#498FB3] mt-2 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Spec
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {localContent.pricing.map((tier, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative group"
                  >
                    <div className="absolute top-4 right-4 text-gray-300 text-xs font-bold uppercase tracking-widest">
                      Tier {idx + 1}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Plan Name
                        </label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => {
                            const newPricing = [...localContent.pricing];
                            newPricing[idx].name = e.target.value;
                            updateField(["pricing"], newPricing);
                          }}
                          className="w-full p-2 font-bold text-lg border-b border-gray-200 bg-transparent text-black focus:border-[#498FB3] focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Price
                          </label>
                          <div className="flex items-center">
                            <span className="text-gray-400 font-bold mr-2">
                              ฿
                            </span>
                            <input
                              type="text"
                              value={tier.price}
                              onChange={(e) => {
                                const newPricing = [...localContent.pricing];
                                newPricing[idx].price = e.target.value;
                                updateField(["pricing"], newPricing);
                              }}
                              className="w-full p-2 font-bold text-xl border-b border-gray-200 bg-transparent text-black focus:border-[#498FB3] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                            Period
                          </label>
                          <input
                            type="text"
                            value={tier.period}
                            onChange={(e) => {
                              const newPricing = [...localContent.pricing];
                              newPricing[idx].period = e.target.value;
                              updateField(["pricing"], newPricing);
                            }}
                            className="w-full p-2 text-sm border-b border-gray-200 bg-transparent text-black focus:border-[#498FB3] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                          Description
                        </label>
                        <textarea
                          value={tier.description}
                          onChange={(e) => {
                            const newPricing = [...localContent.pricing];
                            newPricing[idx].description = e.target.value;
                            updateField(["pricing"], newPricing);
                          }}
                          rows={2}
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-white text-black focus:border-[#498FB3] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                          Features
                        </label>
                        <div className="space-y-2">
                          {tier.features.map((feature, fIdx) => (
                            <div key={fIdx} className="flex gap-2">
                              <div className="w-1.5 h-1.5 bg-[#ADE8F4] rounded-full mt-2 shrink-0"></div>
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => {
                                  const newPricing = [...localContent.pricing];
                                  newPricing[idx].features[fIdx] =
                                    e.target.value;
                                  updateField(["pricing"], newPricing);
                                }}
                                className="flex-1 p-1 text-sm border-b border-transparent hover:border-gray-200 bg-transparent text-black focus:border-[#498FB3] focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === "contact" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-3xl">
              <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-100 text-black">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={localContent.contact.email}
                    onChange={(e) =>
                      updateField(["contact", "email"], e.target.value)
                    }
                    className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={localContent.contact.phone}
                    onChange={(e) =>
                      updateField(["contact", "phone"], e.target.value)
                    }
                    className="w-full p-3 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ADE8F4]"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
