"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  UserPlus,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  clinics: string[];
}

interface Clinic {
  _id: string;
  name: string;
  clinicId: string;
  code: string;
}

export default function StaffAssignmentPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [clinicStaff, setClinicStaff] = useState<User[]>([]);
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      fetchClinicStaff();
    }
  }, [selectedClinic]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [clinicsRes, usersRes] = await Promise.all([
        fetch("/api/clinics"),
        fetch("/api/users"),
      ]);

      const clinicsData = await clinicsRes.json();
      const usersData = await usersRes.json();

      if (clinicsData.success) {
        setClinics(clinicsData.data);
        if (clinicsData.data.length > 0) {
          setSelectedClinic(clinicsData.data[0]._id);
        }
      }

      if (usersData.success) {
        setUsers(usersData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicStaff = async () => {
    try {
      const response = await fetch(`/api/clinics/${selectedClinic}/staff`);
      const data = await response.json();

      if (data.success) {
        setClinicStaff(data.data.staff);

        // Filter available staff (users not assigned to this clinic)
        const staffIds = new Set(data.data.staff.map((s: User) => s._id));
        const available = users.filter((u) => !staffIds.has(u._id));
        setAvailableStaff(available);
      }
    } catch (error) {
      console.error("Error fetching clinic staff:", error);
    }
  };

  const assignStaff = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/clinics/${selectedClinic}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchClinicStaff();
      } else {
        alert(data.error || "Failed to assign staff");
      }
    } catch (error) {
      console.error("Error assigning staff:", error);
      alert("An error occurred while assigning staff");
    } finally {
      setActionLoading(false);
    }
  };

  const removeStaff = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this staff member from the clinic?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/clinics/${selectedClinic}/staff`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchClinicStaff();
      } else {
        alert(data.error || "Failed to remove staff");
      }
    } catch (error) {
      console.error("Error removing staff:", error);
      alert("An error occurred while removing staff");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      "super-admin": "bg-purple-100 text-purple-800",
      "clinic-director": "bg-blue-100 text-blue-800",
      doctor: "bg-green-100 text-green-800",
      nurse: "bg-teal-100 text-teal-800",
      receptionist: "bg-yellow-100 text-yellow-800",
      pharmacist: "bg-pink-100 text-pink-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const filteredAvailableStaff = availableStaff.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupStaffByRole = (staff: User[]) => {
    return staff.reduce((acc: Record<string, User[]>, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading staff assignments...</p>
        </div>
      </div>
    );
  }

  const selectedClinicData = clinics.find((c) => c._id === selectedClinic);
  const staffByRole = groupStaffByRole(clinicStaff);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Staff Assignment
            </h1>
            <p className="text-gray-600 mt-1">
              Manage staff assignments across clinic locations
            </p>
          </div>
        </div>

        {/* Clinic Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Clinic
          </label>
          <select
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
          >
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name} ({clinic.clinicId})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Staff */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Staff
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {clinicStaff.length} staff member
                  {clinicStaff.length !== 1 ? "s" : ""} assigned
                </p>
              </div>
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="p-6">
            {clinicStaff.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No staff assigned to this clinic</p>
                <p className="text-sm mt-2">
                  Add staff from the available list
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(staffByRole).map(([role, members]) => (
                  <div key={role}>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      {role.replace("-", " ")} ({members.length})
                    </h3>
                    <div className="space-y-2">
                      {members.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                          </div>
                          <button
                            onClick={() => removeStaff(user._id)}
                            disabled={actionLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove from clinic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Staff */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Staff
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {availableStaff.length} staff member
                  {availableStaff.length !== 1 ? "s" : ""} available
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 max-h-[600px] overflow-y-auto">
            {filteredAvailableStaff.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>
                  {searchTerm
                    ? "No staff found matching your search"
                    : "All staff members are assigned to this clinic"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAvailableStaff.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.clinics.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned to {user.clinics.length} other clinic
                          {user.clinics.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => assignStaff(user._id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Assign</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
