"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  Loader2,
} from "lucide-react";

interface AppointmentReport {
  summary: {
    totalAppointments: number;
    scheduledCount: number;
    confirmedCount: number;
    inProgressCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
    completionRate: number;
    noShowRate: number;
    cancellationRate: number;
    averagePerDay: number;
  };
  appointmentsByType: { type: string; count: number }[];
  appointmentsByDay: { day: string; count: number }[];
  appointmentsByHour: { hour: number; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export default function AppointmentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppointmentReport | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(`/api/reports/appointments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching appointment report:", error);
    } finally {
      setLoading(false);
    }
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

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Appointment Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Scheduling patterns and performance metrics
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.summary.totalAppointments.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Avg {data.summary.averagePerDay.toFixed(1)} per day
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {data.summary.completionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {data.summary.completedCount} completed
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">No-Show Rate</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {data.summary.noShowRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {data.summary.noShowCount} no-shows
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancellation Rate</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {data.summary.cancellationRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {data.summary.cancelledCount} cancelled
          </p>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Daily Appointment Trend
        </h2>
        <div className="h-64 flex items-end gap-1">
          {data.dailyTrend.map((item, index) => {
            const maxCount = Math.max(...data.dailyTrend.map((d) => d.count));
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full group">
                  <div
                    className="w-full bg-linear-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-700 hover:to-purple-500 cursor-pointer"
                    style={{ height: `${height * 2}px` }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {item.date}: {item.count} appointments
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center rotate-45 origin-left">
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Appointments by Day of Week */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Appointments by Day of Week
          </h2>
          <div className="space-y-3">
            {data.appointmentsByDay.map((item, index) => {
              const maxCount = Math.max(
                ...data.appointmentsByDay.map((d) => d.count)
              );
              const percentage =
                maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {dayNames[parseInt(item.day)]}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments by Hour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Appointments by Hour
          </h2>
          <div className="space-y-3">
            {data.appointmentsByHour.map((item, index) => {
              const maxCount = Math.max(
                ...data.appointmentsByHour.map((h) => h.count)
              );
              const percentage =
                maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const isPeakHour = item.count === maxCount && item.count > 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.hour === 0
                        ? "12"
                        : item.hour > 12
                        ? item.hour - 12
                        : item.hour}
                      :00 {item.hour >= 12 ? "PM" : "AM"}
                      {isPeakHour && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Peak
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        isPeakHour ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointment Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Status Distribution
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Scheduled",
                count: data.summary.scheduledCount,
                color: "bg-blue-500",
              },
              {
                label: "Confirmed",
                count: data.summary.confirmedCount,
                color: "bg-cyan-500",
              },
              {
                label: "In Progress",
                count: data.summary.inProgressCount,
                color: "bg-yellow-500",
              },
              {
                label: "Completed",
                count: data.summary.completedCount,
                color: "bg-green-500",
              },
              {
                label: "Cancelled",
                count: data.summary.cancelledCount,
                color: "bg-orange-500",
              },
              {
                label: "No-Show",
                count: data.summary.noShowCount,
                color: "bg-red-500",
              },
            ].map((status, index) => {
              const percentage =
                data.summary.totalAppointments > 0
                  ? (status.count / data.summary.totalAppointments) * 100
                  : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {status.label}
                    </span>
                    <span className="text-sm text-gray-600">
                      {status.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Appointment Types
          </h2>
          <div className="space-y-3">
            {data.appointmentsByType.map((item, index) => {
              const percentage =
                data.summary.totalAppointments > 0
                  ? (item.count / data.summary.totalAppointments) * 100
                  : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.type}
                    </span>
                    <span className="text-sm font-semibold text-purple-600">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-purple-500"
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
    </div>
  );
}
