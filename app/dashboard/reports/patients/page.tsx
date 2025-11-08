"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Download,
  Loader2,
} from "lucide-react";

interface PatientReport {
  summary: {
    totalPatients: number;
    activePatients: number;
    inactivePatients: number;
    newPatients: number;
  };
  genderDistribution: { gender: string; count: number }[];
  ageGroups: { range: string; count: number }[];
  insuranceStatus: { hasInsurance: number; noInsurance: number };
  registrationTrend: { month: string; count: number }[];
}

export default function PatientStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PatientReport | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
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

      const response = await fetch(`/api/reports/patients?${params}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching patient report:", error);
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

  const activeRate =
    data.summary.totalPatients > 0
      ? (data.summary.activePatients / data.summary.totalPatients) * 100
      : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Patient Statistics
              </h1>
              <p className="text-gray-600 mt-1">
                Demographics and patient analytics
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
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.summary.totalPatients.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {data.summary.activePatients.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {activeRate.toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Patients</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {data.summary.inactivePatients.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Patients</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {data.summary.newPatients.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">In selected period</p>
        </div>
      </div>

      {/* Registration Trend */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Registration Trend (Last 12 Months)
        </h2>
        <div className="h-64 flex items-end gap-2">
          {data.registrationTrend.map((item, index) => {
            const maxCount = Math.max(
              ...data.registrationTrend.map((r) => r.count)
            );
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full group">
                  <div
                    className="w-full bg-linear-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-700 hover:to-purple-500 cursor-pointer"
                    style={{ height: `${height * 2}px` }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count} patients
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  {item.month}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Gender Distribution
          </h2>
          <div className="space-y-4">
            {data.genderDistribution.map((item, index) => {
              const percentage =
                data.summary.totalPatients > 0
                  ? (item.count / data.summary.totalPatients) * 100
                  : 0;
              const colors = {
                male: { bg: "bg-blue-500", text: "text-blue-600" },
                female: { bg: "bg-pink-500", text: "text-pink-600" },
                other: { bg: "bg-purple-500", text: "text-purple-600" },
              };
              const color =
                colors[item.gender as keyof typeof colors] || colors.other;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.gender}
                    </span>
                    <span className={`text-sm font-semibold ${color.text}`}>
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${color.bg}`}
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

        {/* Age Groups */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Age Distribution
          </h2>
          <div className="space-y-4">
            {data.ageGroups.map((item, index) => {
              const percentage =
                data.summary.totalPatients > 0
                  ? (item.count / data.summary.totalPatients) * 100
                  : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.range}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-green-500"
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

        {/* Insurance Coverage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Insurance Coverage
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    With Insurance
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {data.insuranceStatus.hasInsurance.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-blue-500"
                  style={{
                    width: `${
                      data.summary.totalPatients > 0
                        ? (data.insuranceStatus.hasInsurance /
                            data.summary.totalPatients) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.totalPatients > 0
                  ? (
                      (data.insuranceStatus.hasInsurance /
                        data.summary.totalPatients) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Without Insurance
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {data.insuranceStatus.noInsurance.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gray-500"
                  style={{
                    width: `${
                      data.summary.totalPatients > 0
                        ? (data.insuranceStatus.noInsurance /
                            data.summary.totalPatients) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.totalPatients > 0
                  ? (
                      (data.insuranceStatus.noInsurance /
                        data.summary.totalPatients) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Coverage Rate:</strong>{" "}
              {data.summary.totalPatients > 0
                ? (
                    (data.insuranceStatus.hasInsurance /
                      data.summary.totalPatients) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
