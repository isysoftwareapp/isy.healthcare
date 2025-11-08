"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";

interface Pricing {
  local: number;
  localWithInsurance: number;
  tourist: number;
  touristWithInsurance: number;
}

interface Service {
  _id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  description?: string;
  pricing: Pricing;
  isActive: boolean;
  assignedClinic: {
    _id: string;
    clinicId: string;
    clinicName: string;
  };
  // Additional hospital fields
  serviceCode?: string;
  unit?: string;
  estimatedDuration?: number;
  requiresDoctor?: boolean;
  requiresEquipment?: string[];
  notes?: string;
}

// Category color mapping
const categoryColors: Record<string, { bg: string; text: string }> = {
  Consultation: { bg: "bg-blue-100", text: "text-blue-800" },
  Procedure: { bg: "bg-purple-100", text: "text-purple-800" },
  Laboratory: { bg: "bg-green-100", text: "text-green-800" },
  Radiology: { bg: "bg-orange-100", text: "text-orange-800" },
  Pharmacy: { bg: "bg-pink-100", text: "text-pink-800" },
  Other: { bg: "bg-gray-100", text: "text-gray-800" },
};

const categories = [
  "All",
  "Consultation",
  "Procedure",
  "Laboratory",
  "Radiology",
  "Pharmacy",
  "Other",
];

export default function PricelistsPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    serviceName: "",
    category: "Consultation",
    description: "",
    pricing: {
      local: 0,
      localWithInsurance: 0,
      tourist: 0,
      touristWithInsurance: 0,
    },
    assignedClinic: "",
    serviceCode: "",
    unit: "Session",
    estimatedDuration: 30,
    requiresDoctor: true,
    requiresEquipment: [] as string[],
    notes: "",
  });

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, searchTerm]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "All")
        params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/pricelists?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setServices(data.services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = "/api/pricelists";
      const method = editingService ? "PUT" : "POST";
      const body = editingService
        ? { ...formData, _id: editingService._id }
        : {
            ...formData,
            assignedClinic: session?.user?.assignedClinics?.[0] || "",
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowModal(false);
        resetForm();
        fetchServices();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service");
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName,
      category: service.category,
      description: service.description || "",
      pricing: service.pricing,
      assignedClinic: service.assignedClinic._id,
      serviceCode: service.serviceCode || "",
      unit: service.unit || "Session",
      estimatedDuration: service.estimatedDuration || 30,
      requiresDoctor: service.requiresDoctor ?? true,
      requiresEquipment: service.requiresEquipment || [],
      notes: service.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this service?")) return;

    try {
      const res = await fetch(`/api/pricelists?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchServices();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service");
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: "",
      category: "Consultation",
      description: "",
      pricing: {
        local: 0,
        localWithInsurance: 0,
        tourist: 0,
        touristWithInsurance: 0,
      },
      assignedClinic: "",
      serviceCode: "",
      unit: "Session",
      estimatedDuration: 30,
      requiresDoctor: true,
      requiresEquipment: [],
      notes: "",
    });
    setEditingService(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout session={session}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Medical Pricelist Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Manage service pricing for all patient categories
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Search */}
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Button */}
            {["Admin", "Director", "Finance"].includes(session.user.role) && (
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Service
              </button>
            )}
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No services found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Service ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Service Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Local
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Local + Ins
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tourist
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tourist + Ins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr
                      key={service._id}
                      onClick={() =>
                        ["Admin", "Director", "Finance"].includes(
                          session.user.role
                        ) && handleEdit(service)
                      }
                      className={`hover:bg-gray-50 transition-colors ${
                        ["Admin", "Director", "Finance"].includes(
                          session.user.role
                        )
                          ? "cursor-pointer"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {service.serviceId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {service.serviceName}
                          </div>
                          {service.description && (
                            <div className="text-xs text-gray-500">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            categoryColors[service.category]?.bg ||
                            "bg-gray-100"
                          } ${
                            categoryColors[service.category]?.text ||
                            "text-gray-800"
                          }`}
                        >
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(service.pricing.local)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(service.pricing.localWithInsurance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(service.pricing.tourist)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(service.pricing.touristWithInsurance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            service.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingService ? "Edit Service" : "Add New Service"}
                </h2>
                {editingService &&
                  ["Admin", "Director"].includes(session.user.role) && (
                    <button
                      onClick={() => handleDelete(editingService._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete Service
                    </button>
                  )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                      Basic Information
                    </h3>

                    {/* Service Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.serviceName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Konsultasi Dokter Umum"
                      />
                    </div>

                    {/* Service Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Code
                      </label>
                      <input
                        type="text"
                        value={formData.serviceCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceCode: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., ICD-10, CPT Code"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {categories
                          .filter((c) => c !== "All")
                          .map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit of Measurement
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Session">Session</option>
                        <option value="Test">Test</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Item">Item</option>
                        <option value="Dose">Dose</option>
                        <option value="Strip">Strip</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Injection">Injection</option>
                        <option value="Hour">Hour</option>
                        <option value="Day">Day</option>
                      </select>
                    </div>

                    {/* Estimated Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.estimatedDuration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimatedDuration: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 30"
                      />
                    </div>

                    {/* Requires Doctor */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requiresDoctor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              requiresDoctor: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Requires Doctor Supervision
                        </span>
                      </label>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of the service"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notes: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Special instructions, prerequisites, etc."
                      />
                    </div>
                  </div>

                  {/* Right Column - Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                      Pricing Structure (IDR)
                    </h3>

                    <div className="space-y-3">
                      {/* Local Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          1. Local (Base Price){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1000"
                          value={formData.pricing.local}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricing: {
                                ...formData.pricing,
                                local: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 150000"
                        />
                      </div>

                      {/* Local with Insurance */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          2. Local with Insurance{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1000"
                          value={formData.pricing.localWithInsurance}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricing: {
                                ...formData.pricing,
                                localWithInsurance:
                                  parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 200000"
                        />
                      </div>

                      {/* Tourist Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          3. Tourist <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1000"
                          value={formData.pricing.tourist}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricing: {
                                ...formData.pricing,
                                tourist: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 300000"
                        />
                      </div>

                      {/* Tourist with Insurance */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          4. Tourist with Insurance{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1000"
                          value={formData.pricing.touristWithInsurance}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricing: {
                                ...formData.pricing,
                                touristWithInsurance:
                                  parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 350000"
                        />
                      </div>
                    </div>

                    {/* Quick Calculate Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const basePrice = formData.pricing.local;
                        if (basePrice > 0) {
                          setFormData({
                            ...formData,
                            pricing: {
                              local: basePrice,
                              localWithInsurance: Math.round(basePrice * 1.4),
                              tourist: Math.round(basePrice * 2),
                              touristWithInsurance: Math.round(basePrice * 2.4),
                            },
                          });
                        }
                      }}
                      className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 border border-green-300"
                    >
                      Auto-Calculate from Local Price
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {editingService ? "Update Service" : "Create Service"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
