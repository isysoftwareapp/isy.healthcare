"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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

  // New state for enhanced features
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("IDR");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 15000,
    EUR: 16000,
    AUD: 10000,
  });
  const [hideEmptyServices, setHideEmptyServices] = useState(false);

  // Collapsible categories state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.filter((c) => c !== "All"))
  );

  // Price column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    local: true,
    localWithInsurance: true,
    tourist: true,
    touristWithInsurance: true,
  });

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    title: "Medical Pricelist",
    subtitle: "Healthcare Services Pricing",
    logo: "",
    footer: "© 2025 ISY Healthcare. All rights reserved.",
  });

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

  const fetchClinics = async () => {
    try {
      const res = await fetch("/api/clinics");
      const data = await res.json();
      if (res.ok) {
        setClinics(data.clinics || []);
        // Set first clinic as default if user has access to multiple
        if (data.clinics && data.clinics.length > 0 && !selectedClinic) {
          setSelectedClinic(data.clinics[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const res = await fetch("/api/exchange-rates");
      const data = await res.json();
      if (res.ok && data.rates) {
        const ratesMap: Record<string, number> = {};
        data.rates.forEach((rate: any) => {
          if (rate.baseCurrency === "IDR" && rate.isActive) {
            ratesMap[rate.targetCurrency] = rate.rate;
          }
        });
        setExchangeRates(ratesMap);
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, searchTerm, selectedClinic, hideEmptyServices]);

  useEffect(() => {
    if (selectedCurrency !== "IDR") {
      fetchExchangeRates();
    }
  }, [selectedCurrency]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "All")
        params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);
      if (selectedClinic) params.append("clinicId", selectedClinic);

      const res = await fetch(`/api/pricelists?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        let filteredServices = data.services || [];

        // Filter out empty services if toggle is on
        if (hideEmptyServices) {
          filteredServices = filteredServices.filter((service: Service) => {
            return (
              service.isActive &&
              (service.pricing.local > 0 ||
                service.pricing.localWithInsurance > 0 ||
                service.pricing.tourist > 0 ||
                service.pricing.touristWithInsurance > 0)
            );
          });
        }

        setServices(filteredServices);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const convertPrice = (amount: number): number => {
    if (selectedCurrency === "IDR") return amount;
    const rate = exchangeRates[selectedCurrency];
    if (!rate) return amount;
    return amount / rate;
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
    const convertedAmount = convertPrice(amount);
    const currencyMap: Record<string, string> = {
      IDR: "id-ID",
      USD: "en-US",
      EUR: "de-DE",
      AUD: "en-AU",
    };
    const locale = currencyMap[selectedCurrency] || "id-ID";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: selectedCurrency,
      minimumFractionDigits: selectedCurrency === "IDR" ? 0 : 2,
    }).format(convertedAmount);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAllCategories = (expand: boolean) => {
    if (expand) {
      setExpandedCategories(new Set(categories.filter((c) => c !== "All")));
    } else {
      setExpandedCategories(new Set());
    }
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const exportToPDF = async () => {
    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "landscape" });

      // Add title
      doc.setFontSize(18);
      doc.text(exportSettings.title, 14, 15);

      // Add subtitle
      doc.setFontSize(12);
      doc.text(exportSettings.subtitle, 14, 22);

      // Add clinic and currency info
      const clinicName =
        clinics.find((c) => c._id === selectedClinic)?.clinicName ||
        "All Clinics";
      doc.setFontSize(10);
      doc.text(`Clinic: ${clinicName} | Currency: ${selectedCurrency}`, 14, 28);

      let yOffset = 35;

      // Export each expanded category
      Object.entries(groupedServices).forEach(
        ([category, categoryServices]) => {
          if (expandedCategories.has(category)) {
            // Category header
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yOffset, doc.internal.pageSize.width - 28, 8, "F");
            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text(
              `${category} (${categoryServices.length})`,
              16,
              yOffset + 5
            );
            yOffset += 10;

            // Table headers
            const headers = [["Service ID", "Service Name"]];
            if (visibleColumns.local) headers[0].push("Local");
            if (visibleColumns.localWithInsurance)
              headers[0].push("Local + Ins");
            if (visibleColumns.tourist) headers[0].push("Tourist");
            if (visibleColumns.touristWithInsurance)
              headers[0].push("Tourist + Ins");
            headers[0].push("Status");

            // Table data
            const data = categoryServices.map((service) => {
              const row = [service.serviceId, service.serviceName];
              if (visibleColumns.local)
                row.push(formatCurrency(service.pricing.local));
              if (visibleColumns.localWithInsurance)
                row.push(formatCurrency(service.pricing.localWithInsurance));
              if (visibleColumns.tourist)
                row.push(formatCurrency(service.pricing.tourist));
              if (visibleColumns.touristWithInsurance)
                row.push(formatCurrency(service.pricing.touristWithInsurance));
              row.push(service.isActive ? "Active" : "Inactive");
              return row;
            });

            autoTable(doc, {
              head: headers,
              body: data,
              startY: yOffset,
              theme: "grid",
              styles: { fontSize: 8 },
              headStyles: { fillColor: [66, 139, 202] },
              margin: { left: 14, right: 14 },
            });

            yOffset = (doc as any).lastAutoTable.finalY + 10;
          }
        }
      );

      // Add footer
      const pageCount = (doc as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(exportSettings.footer, 14, doc.internal.pageSize.height - 10);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`pricelist-${Date.now()}.pdf`);
      setShowExportModal(false);
    } catch (error) {
      console.error("PDF export error:", error);
      alert(
        "Failed to export PDF. Make sure to install: npm install jspdf jspdf-autotable"
      );
    }
  };

  const exportToExcel = async () => {
    try {
      // Dynamic import
      const XLSX = await import("xlsx");

      const workbook = XLSX.utils.book_new();

      // Export each expanded category as a separate sheet
      Object.entries(groupedServices).forEach(
        ([category, categoryServices]) => {
          if (expandedCategories.has(category)) {
            const headers = ["Service ID", "Service Name"];
            if (visibleColumns.local) headers.push("Local");
            if (visibleColumns.localWithInsurance)
              headers.push("Local + Insurance");
            if (visibleColumns.tourist) headers.push("Tourist");
            if (visibleColumns.touristWithInsurance)
              headers.push("Tourist + Insurance");
            headers.push("Status");

            const data = categoryServices.map((service) => {
              const row: any = {
                "Service ID": service.serviceId,
                "Service Name": service.serviceName,
              };
              if (visibleColumns.local)
                row["Local"] = convertPrice(service.pricing.local);
              if (visibleColumns.localWithInsurance)
                row["Local + Insurance"] = convertPrice(
                  service.pricing.localWithInsurance
                );
              if (visibleColumns.tourist)
                row["Tourist"] = convertPrice(service.pricing.tourist);
              if (visibleColumns.touristWithInsurance)
                row["Tourist + Insurance"] = convertPrice(
                  service.pricing.touristWithInsurance
                );
              row["Status"] = service.isActive ? "Active" : "Inactive";
              return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(data);

            // Auto-fit column widths
            const maxWidth = 50;
            const colWidths = headers.map((header) => {
              const maxLen = Math.max(
                header.length,
                ...data.map((row) => String(row[header] || "").length)
              );
              return { wch: Math.min(maxLen + 2, maxWidth) };
            });
            worksheet["!cols"] = colWidths;

            // Safe sheet name (Excel limits to 31 chars, no special chars)
            const sheetName = category
              .substring(0, 31)
              .replace(/[:\\/?*\[\]]/g, "");
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
          }
        }
      );

      const clinicName =
        clinics.find((c) => c._id === selectedClinic)?.clinicName || "All";
      XLSX.writeFile(workbook, `pricelist-${clinicName}-${Date.now()}.xlsx`);
      setShowExportModal(false);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Failed to export Excel. Make sure to install: npm install xlsx");
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
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
          <div className="flex gap-4 flex-1 flex-wrap">
            {/* Clinic Selector */}
            {["Admin", "Director"].includes(session.user.role) &&
              clinics.length > 1 && (
                <select
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Clinics</option>
                  {clinics.map((clinic) => (
                    <option key={clinic._id} value={clinic._id}>
                      {clinic.clinicName}
                    </option>
                  ))}
                </select>
              )}

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

            {/* Currency Selector */}
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="IDR">IDR (Rupiah)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="AUD">AUD (Australian Dollar)</option>
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {/* Hide Empty Services Toggle */}
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={hideEmptyServices}
                onChange={(e) => setHideEmptyServices(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Hide Empty
              </span>
            </label>
          </div>

          {/* Add Button */}
          {["Admin" as any, "Director" as any, "Finance" as any].includes(
            session.user.role
          ) && (
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

        {/* Price Column Selection & Category Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between mt-4 pt-4 border-t">
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              Show Columns:
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleColumns.local}
                onChange={() => toggleColumn("local")}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Local</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleColumns.localWithInsurance}
                onChange={() => toggleColumn("localWithInsurance")}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Local + Ins</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleColumns.tourist}
                onChange={() => toggleColumn("tourist")}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Tourist</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleColumns.touristWithInsurance}
                onChange={() => toggleColumn("touristWithInsurance")}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Tourist + Ins</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => toggleAllCategories(true)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Expand All
            </button>
            <button
              onClick={() => toggleAllCategories(false)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Collapse All
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Services by Category (Collapsible) */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No services found
          </div>
        ) : (
          Object.entries(groupedServices).map(
            ([category, categoryServices]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryColor =
                categoryColors[category] || categoryColors.Other;

              return (
                <div
                  key={category}
                  className="bg-white rounded-lg shadow overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${categoryColor.bg} ${categoryColor.text}`}
                      >
                        {category}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({categoryServices.length} service
                        {categoryServices.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  </button>

                  {/* Category Content */}
                  {isExpanded && (
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
                            {visibleColumns.local && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Local
                              </th>
                            )}
                            {visibleColumns.localWithInsurance && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Local + Ins
                              </th>
                            )}
                            {visibleColumns.tourist && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Tourist
                              </th>
                            )}
                            {visibleColumns.touristWithInsurance && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Tourist + Ins
                              </th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categoryServices.map((service) => (
                            <tr
                              key={service._id}
                              onClick={() =>
                                [
                                  "Admin" as any,
                                  "Director" as any,
                                  "Finance" as any,
                                ].includes(session?.user?.role) &&
                                handleEdit(service)
                              }
                              className={`hover:bg-gray-50 transition-colors ${
                                [
                                  "Admin" as any,
                                  "Director" as any,
                                  "Finance" as any,
                                ].includes(session?.user?.role)
                                  ? "cursor-pointer"
                                  : ""
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {service.serviceId}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
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
                              {visibleColumns.local && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatCurrency(service.pricing.local)}
                                </td>
                              )}
                              {visibleColumns.localWithInsurance && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatCurrency(
                                    service.pricing.localWithInsurance
                                  )}
                                </td>
                              )}
                              {visibleColumns.tourist && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatCurrency(service.pricing.tourist)}
                                </td>
                              )}
                              {visibleColumns.touristWithInsurance && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatCurrency(
                                    service.pricing.touristWithInsurance
                                  )}
                                </td>
                              )}
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
              );
            }
          )
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
                ["Admin" as any, "Director" as any].includes(
                  session.user.role
                ) && (
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Export Pricelist</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF Title
                </label>
                <input
                  type="text"
                  value={exportSettings.title}
                  onChange={(e) =>
                    setExportSettings({
                      ...exportSettings,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Medical Pricelist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF Subtitle
                </label>
                <input
                  type="text"
                  value={exportSettings.subtitle}
                  onChange={(e) =>
                    setExportSettings({
                      ...exportSettings,
                      subtitle: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Healthcare Services Pricing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL (optional)
                </label>
                <input
                  type="text"
                  value={exportSettings.logo}
                  onChange={(e) =>
                    setExportSettings({
                      ...exportSettings,
                      logo: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Text
                </label>
                <textarea
                  value={exportSettings.footer}
                  onChange={(e) =>
                    setExportSettings({
                      ...exportSettings,
                      footer: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., © 2025 ISY Healthcare"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Export Info:</strong>
                  <br />
                  • Only expanded categories will be exported
                  <br />
                  • Only checked price columns will be included
                  <br />• Currency: {selectedCurrency}
                  <br />• Clinic:{" "}
                  {clinics.find((c) => c._id === selectedClinic)?.clinicName ||
                    "All Clinics"}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={exportToPDF}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Export as PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
