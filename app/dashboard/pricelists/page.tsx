"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Pricing {
  local: number;
  localWithInsurance: number;
  tourist: number;
  touristWithInsurance: number;
  insurance: number; // Always 0
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
    name: string;
  };
  insuranceProvider?: string; // New field for insurance provider dropdown
  insuranceProvider2?: string; // Second insurance provider field
  // Additional hospital fields
  serviceCode?: string;
  unit?: string;
  estimatedDuration?: number;
  requiresDoctor?: boolean;
  requiresEquipment?: string[];
  notes?: string;
}

// Default category colors
const defaultCategoryColors: Record<string, { bg: string; text: string }> = {
  Consultation: { bg: "bg-blue-100", text: "text-blue-800" },
  Procedure: { bg: "bg-purple-100", text: "text-purple-800" },
  Laboratory: { bg: "bg-green-100", text: "text-green-800" },
  Radiology: { bg: "bg-orange-100", text: "text-orange-800" },
  Pharmacy: { bg: "bg-pink-100", text: "text-pink-800" },
  Other: { bg: "bg-gray-100", text: "text-gray-800" },
};

// Available color options for categories
const colorOptions = [
  { name: "Gray", bg: "bg-gray-100", text: "text-gray-800" },
  { name: "Blue", bg: "bg-blue-100", text: "text-blue-800" },
  { name: "Green", bg: "bg-green-100", text: "text-green-800" },
  { name: "Purple", bg: "bg-purple-100", text: "text-purple-800" },
  { name: "Pink", bg: "bg-pink-100", text: "text-pink-800" },
  { name: "Orange", bg: "bg-orange-100", text: "text-orange-800" },
  { name: "Red", bg: "bg-red-100", text: "text-red-800" },
  { name: "Yellow", bg: "bg-yellow-100", text: "text-yellow-800" },
  { name: "Indigo", bg: "bg-indigo-100", text: "text-indigo-800" },
  { name: "Teal", bg: "bg-teal-100", text: "text-teal-800" },
];

// Insurance provider options
const insuranceProviders = [
  "none",
  "BPJS Kesehatan",
  "Prudential",
  "Allianz",
  "AXA Mandiri",
  "Manulife",
  "Cifna",
  "Sinarmas",
  "BRI Life",
  "BNI Life",
  "Mandiri Inhealth",
];

