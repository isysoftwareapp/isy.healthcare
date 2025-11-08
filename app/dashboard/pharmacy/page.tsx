"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Pill,
  AlertTriangle,
  Package,
  TrendingDown,
  Clock,
  Plus,
  Search,
  Loader2,
  Filter,
} from "lucide-react";

interface Medication {
  _id: string;
  name: string;
  form: string;
  strength: string;
  currentStock: number;
  reorderLevel: number;
  hasLowStock: boolean;
  hasExpiringSoon: boolean;
  hasExpired: boolean;
}

interface Alert {
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

interface Summary {
  total: number;
  lowStock: number;
  expiringSoon: number;
  expired: number;
  totalValue: number;
}

export default function PharmacyDashboard() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "low-stock" | "expiring"
  >("all");
  const [selectedClinic, setSelectedClinic] = useState<string>("");

  useEffect(() => {
    // Get clinic from session or default
    const clinicId = "default-clinic-id"; // In real app, get from session/context
    setSelectedClinic(clinicId);
    fetchData(clinicId);
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      fetchData(selectedClinic);
    }
  }, [filterType]);

  const fetchData = async (clinicId: string) => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams({ clinic: clinicId });
      if (filterType === "low-stock") {
        params.append("lowStock", "true");
      } else if (filterType === "expiring") {
        params.append("expiringSoon", "true");
      }

      // Fetch medications
      const medsResponse = await fetch(`/api/medications?${params}`);
      const medsData = await medsResponse.json();

      if (medsData.success) {
        setMedications(medsData.data);
        setSummary(medsData.summary);
      }

      // Fetch alerts
      const alertsResponse = await fetch(
        `/api/medications/alerts?clinic=${clinicId}`
      );
      const alertsData = await alertsResponse.json();

      if (alertsData.success) {
        setAlerts(alertsData.summary);
      }
    } catch (error) {
      console.error("Error fetching pharmacy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockLevelColor = (medication: Medication) => {
    if (medication.currentStock === 0) return "text-red-600";
    if (medication.hasLowStock) return "text-orange-600";
    return "text-green-600";
  };

  const getStockLevelBg = (medication: Medication) => {
    if (medication.currentStock === 0) return "bg-red-50";
    if (medication.hasLowStock) return "bg-orange-50";
    return "bg-green-50";
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pharmacy inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pharmacy Inventory
          </h1>
          <p className="text-gray-600 mt-1">
            Manage medication stock and dispensing
          </p>
        </div>
        <Link
          href="/dashboard/pharmacy/medications/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Medication</span>
        </Link>
      </div>

      {/* Alert Cards */}
      {alerts && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Medications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.total || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Pill className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.lowStockCount}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {alerts.expiringSoonCount}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.expiredCount}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Link
          href="/dashboard/pharmacy/dispense"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Package className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Dispense Medication</h3>
          <p className="text-sm text-gray-600 mt-1">Process prescriptions</p>
        </Link>

        <Link
          href="/dashboard/pharmacy/receive"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Receive Stock</h3>
          <p className="text-sm text-gray-600 mt-1">Add new inventory</p>
        </Link>

        <Link
          href="/dashboard/pharmacy/alerts"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <AlertTriangle className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">View Alerts</h3>
          <p className="text-sm text-gray-600 mt-1">Check warnings</p>
        </Link>

        <Link
          href="/dashboard/pharmacy/reports"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Package className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-600 mt-1">Stock reports</p>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search medications..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("low-stock")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "low-stock"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilterType("expiring")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "expiring"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Expiring
            </button>
          </div>
        </div>
      </div>

      {/* Medications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Medication Inventory
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredMedications.length} medication
            {filteredMedications.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredMedications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No medications found</p>
            <p className="text-sm mt-2">
              {searchTerm
                ? "Try a different search term"
                : "Add your first medication to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medication
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Level
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedications.map((medication) => (
                  <tr key={medication._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {medication.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {medication.strength}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {medication.form}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-semibold ${getStockLevelColor(
                          medication
                        )}`}
                      >
                        {medication.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {medication.reorderLevel}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {medication.hasLowStock && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                            Low Stock
                          </span>
                        )}
                        {medication.hasExpiringSoon && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            Expiring
                          </span>
                        )}
                        {medication.hasExpired && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/dashboard/pharmacy/medications/${medication._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
