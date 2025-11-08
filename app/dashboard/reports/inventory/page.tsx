"use client";

import { useState, useEffect } from "react";
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Download,
  Loader2,
  ShieldCheck,
  Pill,
} from "lucide-react";

interface InventoryReport {
  summary: {
    totalMedications: number;
    totalInventoryValue: number;
    totalSellingValue: number;
    potentialProfit: number;
    lowStockCount: number;
    expiringSoonCount: number;
    expiredCount: number;
  };
  byCategory: { category: string; count: number }[];
  byForm: { form: string; count: number }[];
  stockLevels: {
    outOfStock: number;
    lowStock: number;
    adequate: number;
  };
  topByValue: {
    name: string;
    category: string;
    totalValue: number;
    units: number;
  }[];
  topLowStock: {
    name: string;
    category: string;
    currentStock: number;
    reorderLevel: number;
    shortfall: number;
  }[];
  compliance: {
    prescriptionRequired: number;
    controlledSubstances: number;
    refrigerationRequired: number;
  };
}

export default function InventoryReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryReport | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports/inventory");
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching inventory report:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const profitMargin =
    data.summary.totalSellingValue > 0
      ? (data.summary.potentialProfit / data.summary.totalSellingValue) * 100
      : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventory Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Stock levels and pharmacy analytics
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Medications</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.summary.totalMedications}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(data.summary.totalInventoryValue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Cost basis</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Potential Revenue</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(data.summary.totalSellingValue)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Selling price</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Potential Profit</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(data.summary.potentialProfit)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {profitMargin.toFixed(1)}% margin
          </p>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Low Stock Items
            </h3>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {data.summary.lowStockCount}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Medications below reorder level
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Expiring Soon
            </h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {data.summary.expiringSoonCount}
          </p>
          <p className="text-sm text-gray-600 mt-1">Within 30 days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Expired Items
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-600">
            {data.summary.expiredCount}
          </p>
          <p className="text-sm text-gray-600 mt-1">Requires disposal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Medications by Category
          </h2>
          <div className="space-y-3">
            {data.byCategory.slice(0, 8).map((item, index) => {
              const percentage =
                data.summary.totalMedications > 0
                  ? (item.count / data.summary.totalMedications) * 100
                  : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Medications by Form
          </h2>
          <div className="space-y-3">
            {data.byForm.slice(0, 8).map((item, index) => {
              const percentage =
                data.summary.totalMedications > 0
                  ? (item.count / data.summary.totalMedications) * 100
                  : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.form}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock Levels */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Stock Level Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Out of Stock
              </span>
              <span className="text-lg font-bold text-red-600">
                {data.stockLevels.outOfStock}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-red-500"
                style={{
                  width: `${
                    data.summary.totalMedications > 0
                      ? (data.stockLevels.outOfStock /
                          data.summary.totalMedications) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Low Stock
              </span>
              <span className="text-lg font-bold text-orange-600">
                {data.stockLevels.lowStock}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-orange-500"
                style={{
                  width: `${
                    data.summary.totalMedications > 0
                      ? (data.stockLevels.lowStock /
                          data.summary.totalMedications) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Adequate Stock
              </span>
              <span className="text-lg font-bold text-green-600">
                {data.stockLevels.adequate}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-green-500"
                style={{
                  width: `${
                    data.summary.totalMedications > 0
                      ? (data.stockLevels.adequate /
                          data.summary.totalMedications) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top 10 by Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top 10 Medications by Value
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">
                    Medication
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700">
                    Units
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topByValue.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {item.category}
                      </p>
                    </td>
                    <td className="text-right text-sm text-gray-600">
                      {item.units}
                    </td>
                    <td className="text-right text-sm font-semibold text-green-600">
                      {formatCurrency(item.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Low Stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top 10 Critical Low Stock
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">
                    Medication
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700">
                    Current
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700">
                    Needed
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topLowStock.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {item.category}
                      </p>
                    </td>
                    <td className="text-right">
                      <span className="text-sm font-semibold text-red-600">
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-sm font-semibold text-orange-600">
                        {item.shortfall}
                      </span>
                      <p className="text-xs text-gray-500">
                        (min: {item.reorderLevel})
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Compliance & Safety
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Prescription Required</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.compliance.prescriptionRequired}
              </p>
              <p className="text-xs text-gray-500">
                {data.summary.totalMedications > 0
                  ? (
                      (data.compliance.prescriptionRequired /
                        data.summary.totalMedications) *
                      100
                    ).toFixed(1)
                  : 0}
                % of total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Controlled Substances</p>
              <p className="text-2xl font-bold text-red-600">
                {data.compliance.controlledSubstances}
              </p>
              <p className="text-xs text-gray-500">Requires special tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-cyan-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Refrigeration Required</p>
              <p className="text-2xl font-bold text-cyan-600">
                {data.compliance.refrigerationRequired}
              </p>
              <p className="text-xs text-gray-500">Cold chain management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
