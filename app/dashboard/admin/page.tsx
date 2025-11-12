"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit,
  Loader2,
} from "lucide-react";

interface Clinic {
  _id: string;
  name: string;
  clinicId: string;
  code: string;
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    timezone: string;
  };
  isActive: boolean;
  operationalSettings?: any;
  financialSettings?: any;
}

interface ClinicStats {
  totalPatients: number;
  totalAppointments: number;
  totalStaff: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<Record<string, ClinicStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clinics");
      const data = await response.json();

      if (data.success) {
        setClinics(data.data);

        // Fetch stats for each clinic
        const statsData: Record<string, ClinicStats> = {};
        for (const clinic of data.data) {
          // In production, this would be a single API call
          statsData[clinic._id] = {
            totalPatients: 0,
            totalAppointments: 0,
            totalStaff: 0,
            monthlyRevenue: 0,
          };
        }
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading clinics...</p>
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
            Multi-Clinic Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all clinic locations, settings, and staff
          </p>
        </div>
        <Link
          href="/dashboard/admin/clinics/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Clinic</span>
        </Link>
      </div>

      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clinics</p>
              <p className="text-2xl font-bold text-gray-900">
                {clinics.length}
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
              <p className="text-sm text-gray-600">Active Clinics</p>
              <p className="text-2xl font-bold text-gray-900">
                {clinics.filter((c) => c.isActive).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(stats).reduce((sum, s) => sum + s.totalStaff, 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {Object.values(stats)
                  .reduce((sum, s) => sum + (s.monthlyRevenue ?? 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Link
          href="/dashboard/admin/staff"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Users className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Manage Staff</h3>
          <p className="text-sm text-gray-600 mt-1">Assign staff to clinics</p>
        </Link>

        <Link
          href="/dashboard/admin/operating-hours"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Clock className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Operating Hours</h3>
          <p className="text-sm text-gray-600 mt-1">Set clinic schedules</p>
        </Link>

        <Link
          href="/dashboard/admin/templates"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Settings className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Templates</h3>
          <p className="text-sm text-gray-600 mt-1">Manage SOAP templates</p>
        </Link>

        <Link
          href="/dashboard/admin/reports"
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <BarChart3 className="w-6 h-6 text-gray-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Global Reports</h3>
          <p className="text-sm text-gray-600 mt-1">Multi-clinic analytics</p>
        </Link>
      </div>

      {/* Clinics List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Clinic Locations
          </h2>
        </div>

        {clinics.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No clinics found</p>
            <p className="text-sm mt-2">Add your first clinic to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {clinics.map((clinic) => (
              <div
                key={clinic._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {clinic.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                          clinic.isActive
                        )}`}
                      >
                        {clinic.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-sm text-gray-500">
                        ID: {clinic.clinicId}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-600">
                          {clinic.address.street}, {clinic.address.city},{" "}
                          {clinic.address.state} {clinic.address.postalCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {clinic.contactInfo?.phone || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {clinic.contactInfo?.email || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Clinic Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Patients</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats[clinic._id]?.totalPatients || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Appointments</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats[clinic._id]?.totalAppointments || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Staff</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats[clinic._id]?.totalStaff || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Revenue (Month)</p>
                        <p className="text-lg font-semibold text-gray-900">
                          $
                          {(
                            stats[clinic._id]?.monthlyRevenue ?? 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/dashboard/admin/clinics/${clinic._id}`}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit clinic"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/dashboard/admin/clinics/${clinic._id}/settings`}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Clinic settings"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