// Categories will be managed dynamically in component state

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

  // Selected service prices for export (serviceId_priceType format)
  const [selectedPrices, setSelectedPrices] = useState<Set<string>>(new Set());

  // Price column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    local: true,
    localWithInsurance: true,
    tourist: true,
    touristWithInsurance: true,
    insurance: true,
    insurance2: true,
  });

  // Insurance provider column titles
  const [insuranceColumnTitle, setInsuranceColumnTitle] = useState("none");
  const [insuranceColumnTitle2, setInsuranceColumnTitle2] = useState("none");

  // Copy/paste functionality
  const [copiedServiceNames, setCopiedServiceNames] = useState<
    Record<string, string>
  >({});

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    title: "Medical Pricelist",
    subtitle: "Healthcare Services Pricing",
    logo: "",
    logoFile: null as File | null,
    footer: "© 2025 ISY Healthcare. All rights reserved.",
  });

  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([
    "Consultation",
    "Procedure",
    "Laboratory",
    "Radiology",
    "Pharmacy",
    "Other",
  ]);
  const [categoryColors, setCategoryColors] = useState<
    Record<string, { bg: string; text: string }>
  >({ ...defaultCategoryColors });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryColorInput, setCategoryColorInput] = useState({
    bg: "bg-gray-100",
    text: "text-gray-800",
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
      insurance: 0, // Always 0
    },
    // default assigned clinic; prefer current UI selection or user's first assigned clinic
    assignedClinic: selectedClinic || session?.user?.assignedClinics?.[0] || "",
    insuranceProvider: "Rp 0", // New field
    insuranceProvider2: "Rp 0", // Second insurance provider field
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
      const result = await res.json();
      if (res.ok) {
        const clinicsData = result.data || result.clinics || [];
        setClinics(clinicsData);
        // Set first clinic as default if user has access to multiple
        if (clinicsData.length > 0 && !selectedClinic) {
          setSelectedClinic(clinicsData[0]._id);
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

        // Clear insurance provider fields on load so they always show "Rp 0"
        filteredServices = filteredServices.map((service: Service) => ({
          ...service,
          insuranceProvider: undefined,
          insuranceProvider2: undefined,
        }));

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
            // prefer explicit form value, then currently selected clinic in UI,
            // then user's first assigned clinic to satisfy server validation
            assignedClinic:
              formData.assignedClinic ||
              selectedClinic ||
              session?.user?.assignedClinics?.[0] ||
              "",
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
      pricing: {
        ...service.pricing,
        insurance: service.pricing.insurance || 0, // Ensure insurance field exists
      },
      assignedClinic: service.assignedClinic._id,
      insuranceProvider: service.insuranceProvider || "none",
      insuranceProvider2: service.insuranceProvider2 || "none",
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
        insurance: 0,
      },
      assignedClinic: "",
      insuranceProvider: "none",
      insuranceProvider2: "none",
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

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  // Toggle individual service price selection
  const toggleServicePrice = (serviceId: string, priceType: string) => {
    const key = `${serviceId}_${priceType}`;
    const newSelected = new Set(selectedPrices);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedPrices(newSelected);
  };

  // Check if a service price is selected
  const isPriceSelected = (serviceId: string, priceType: string) => {
    return selectedPrices.has(`${serviceId}_${priceType}`);
  };

  // Copy service prices for paste functionality
  const copyCheckedServiceNames = () => {
    const copiedPrices: Record<string, string> = {};

    services.forEach((service) => {
      const priceTypes: (keyof Pricing)[] = [
        "local",
        "localWithInsurance",
        "tourist",
        "touristWithInsurance",
      ];

      priceTypes.forEach((priceType) => {
        if (isPriceSelected(service.serviceId, priceType)) {
          copiedPrices[service.serviceName] = formatCurrency(
            service.pricing[priceType]
          );
        }
      });
    });

    setCopiedServiceNames(copiedPrices);
    // Also save to localStorage for persistence
    localStorage.setItem("copiedServiceNames", JSON.stringify(copiedPrices));
  };

  // Paste service prices to insurance provider
  const pasteServiceNames = async (targetServiceId?: string) => {
    if (!Object.keys(copiedServiceNames).length) return;

    if (targetServiceId) {
      // Paste to specific service (when called from individual paste button)
      const service = services.find((s) => s.serviceId === targetServiceId);
      if (!service) return;

      const price = copiedServiceNames[service.serviceName];
      if (!price) return;

      try {
        const res = await fetch("/api/pricelists", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: service._id,
            insuranceProvider: price,
          }),
        });

        if (res.ok) {
          // Update local state
          const updatedServices = services.map((s) =>
            s.serviceId === targetServiceId
              ? { ...s, insuranceProvider: price }
              : s
          );
          setServices(updatedServices);
        } else {
          console.error("Failed to update insurance provider");
        }
      } catch (error) {
        console.error("Error updating insurance provider:", error);
      }
    } else {
      // Paste to insurance provider columns based on which checkboxes are selected
      const checkedServicesInsurance1 = services.filter((service) =>
        isPriceSelected(service.serviceId, "insurance")
      );
      const checkedServicesInsurance2 = services.filter((service) =>
        isPriceSelected(service.serviceId, "insurance2")
      );

      // Paste to insurance provider 1 if it has checked items
      if (checkedServicesInsurance1.length > 0) {
        for (const service of checkedServicesInsurance1) {
          const price = copiedServiceNames[service.serviceName];
          if (!price) continue;

          try {
            const res = await fetch("/api/pricelists", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                _id: service._id,
                insuranceProvider: price,
              }),
            });

            if (res.ok) {
              // Update local state for this service
              setServices((prevServices) =>
                prevServices.map((s) =>
                  s.serviceId === service.serviceId
                    ? { ...s, insuranceProvider: price }
                    : s
                )
              );
            } else {
              console.error(
                "Failed to update insurance provider for service:",
                service.serviceId
              );
            }
          } catch (error) {
            console.error(
              "Error updating insurance provider for service:",
              service.serviceId,
              error
            );
          }
        }
      }

      // Paste to insurance provider 2 if it has checked items
      if (checkedServicesInsurance2.length > 0) {
        for (const service of checkedServicesInsurance2) {
          const price = copiedServiceNames[service.serviceName];
          if (!price) continue;

          try {
            const res = await fetch("/api/pricelists", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                _id: service._id,
                insuranceProvider2: price,
              }),
            });

            if (res.ok) {
              // Update local state for this service
              setServices((prevServices) =>
                prevServices.map((s) =>
                  s.serviceId === service.serviceId
                    ? { ...s, insuranceProvider2: price }
                    : s
                )
              );
            } else {
              console.error(
                "Failed to update insurance provider 2 for service:",
                service.serviceId
              );
            }
          } catch (error) {
            console.error(
              "Error updating insurance provider 2 for service:",
              service.serviceId,
              error
            );
          }
        }
      }
    }
  };

  // Load copied service names from localStorage on component mount
  useEffect(() => {
    const savedServiceNames = localStorage.getItem("copiedServiceNames");
    if (savedServiceNames) {
      try {
        setCopiedServiceNames(JSON.parse(savedServiceNames));
      } catch (error) {
        console.error("Error parsing saved service names:", error);
      }
    }
  }, []);

  // Update service price directly from table
  const updateServicePrice = async (
    serviceId: string,
    priceType: keyof Pricing,
    newPrice: number
  ) => {
    try {
      const service = services.find((s) => s.serviceId === serviceId);
      if (!service) return;

      const updatedPricing = { ...service.pricing, [priceType]: newPrice };

      const res = await fetch("/api/pricelists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: service._id,
          pricing: updatedPricing,
        }),
      });

      if (res.ok) {
        // Update local state
        setServices((prevServices) =>
          prevServices.map((s) =>
            s.serviceId === serviceId ? { ...s, pricing: updatedPricing } : s
          )
        );
      } else {
        console.error("Failed to update price");
      }
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  // Category Management Functions
  const handleAddCategory = () => {
    if (!categoryInput.trim()) {
      alert("Category name cannot be empty");
      return;
    }
    if (customCategories.includes(categoryInput.trim())) {
      alert("Category already exists");
      return;
    }
    const newCategory = categoryInput.trim();
    setCustomCategories([...customCategories, newCategory]);
    setCategoryColors({
      ...categoryColors,
      [newCategory]: categoryColorInput,
    });
    setCategoryInput("");
    setCategoryColorInput({ bg: "bg-gray-100", text: "text-gray-800" });
  };

  const handleEditCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setCategoryInput(oldName);
    setCategoryColorInput(
      categoryColors[oldName] || { bg: "bg-gray-100", text: "text-gray-800" }
    );
  };

  const handleUpdateCategory = () => {
    if (!categoryInput.trim()) {
      alert("Category name cannot be empty");
      return;
    }
    if (
      editingCategory !== categoryInput &&
      customCategories.includes(categoryInput.trim())
    ) {
      alert("Category already exists");
      return;
    }

    const newName = categoryInput.trim();

    // Update category name in the list
    setCustomCategories(
      customCategories.map((cat) => (cat === editingCategory ? newName : cat))
    );

    // Update category colors
    const newColors = { ...categoryColors };
    if (editingCategory && editingCategory !== newName) {
      delete newColors[editingCategory];
    }
    newColors[newName] = categoryColorInput;
    setCategoryColors(newColors);

    // Update services that use this category
    setServices(
      services.map((service) =>
        service.category === editingCategory
          ? { ...service, category: newName }
          : service
      )
    );

    setEditingCategory(null);
    setCategoryInput("");
    setCategoryColorInput({ bg: "bg-gray-100", text: "text-gray-800" });
  };

  const handleDeleteCategory = (categoryName: string) => {
    // Check if category is in use
    const servicesUsingCategory = services.filter(
      (s) => s.category === categoryName
    );

    if (servicesUsingCategory.length > 0) {
      const confirmDelete = confirm(
        `This category has ${servicesUsingCategory.length} service(s). Delete anyway? Services will be moved to "Other" category.`
      );
      if (!confirmDelete) return;

      // Move services to "Other"
      setServices(
        services.map((service) =>
          service.category === categoryName
            ? { ...service, category: "Other" }
            : service
        )
      );
    }

    setCustomCategories(customCategories.filter((cat) => cat !== categoryName));
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCategoryInput("");
    setCategoryColorInput({ bg: "bg-gray-100", text: "text-gray-800" });
  };

  // Handle logo file upload
  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, etc.)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setExportSettings({
        ...exportSettings,
        logo: base64String,
        logoFile: file,
      });
    };
    reader.readAsDataURL(file);
  };

  const exportToPDF = async () => {
    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "landscape" });

      let yOffset = 15;

      // Add logo if provided
      if (exportSettings.logo) {
        try {
          // Determine image format from base64 string
          let format = "PNG";
          if (exportSettings.logo.includes("data:image/jpeg")) format = "JPEG";
          else if (exportSettings.logo.includes("data:image/jpg"))
            format = "JPEG";
          else if (exportSettings.logo.includes("data:image/png"))
            format = "PNG";

          doc.addImage(exportSettings.logo, format, 14, yOffset, 40, 20);
          yOffset += 25;
        } catch (error) {
          console.error("Error adding logo to PDF:", error);
          alert(
            "Logo could not be added to PDF. Please try a different image."
          );
        }
      }

      // Add title
      doc.setFontSize(18);
      doc.text(exportSettings.title, 14, yOffset);
      yOffset += 7;

      // Add subtitle
      doc.setFontSize(12);
      doc.text(exportSettings.subtitle, 14, yOffset);
      yOffset += 6;

      // Add clinic and currency info
      const clinicName =
        clinics.find((c) => c._id === selectedClinic)?.name || "All Clinics";
      doc.setFontSize(10);
      doc.text(
        `Clinic: ${clinicName} | Currency: ${selectedCurrency}`,
        14,
        yOffset
      );
      yOffset += 7;

      // Export all services with checked prices
      const servicesWithCheckedPrices = services.filter((service) => {
        return (
          isPriceSelected(service.serviceId, "local") ||
          isPriceSelected(service.serviceId, "localWithInsurance") ||
          isPriceSelected(service.serviceId, "tourist") ||
          isPriceSelected(service.serviceId, "touristWithInsurance") ||
          isPriceSelected(service.serviceId, "insurance") ||
          isPriceSelected(service.serviceId, "insurance2")
        );
      });

      // SKIP if no services have checked prices
      if (servicesWithCheckedPrices.length === 0) {
        doc.setFontSize(12);
        doc.text("No services selected for export", 14, yOffset);
        return;
      }

      // Table headers
      const headers = [["Service Name", "Category"]];

      // Only include columns that have at least one checked item
      const hasLocalChecked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "local")
      );
      const hasLocalWithInsuranceChecked = servicesWithCheckedPrices.some(
        (service) => isPriceSelected(service.serviceId, "localWithInsurance")
      );
      const hasTouristChecked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "tourist")
      );
      const hasTouristWithInsuranceChecked = servicesWithCheckedPrices.some(
        (service) => isPriceSelected(service.serviceId, "touristWithInsurance")
      );
      const hasInsuranceChecked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "insurance")
      );
      const hasInsurance2Checked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "insurance2")
      );

      if (visibleColumns.local && hasLocalChecked) headers[0].push("Local");
      if (visibleColumns.localWithInsurance && hasLocalWithInsuranceChecked)
        headers[0].push("Local + Ins");
      if (visibleColumns.tourist && hasTouristChecked)
        headers[0].push("Tourist");
      if (visibleColumns.touristWithInsurance && hasTouristWithInsuranceChecked)
        headers[0].push("Tourist + Ins");
      if (visibleColumns.insurance && hasInsuranceChecked)
        headers[0].push(
          insuranceColumnTitle === "none"
            ? "Insurance Provider"
            : insuranceColumnTitle
        );
      if (visibleColumns.insurance2 && hasInsurance2Checked)
        headers[0].push(
          insuranceColumnTitle2 === "none"
            ? "Insurance Provider 2"
            : insuranceColumnTitle2
        );

      // Table data - ONLY include rows where at least one price is checked
      const data = servicesWithCheckedPrices.map((service) => {
        const row = [service.serviceName, service.category];
        // Only add checked prices for columns that are included in headers
        if (
          visibleColumns.local &&
          hasLocalChecked &&
          isPriceSelected(service.serviceId, "local")
        )
          row.push(formatCurrency(service.pricing.local));

        if (
          visibleColumns.localWithInsurance &&
          hasLocalWithInsuranceChecked &&
          isPriceSelected(service.serviceId, "localWithInsurance")
        )
          row.push(formatCurrency(service.pricing.localWithInsurance));

        if (
          visibleColumns.tourist &&
          hasTouristChecked &&
          isPriceSelected(service.serviceId, "tourist")
        )
          row.push(formatCurrency(service.pricing.tourist));

        if (
          visibleColumns.touristWithInsurance &&
          hasTouristWithInsuranceChecked &&
          isPriceSelected(service.serviceId, "touristWithInsurance")
        )
          row.push(formatCurrency(service.pricing.touristWithInsurance));

        if (
          visibleColumns.insurance &&
          hasInsuranceChecked &&
          isPriceSelected(service.serviceId, "insurance")
        )
          row.push(service.insuranceProvider || "Rp 0");

        if (
          visibleColumns.insurance2 &&
          hasInsurance2Checked &&
          isPriceSelected(service.serviceId, "insurance2")
        )
          row.push(service.insuranceProvider2 || "Rp 0");

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

      // Export all services with checked prices
      const servicesWithCheckedPrices = services.filter((service) => {
        return (
          isPriceSelected(service.serviceId, "local") ||
          isPriceSelected(service.serviceId, "localWithInsurance") ||
          isPriceSelected(service.serviceId, "tourist") ||
          isPriceSelected(service.serviceId, "touristWithInsurance") ||
          isPriceSelected(service.serviceId, "insurance") ||
          isPriceSelected(service.serviceId, "insurance2")
        );
      });

      // SKIP if no services have checked prices
      if (servicesWithCheckedPrices.length === 0) {
        alert("No services selected for export");
        return;
      }

      const headers = ["Service Name", "Category"];

      // Only include columns that have at least one checked item
      const hasLocalChecked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "local")
      );
      const hasLocalWithInsuranceChecked = servicesWithCheckedPrices.some(
        (service) => isPriceSelected(service.serviceId, "localWithInsurance")
      );
      const hasTouristChecked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "tourist")
      );
      const hasTouristWithInsuranceChecked = servicesWithCheckedPrices.some(
        (service) => isPriceSelected(service.serviceId, "touristWithInsurance")
      );
      const hasInsuranceChecked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "insurance")
      );
      const hasInsurance2Checked = servicesWithCheckedPrices.some((service) =>
        isPriceSelected(service.serviceId, "insurance2")
      );

      if (visibleColumns.local && hasLocalChecked) headers.push("Local");
      if (visibleColumns.localWithInsurance && hasLocalWithInsuranceChecked)
        headers.push("Local + Insurance");
      if (visibleColumns.tourist && hasTouristChecked) headers.push("Tourist");
      if (visibleColumns.touristWithInsurance && hasTouristWithInsuranceChecked)
        headers.push("Tourist + Insurance");
      if (visibleColumns.insurance && hasInsuranceChecked)
        headers.push(
          insuranceColumnTitle === "none"
            ? "Insurance Provider"
            : insuranceColumnTitle
        );
      if (visibleColumns.insurance2 && hasInsurance2Checked)
        headers.push(
          insuranceColumnTitle2 === "none"
            ? "Insurance Provider 2"
            : insuranceColumnTitle2
        );

      // Map the filtered services
      const data = servicesWithCheckedPrices.map((service) => {
        const row: any = {
          "Service Name": service.serviceName,
          Category: service.category,
        };
        // Only add checked prices for columns that are included in headers
        if (
          visibleColumns.local &&
          hasLocalChecked &&
          isPriceSelected(service.serviceId, "local")
        )
          row["Local"] = convertPrice(service.pricing.local);

        if (
          visibleColumns.localWithInsurance &&
          hasLocalWithInsuranceChecked &&
          isPriceSelected(service.serviceId, "localWithInsurance")
        )
          row["Local + Insurance"] = convertPrice(
            service.pricing.localWithInsurance
          );

        if (
          visibleColumns.tourist &&
          hasTouristChecked &&
          isPriceSelected(service.serviceId, "tourist")
        )
          row["Tourist"] = convertPrice(service.pricing.tourist);

        if (
          visibleColumns.touristWithInsurance &&
          hasTouristWithInsuranceChecked &&
          isPriceSelected(service.serviceId, "touristWithInsurance")
        )
          row["Tourist + Insurance"] = convertPrice(
            service.pricing.touristWithInsurance
          );

        if (
          visibleColumns.insurance &&
          hasInsuranceChecked &&
          isPriceSelected(service.serviceId, "insurance")
        )
          row[
            insuranceColumnTitle === "none"
              ? "Insurance Provider"
              : insuranceColumnTitle
          ] = service.insuranceProvider || "Rp 0";

        if (
          visibleColumns.insurance2 &&
          hasInsurance2Checked &&
          isPriceSelected(service.serviceId, "insurance2")
        )
          row[
            insuranceColumnTitle2 === "none"
              ? "Insurance Provider 2"
              : insuranceColumnTitle2
          ] = service.insuranceProvider2 || "Rp 0";

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

      XLSX.utils.book_append_sheet(workbook, worksheet, "All Services");
      const clinicName =
        clinics.find((c) => c._id === selectedClinic)?.name || "All";
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

        {/* Clinic Selector */}
        {clinics.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Clinic:
            </label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1 flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All</option>
              {customCategories.map((cat) => (
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

          {/* Manage Categories Button */}
          {["Admin" as any, "Director" as any, "Finance" as any].includes(
            session?.user?.role
          ) && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Manage Categories
            </button>
          )}
        </div>

        {/* Category Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between mt-4 pt-4 border-t">
          <div className="flex gap-2">
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

            {/* Copy Button */}
            <button
              onClick={copyCheckedServiceNames}
              disabled={selectedPrices.size === 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              title="Copy service names of checked prices"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </button>

            {/* Paste Button */}
            <button
              onClick={() => pasteServiceNames()}
              disabled={Object.keys(copiedServiceNames).length === 0}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              title="Paste to checked insurance provider fields"
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Paste
            </button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">All Services</h2>
          <p className="text-sm text-gray-600 mt-1">
            {services.length} services found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Name
                </th>
                {visibleColumns.local && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={services.every((service) =>
                          isPriceSelected(service.serviceId, "local")
                        )}
                        onChange={() => {
                          const allSelected = services.every((service) =>
                            isPriceSelected(service.serviceId, "local")
                          );
                          const newSelected = new Set(selectedPrices);
                          services.forEach((service) => {
                            const key = `${service.serviceId}_local`;
                            if (allSelected) {
                              newSelected.delete(key);
                            } else {
                              newSelected.add(key);
                            }
                          });
                          setSelectedPrices(newSelected);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span>Local</span>
                    </div>
                  </th>
                )}
                {visibleColumns.localWithInsurance && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={services.every((service) =>
                          isPriceSelected(
                            service.serviceId,
                            "localWithInsurance"
                          )
                        )}
                        onChange={() => {
                          const allSelected = services.every((service) =>
                            isPriceSelected(
                              service.serviceId,
                              "localWithInsurance"
                            )
                          );
                          const newSelected = new Set(selectedPrices);
                          services.forEach((service) => {
                            const key = `${service.serviceId}_localWithInsurance`;
                            if (allSelected) {
                              newSelected.delete(key);
                            } else {
                              newSelected.add(key);
                            }
                          });
                          setSelectedPrices(newSelected);
                        }}
                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <span>Local + Ins</span>
                    </div>
                  </th>
                )}
                {visibleColumns.tourist && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={services.every((service) =>
                          isPriceSelected(service.serviceId, "tourist")
                        )}
                        onChange={() => {
                          const allSelected = services.every((service) =>
                            isPriceSelected(service.serviceId, "tourist")
                          );
                          const newSelected = new Set(selectedPrices);
                          services.forEach((service) => {
                            const key = `${service.serviceId}_tourist`;
                            if (allSelected) {
                              newSelected.delete(key);
                            } else {
                              newSelected.add(key);
                            }
                          });
                          setSelectedPrices(newSelected);
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span>Tourist</span>
                    </div>
                  </th>
                )}
                {visibleColumns.touristWithInsurance && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={services.every((service) =>
                          isPriceSelected(
                            service.serviceId,
                            "touristWithInsurance"
                          )
                        )}
                        onChange={() => {
                          const allSelected = services.every((service) =>
                            isPriceSelected(
                              service.serviceId,
                              "touristWithInsurance"
                            )
                          );
                          const newSelected = new Set(selectedPrices);
                          services.forEach((service) => {
                            const key = `${service.serviceId}_touristWithInsurance`;
                            if (allSelected) {
                              newSelected.delete(key);
                            } else {
                              newSelected.add(key);
                            }
                          });
                          setSelectedPrices(newSelected);
                        }}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span>Tourist + Ins</span>
                    </div>
                  </th>
                )}
                {visibleColumns.insurance && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={services.every((service) =>
                          isPriceSelected(service.serviceId, "insurance")
                        )}
                        onChange={() => {
                          const allSelected = services.every((service) =>
                            isPriceSelected(service.serviceId, "insurance")
                          );
                          const newSelected = new Set(selectedPrices);
                          services.forEach((service) => {
                            const key = `${service.serviceId}_insurance`;
                            if (allSelected) {
                              newSelected.delete(key);
                            } else {
                              newSelected.add(key);
                            }
                          });
                          setSelectedPrices(newSelected);
                        }}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <select
                        value={insuranceColumnTitle}
                        onChange={(e) =>
                          setInsuranceColumnTitle(e.target.value)
                        }
                        className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-transparent border-none focus:ring-0 focus:outline-none cursor-pointer"
                      >
                        {insuranceProviders.map((provider) => (
                          <option key={provider} value={provider}>
                            {provider === "none"
                              ? "Insurance Provider"
                              : provider}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                )}
                {visibleColumns.insurance2 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={services.every((service) =>
                          isPriceSelected(service.serviceId, "insurance2")
                        )}
                        onChange={() => {
                          const allSelected = services.every((service) =>
                            isPriceSelected(service.serviceId, "insurance2")
                          );
                          const newSelected = new Set(selectedPrices);
                          services.forEach((service) => {
                            const key = `${service.serviceId}_insurance2`;
                            if (allSelected) {
                              newSelected.delete(key);
                            } else {
                              newSelected.add(key);
                            }
                          });
                          setSelectedPrices(newSelected);
                        }}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <select
                        value={insuranceColumnTitle2}
                        onChange={(e) =>
                          setInsuranceColumnTitle2(e.target.value)
                        }
                        className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-transparent border-none focus:ring-0 focus:outline-none cursor-pointer"
                      >
                        {insuranceProviders.map((provider) => (
                          <option key={provider} value={provider}>
                            {provider === "none"
                              ? "Insurance Provider 2"
                              : provider}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr
                  key={service._id}
                  onClick={() =>
                    [
                      "Admin" as any,
                      "Director" as any,
                      "Finance" as any,
                    ].includes(session?.user?.role) && handleEdit(service)
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
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{service.serviceName}</div>
                      {service.description && (
                        <div className="text-xs text-gray-500">
                          {service.description}
                        </div>
                      )}
                      <div className="text-xs text-blue-600 mt-1">
                        {service.category}
                      </div>
                    </div>
                  </td>
                  {visibleColumns.local && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isPriceSelected(service.serviceId, "local")}
                          onChange={() =>
                            toggleServicePrice(service.serviceId, "local")
                          }
                          className="w-4 h-4 text-blue-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="text"
                          value={formatCurrency(service.pricing.local)}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(
                              /[^\d]/g,
                              ""
                            );
                            updateServicePrice(
                              service.serviceId,
                              "local",
                              parseInt(rawValue) || 0
                            );
                          }}
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.localWithInsurance && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isPriceSelected(
                            service.serviceId,
                            "localWithInsurance"
                          )}
                          onChange={() =>
                            toggleServicePrice(
                              service.serviceId,
                              "localWithInsurance"
                            )
                          }
                          className="w-4 h-4 text-green-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="text"
                          value={formatCurrency(
                            service.pricing.localWithInsurance
                          )}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(
                              /[^\d]/g,
                              ""
                            );
                            updateServicePrice(
                              service.serviceId,
                              "localWithInsurance",
                              parseInt(rawValue) || 0
                            );
                          }}
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.tourist && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isPriceSelected(
                            service.serviceId,
                            "tourist"
                          )}
                          onChange={() =>
                            toggleServicePrice(service.serviceId, "tourist")
                          }
                          className="w-4 h-4 text-purple-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="text"
                          value={formatCurrency(service.pricing.tourist)}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(
                              /[^\d]/g,
                              ""
                            );
                            updateServicePrice(
                              service.serviceId,
                              "tourist",
                              parseInt(rawValue) || 0
                            );
                          }}
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.touristWithInsurance && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isPriceSelected(
                            service.serviceId,
                            "touristWithInsurance"
                          )}
                          onChange={() =>
                            toggleServicePrice(
                              service.serviceId,
                              "touristWithInsurance"
                            )
                          }
                          className="w-4 h-4 text-orange-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="text"
                          value={formatCurrency(
                            service.pricing.touristWithInsurance
                          )}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(
                              /[^\d]/g,
                              ""
                            );
                            updateServicePrice(
                              service.serviceId,
                              "touristWithInsurance",
                              parseInt(rawValue) || 0
                            );
                          }}
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.insurance && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isPriceSelected(
                            service.serviceId,
                            "insurance"
                          )}
                          onChange={() =>
                            toggleServicePrice(service.serviceId, "insurance")
                          }
                          className="w-4 h-4 text-orange-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="relative">
                          <input
                            type="text"
                            value={service.insuranceProvider || "Rp 0"}
                            readOnly
                            className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.insurance2 && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isPriceSelected(
                            service.serviceId,
                            "insurance2"
                          )}
                          onChange={() =>
                            toggleServicePrice(service.serviceId, "insurance2")
                          }
                          className="w-4 h-4 text-orange-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="relative">
                          <input
                            type="text"
                            value={service.insuranceProvider2 || "Rp 0"}
                            readOnly
                            className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {services.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No services found
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
                      {customCategories.map((cat) => (
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

                    {/* Insurance Provider */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Provider
                      </label>
                      <select
                        value={formData.insuranceProvider}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            insuranceProvider: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {insuranceProviders.map((provider) => (
                          <option key={provider} value={provider}>
                            {provider}
                          </option>
                        ))}
                      </select>
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
                            insurance: 0, // Always 0
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage Categories</h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  handleCancelEdit();
                }}
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

            {/* Add/Edit Category Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      editingCategory
                        ? handleUpdateCategory()
                        : handleAddCategory();
                    }
                  }}
                  placeholder="Enter category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Color:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setCategoryColorInput(color)}
                        className={`px-3 py-2 rounded-lg border-2 ${color.bg} ${
                          color.text
                        } ${
                          categoryColorInput.bg === color.bg
                            ? "border-gray-800 ring-2 ring-gray-800"
                            : "border-transparent"
                        } hover:border-gray-400 transition`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingCategory ? (
                    <>
                      <button
                        onClick={handleUpdateCategory}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold mb-3">
                Current Categories ({customCategories.length})
              </h3>
              {customCategories.map((category) => {
                const serviceCount = services.filter(
                  (s) => s.category === category
                ).length;
                const categoryColor =
                  categoryColors[category as keyof typeof categoryColors] ||
                  categoryColors.Other;

                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${categoryColor.bg} ${categoryColor.text}`}
                      >
                        {category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {serviceCount} service{serviceCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Edit category"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="Delete category"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  handleCancelEdit();
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
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
                  Logo Upload (optional)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {exportSettings.logoFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {exportSettings.logoFile.name} (
                      {(exportSettings.logoFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                  {exportSettings.logo && !exportSettings.logoFile && (
                    <div className="text-sm text-gray-500">Logo loaded</div>
                  )}
                </div>
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
                  • All services with checked prices will be exported
                  <br />
                  • Only checked price columns will be included
                  <br />
                  • Prices can be edited directly in the table
                  <br />• Currency: {selectedCurrency}
                  <br />• Clinic:{" "}
                  {clinics.find((c) => c._id === selectedClinic)?.name ||
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
