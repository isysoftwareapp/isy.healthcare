"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  DollarSign,
  Users,
  Calendar,
  Package,
  TrendingUp,
  Download,
  Filter,
  Loader2,
} from "lucide-react";

export default function ReportsPage() {
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights and performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Link
          href="/dashboard/reports/financial"
          className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-green-500 hover:bg-green-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Financial Reports
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Revenue, payments, and financial analytics
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>• Revenue trends</li>
            <li>• Payment methods</li>
            <li>• Outstanding invoices</li>
          </ul>
        </Link>

        <Link
          href="/dashboard/reports/patients"
          className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Patient Statistics
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Demographics and patient analytics
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>• Patient demographics</li>
            <li>• Registration trends</li>
            <li>• Insurance coverage</li>
          </ul>
        </Link>

        <Link
          href="/dashboard/reports/appointments"
          className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-purple-500 hover:bg-purple-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-3 rounded-full group-hover:bg-purple-200">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Appointment Analytics
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Scheduling patterns and metrics
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>• Completion rates</li>
            <li>• Peak hours/days</li>
            <li>• No-show analysis</li>
          </ul>
        </Link>

        <Link
          href="/dashboard/reports/inventory"
          className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-yellow-500 hover:bg-yellow-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-100 p-3 rounded-full group-hover:bg-yellow-200">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Inventory Reports
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Stock levels and pharmacy analytics
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>• Stock valuation</li>
            <li>• Low stock alerts</li>
            <li>• Expiry tracking</li>
          </ul>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">This Month Revenue</p>
            <p className="text-2xl font-bold text-green-600">$0</p>
            <p className="text-xs text-gray-500 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              vs last month
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Patients</p>
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-xs text-gray-500 mt-1">Active patients</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Appointments</p>
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Inventory Value</p>
            <p className="text-2xl font-bold text-yellow-600">$0</p>
            <p className="text-xs text-gray-500 mt-1">Total stock value</p>
          </div>
        </div>
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Custom Report Builder
        </h2>
        <p className="text-gray-600 mb-6">
          Create custom reports by selecting data points and filters
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Financial Summary</option>
              <option>Patient Demographics</option>
              <option>Appointment Analysis</option>
              <option>Inventory Valuation</option>
              <option>Custom Query</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last Quarter</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>PDF</option>
              <option>CSV</option>
              <option>Excel</option>
              <option>JSON</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Generate Report
          </button>
          <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}
