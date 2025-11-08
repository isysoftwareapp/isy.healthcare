"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Download,
  Filter,
  Loader2,
} from "lucide-react";

interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    averageInvoiceAmount: number;
  };
  invoicesByStatus: { status: string; count: number; total: number }[];
  paymentMethods: { method: string; count: number; total: number }[];
  revenueByPeriod: { period: string; revenue: number }[];
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialReport | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");

  useEffect(() => {
    fetchReport();
  }, [dateRange, groupBy]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        groupBy,
      });

      const response = await fetch(`/api/reports/financial?${params}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching financial report:", error);
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

  const collectionRate =
    data.summary.totalRevenue > 0
      ? (data.summary.totalPaid / data.summary.totalRevenue) * 100
      : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Financial Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Revenue, payments, and financial analytics
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) =>
                  setGroupBy(e.target.value as "day" | "week" | "month")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(data.summary.totalPaid)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {collectionRate.toFixed(1)}% collection rate
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(data.summary.totalOutstanding)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Invoice</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(data.summary.averageInvoiceAmount)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Revenue Trend
        </h2>
        <div className="h-64 flex items-end gap-2">
          {data.revenueByPeriod.map((item, index) => {
            const maxRevenue = Math.max(
              ...data.revenueByPeriod.map((r) => r.revenue)
            );
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full group">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                    style={{ height: `${height * 2}px` }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  {item.period}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Invoice Status
          </h2>
          <div className="space-y-3">
            {data.invoicesByStatus.map((item, index) => {
              const percentage =
                data.summary.totalRevenue > 0
                  ? (item.total / data.summary.totalRevenue) * 100
                  : 0;
              const statusColors: Record<string, string> = {
                draft: "bg-gray-400",
                issued: "bg-blue-500",
                "partially-paid": "bg-yellow-500",
                paid: "bg-green-500",
                cancelled: "bg-red-500",
              };
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.status.replace("-", " ")}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        statusColors[item.status] || "bg-gray-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.count} invoices ({percentage.toFixed(1)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment Methods
          </h2>
          <div className="space-y-3">
            {data.paymentMethods.map((item, index) => {
              const percentage =
                data.summary.totalPaid > 0
                  ? (item.total / data.summary.totalPaid) * 100
                  : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.method.replace("-", " ")}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.count} transactions ({percentage.toFixed(1)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
