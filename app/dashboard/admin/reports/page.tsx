"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Building2,
  Download,
  Loader2,
  Filter,
} from "lucide-react";

interface Clinic {
  _id: string;
  name: string;
  clinicId: string;
  code: string;
}

interface ClinicMetrics {
  clinicId: string;
  clinicName: string;
  totalPatients: number;
  activePatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  revenue: number;
  staffCount: number;
}

interface GlobalMetrics {
  totalClinics: number;
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  totalStaff: number;
  clinicMetrics: ClinicMetrics[];
}

export default function GlobalReportsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch clinics
      const clinicsRes = await fetch("/api/clinics");
      const clinicsData = await clinicsRes.json();

      if (clinicsData.success) {
        setClinics(clinicsData.data);

        // Mock metrics data (in real implementation, this would come from API)
        const mockMetrics: GlobalMetrics = {
          totalClinics: clinicsData.data.length,
          totalPatients: 0,
          totalAppointments: 0,
          totalRevenue: 0,
          totalStaff: 0,
          clinicMetrics: clinicsData.data.map((clinic: Clinic) => ({
            clinicId: clinic._id,
            clinicName: clinic.name,
            totalPatients: Math.floor(Math.random() * 500) + 100,
            activePatients: Math.floor(Math.random() * 300) + 50,
            totalAppointments: Math.floor(Math.random() * 1000) + 200,
            completedAppointments: Math.floor(Math.random() * 800) + 150,
            cancelledAppointments: Math.floor(Math.random() * 100) + 10,
            revenue: Math.floor(Math.random() * 100000) + 20000,
            staffCount: Math.floor(Math.random() * 20) + 5,
          })),
        };

        // Calculate totals
        mockMetrics.totalPatients = mockMetrics.clinicMetrics.reduce(
          (sum, c) => sum + c.totalPatients,
          0
        );
        mockMetrics.totalAppointments = mockMetrics.clinicMetrics.reduce(
          (sum, c) => sum + c.totalAppointments,
          0
        );
        mockMetrics.totalRevenue = mockMetrics.clinicMetrics.reduce(
          (sum, c) => sum + c.revenue,
          0
        );
        mockMetrics.totalStaff = mockMetrics.clinicMetrics.reduce(
          (sum, c) => sum + c.staffCount,
          0
        );

        setMetrics(mockMetrics);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!metrics) return;

    // Generate CSV
    const headers = [
      "Clinic",
      "Total Patients",
      "Active Patients",
      "Total Appointments",
      "Completed",
      "Cancelled",
      "Revenue",
      "Staff",
    ];

    const rows = metrics.clinicMetrics.map((c) => [
      c.clinicName,
      c.totalPatients,
      c.activePatients,
      c.totalAppointments,
      c.completedAppointments,
      c.cancelledAppointments,
      `$${c.revenue.toLocaleString()}`,
      c.staffCount,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `global-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Global Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Multi-clinic analytics and performance metrics
              </p>
            </div>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {metrics && (
        <>
          {/* Global Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Clinics</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.totalClinics}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.totalPatients.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.totalAppointments.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${metrics.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.totalStaff}
                  </p>
                </div>
                <div className="bg-teal-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Clinic Comparison */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Clinic Performance Comparison
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clinic
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patients
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointments
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cancelled
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.clinicMetrics.map((clinic) => (
                    <tr key={clinic.clinicId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {clinic.clinicName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {clinic.totalPatients.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {clinic.activePatients.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {clinic.totalAppointments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-green-600 font-medium">
                          {clinic.completedAppointments.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-red-600 font-medium">
                          {clinic.cancelledAppointments.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${clinic.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {clinic.staffCount}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      {metrics.totalPatients.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      {metrics.clinicMetrics
                        .reduce((sum, c) => sum + c.activePatients, 0)
                        .toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      {metrics.totalAppointments.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                      {metrics.clinicMetrics
                        .reduce((sum, c) => sum + c.completedAppointments, 0)
                        .toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">
                      {metrics.clinicMetrics
                        .reduce((sum, c) => sum + c.cancelledAppointments, 0)
                        .toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      ${metrics.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      {metrics.totalStaff}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top by Revenue */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top by Revenue
                </h3>
              </div>
              <div className="p-6">
                {[...metrics.clinicMetrics]
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 3)
                  .map((clinic, idx) => (
                    <div
                      key={clinic.clinicId}
                      className="flex items-center justify-between mb-3 last:mb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {clinic.clinicName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        ${clinic.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top by Patients */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Top by Patients
                </h3>
              </div>
              <div className="p-6">
                {[...metrics.clinicMetrics]
                  .sort((a, b) => b.totalPatients - a.totalPatients)
                  .slice(0, 3)
                  .map((clinic, idx) => (
                    <div
                      key={clinic.clinicId}
                      className="flex items-center justify-between mb-3 last:mb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {clinic.clinicName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {clinic.totalPatients.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top by Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Top by Appointments
                </h3>
              </div>
              <div className="p-6">
                {[...metrics.clinicMetrics]
                  .sort((a, b) => b.totalAppointments - a.totalAppointments)
                  .slice(0, 3)
                  .map((clinic, idx) => (
                    <div
                      key={clinic.clinicId}
                      className="flex items-center justify-between mb-3 last:mb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {clinic.clinicName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">
                        {clinic.totalAppointments.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
