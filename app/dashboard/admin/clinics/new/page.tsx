"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewClinicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    clinicId: "",
    code: "",
    contactInfo: {
      email: "",
      phone: "",
      website: "",
    },
    address: {
      street: "",
      city: "",
      state: "",
      country: "Indonesia",
      postalCode: "",
      timezone: "Asia/Jakarta",
    },
    operationalSettings: {
      appointmentSlotDuration: 30,
      autoLogoutDuration: 15,
      defaultLanguage: "en",
    },
    financialSettings: {
      primaryCurrency: "IDR",
      acceptedCurrencies: ["IDR"],
    },
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Generate invoice prefix from code
      const clinicData = {
        ...formData,
        financialSettings: {
          ...formData.financialSettings,
          invoicePrefix: `${formData.code}-INV-`,
        },
      };

      const response = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard/admin");
      } else {
        setError(data.error || "Failed to create clinic");
      }
    } catch (err) {
      setError("An error occurred while creating the clinic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clinics</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Clinic</h1>
            <p className="text-gray-600 mt-1">
              Create a new clinic location in your network
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., NYC-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.clinicId}
                onChange={(e) =>
                  setFormData({ ...formData, clinicId: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., NYC"
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isActive: e.target.value === "active",
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.contactInfo.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: {
                      ...formData.contactInfo,
                      email: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.contactInfo.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: {
                      ...formData.contactInfo,
                      phone: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                placeholder="https://"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.contactInfo.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: {
                      ...formData.contactInfo,
                      website: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                required
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                value={formData.address.country}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.postalCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      postalCode: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.timezone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, timezone: e.target.value },
                  })
                }
              >
                <option value="Asia/Jakarta">
                  WIB - Jakarta, Surabaya (GMT+7)
                </option>
                <option value="Asia/Makassar">
                  WITA - Makassar, Bali (GMT+8)
                </option>
                <option value="Asia/Jayapura">
                  WIT - Jayapura, Papua (GMT+9)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Operational Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Slot Duration (minutes)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.operationalSettings.appointmentSlotDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operationalSettings: {
                      ...formData.operationalSettings,
                      appointmentSlotDuration: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto Logout Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.operationalSettings.autoLogoutDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operationalSettings: {
                      ...formData.operationalSettings,
                      autoLogoutDuration: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Language
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.operationalSettings.defaultLanguage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operationalSettings: {
                      ...formData.operationalSettings,
                      defaultLanguage: e.target.value,
                    },
                  })
                }
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Financial Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Currency
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.financialSettings.primaryCurrency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    financialSettings: {
                      ...formData.financialSettings,
                      primaryCurrency: e.target.value,
                    },
                  })
                }
              >
                <option value="IDR">IDR - Indonesian Rupiah</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Prefix (auto-generated)
              </label>
              <input
                type="text"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                value={`${formData.code || "CODE"}-INV-`}
              />
              <p className="text-xs text-gray-500 mt-1">Based on clinic code</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/dashboard/admin"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? "Creating..." : "Create Clinic"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
