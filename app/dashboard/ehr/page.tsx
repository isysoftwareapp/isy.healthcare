"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Activity,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  Search,
  Filter,
} from "lucide-react";

interface RecentConsultation {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  };
  createdAt: string;
  soapNotes: Array<{
    subjective: string;
    recordedAt: Date;
  }>;
  diagnoses: Array<{
    code: string;
    description: string;
    type: string;
  }>;
}

export default function EHRDashboard() {
  const [recentConsultations, setRecentConsultations] = useState<
    RecentConsultation[]
  >([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    todayConsultations: 0,
    pendingPrescriptions: 0,
    criticalAllergies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent consultations
      const response = await fetch("/api/medical-records?limit=10");
      const data = await response.json();

      if (data.success) {
        setRecentConsultations(data.data);
        setStats({
          totalRecords: data.pagination.total,
          todayConsultations: data.data.filter((r: RecentConsultation) => {
            const today = new Date().toDateString();
            return new Date(r.createdAt).toDateString() === today;
          }).length,
          pendingPrescriptions: 0, // This would come from a separate API
          criticalAllergies: 0, // This would come from a separate API
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Electronic Health Records
        </h1>
        <p className="text-gray-600 mt-1">
          Manage patient medical records and consultations
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalRecords}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Consultations</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.todayConsultations}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingPrescriptions}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Allergies</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.criticalAllergies}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link
          href="/dashboard/ehr/consultation"
          className="bg-blue-600 text-white rounded-lg p-4 flex items-center justify-between hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Consultation</span>
          </div>
        </Link>

        <Link
          href="/dashboard/patients"
          className="bg-white border-2 border-gray-300 text-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" />
            <span className="font-semibold">Patient Records</span>
          </div>
        </Link>

        <Link
          href="/dashboard/appointments"
          className="bg-white border-2 border-gray-300 text-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Appointments</span>
          </div>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Recent Consultations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Consultations
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading consultations...</p>
          </div>
        ) : recentConsultations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No consultations found</p>
            <p className="text-sm mt-2">
              Start a new consultation to see records here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chief Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentConsultations.map((consultation) => (
                  <tr key={consultation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {consultation.patient.firstName}{" "}
                          {consultation.patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {consultation.patient.patientId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(consultation.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {consultation.soapNotes.length > 0
                          ? consultation.soapNotes[0].subjective.substring(
                              0,
                              50
                            ) + "..."
                          : "No notes"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {consultation.diagnoses.length > 0 ? (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {consultation.diagnoses[0].code}
                          </span>
                          <div className="text-gray-500 text-xs truncate max-w-xs">
                            {consultation.diagnoses[0].description}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No diagnosis
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/ehr/patients/${consultation.patient._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Record
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
