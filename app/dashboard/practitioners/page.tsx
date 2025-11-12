"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  Award,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Building2,
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Practitioner {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  assignedClinics: Array<{
    _id: string;
    name: string;
  }>;
  primaryClinic?: {
    _id: string;
    name: string;
  };
  professionalDetails?: {
    licenseNumber?: string;
    specialization?: string;
    department?: string;
    yearsOfExperience?: number;
    education?: string;
    certifications?: string[];
  };
  contactInfo?: {
    phone?: string;
    emergencyContact?: string;
  };
  availability?: {
    workingDays?: string[];
    workingHours?: {
      start: string;
      end: string;
    };
  };
  isActive: boolean;
  createdAt: string;
}

interface Clinic {
  _id: string;
  name: string;
  clinicId: string;
}

export default function PractitionersPage() {
  const { data: session } = useSession();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPractitioner, setEditingPractitioner] =
    useState<Practitioner | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [clinicFilter, setClinicFilter] = useState("All");

  const practitionerRoles = [
    "Doctor",
    "Nurse",
    "Laboratory",
    "Radiology",
    "Pharmacy",
  ];

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "Doctor" as any,
    assignedClinics: [] as string[],
    primaryClinic: "",
    professionalDetails: {
      licenseNumber: "",
      specialization: "",
      department: "",
      yearsOfExperience: 0,
      education: "",
      certifications: [] as string[],
    },
    contactInfo: {
      phone: "",
      emergencyContact: "",
    },
    availability: {
      workingDays: [] as string[],
      workingHours: {
        start: "08:00",
        end: "17:00",
      },
    },
    isActive: true,
  });

  useEffect(() => {
    fetchPractitioners();
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const res = await fetch("/api/clinics");
      const result = await res.json();
      if (res.ok) {
        setClinics(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const fetchPractitioners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        // Filter to show only practitioners (doctors, nurses, lab, radiology, pharmacy staff)
        const practitionersList = data.users.filter((u: any) =>
          practitionerRoles.includes(u.role)
        );
        setPractitioners(practitionersList);
      }
    } catch (error) {
      console.error("Error fetching practitioners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = "/api/users";
      const method = editingPractitioner ? "PUT" : "POST";
      const body = editingPractitioner
        ? { ...formData, _id: editingPractitioner._id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Practitioner saved successfully");
        setShowModal(false);
        resetForm();
        fetchPractitioners();
      } else {
        alert(data.error || "Failed to save practitioner");
      }
    } catch (error) {
      console.error("Error saving practitioner:", error);
      alert("Failed to save practitioner");
    }
  };

  const handleEdit = (practitioner: Practitioner) => {
    setEditingPractitioner(practitioner);
    setFormData({
      email: practitioner.email,
      password: "", // Don't populate password for security
      firstName: practitioner.firstName,
      lastName: practitioner.lastName,
      role: practitioner.role as any,
      assignedClinics: practitioner.assignedClinics.map((c) => c._id),
      primaryClinic: practitioner.primaryClinic?._id || "",
      professionalDetails: {
        licenseNumber: practitioner.professionalDetails?.licenseNumber || "",
        specialization: practitioner.professionalDetails?.specialization || "",
        department: practitioner.professionalDetails?.department || "",
        yearsOfExperience:
          practitioner.professionalDetails?.yearsOfExperience || 0,
        education: practitioner.professionalDetails?.education || "",
        certifications: practitioner.professionalDetails?.certifications || [],
      },
      contactInfo: {
        phone: practitioner.contactInfo?.phone || "",
        emergencyContact: practitioner.contactInfo?.emergencyContact || "",
      },
      availability: {
        workingDays: practitioner.availability?.workingDays || [],
        workingHours: practitioner.availability?.workingHours || {
          start: "08:00",
          end: "17:00",
        },
      },
      isActive: practitioner.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this practitioner?"))
      return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchPractitioners();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting practitioner:", error);
      alert("Failed to delete practitioner");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "Doctor",
      assignedClinics: [],
      primaryClinic: "",
      professionalDetails: {
        licenseNumber: "",
        specialization: "",
        department: "",
        yearsOfExperience: 0,
        education: "",
        certifications: [],
      },
      contactInfo: {
        phone: "",
        emergencyContact: "",
      },
      availability: {
        workingDays: [],
        workingHours: {
          start: "08:00",
          end: "17:00",
        },
      },
      isActive: true,
    });
    setEditingPractitioner(null);
  };

  const toggleClinic = (clinicId: string) => {
    const newClinics = formData.assignedClinics.includes(clinicId)
      ? formData.assignedClinics.filter((id) => id !== clinicId)
      : [...formData.assignedClinics, clinicId];
    setFormData({ ...formData, assignedClinics: newClinics });
  };

  const toggleWorkingDay = (day: string) => {
    const newDays = formData.availability.workingDays.includes(day)
      ? formData.availability.workingDays.filter((d) => d !== day)
      : [...formData.availability.workingDays, day];
    setFormData({
      ...formData,
      availability: { ...formData.availability, workingDays: newDays },
    });
  };

  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Filter practitioners
  const filteredPractitioners = practitioners.filter((p) => {
    const matchesSearch =
      p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.professionalDetails?.licenseNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "All" || p.role === roleFilter;
    const matchesClinic =
      clinicFilter === "All" ||
      p.assignedClinics.some((c) => c._id === clinicFilter);

    return matchesSearch && matchesRole && matchesClinic;
  });

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Practitioners Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage doctors, nurses, and medical staff for appointment scheduling
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Roles</option>
              {practitionerRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {/* Clinic Filter */}
            <select
              value={clinicFilter}
              onChange={(e) => setClinicFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Clinics</option>
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          {["Admin", "Director"].includes(session.user.role) && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Practitioner
            </button>
          )}
        </div>
      </div>

      {/* Practitioners List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredPractitioners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No practitioners found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name & Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role & Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    License & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assigned Clinics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPractitioners.map((practitioner) => (
                  <tr
                    key={practitioner._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {practitioner.firstName} {practitioner.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {practitioner.email}
                        </div>
                        {practitioner.contactInfo?.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {practitioner.contactInfo.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">
                            {practitioner.role}
                          </span>
                        </div>
                        {practitioner.professionalDetails?.specialization && (
                          <div className="text-sm text-gray-600 mt-1">
                            {practitioner.professionalDetails.specialization}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {practitioner.professionalDetails?.licenseNumber && (
                          <div className="flex items-center gap-1 text-sm">
                            <Award className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600">
                              {practitioner.professionalDetails.licenseNumber}
                            </span>
                          </div>
                        )}
                        {practitioner.professionalDetails?.department && (
                          <div className="flex items-center gap-1 text-sm mt-1">
                            <Briefcase className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600">
                              {practitioner.professionalDetails.department}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {practitioner.assignedClinics.map((clinic) => (
                          <div
                            key={clinic._id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs mr-1 ${
                              clinic._id === practitioner.primaryClinic?._id
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            {clinic.name}
                            {clinic._id === practitioner.primaryClinic?._id && (
                              <span className="ml-1 font-semibold">
                                (Primary)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          practitioner.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {practitioner.isActive ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {practitioner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {["Admin", "Director"].includes(session.user.role) && (
                          <>
                            <button
                              onClick={() => handleEdit(practitioner)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(practitioner._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingPractitioner
                ? "Edit Practitioner"
                : "Add New Practitioner"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Basic Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {!editingPractitioner && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required={!editingPractitioner}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave empty to keep current password"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {practitionerRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contactInfo.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactInfo: {
                            ...formData.contactInfo,
                            phone: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={formData.contactInfo.emergencyContact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactInfo: {
                            ...formData.contactInfo,
                            emergencyContact: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Right Column - Professional Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Professional Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.professionalDetails.licenseNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          professionalDetails: {
                            ...formData.professionalDetails,
                            licenseNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.professionalDetails.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          professionalDetails: {
                            ...formData.professionalDetails,
                            specialization: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Cardiology, Pediatrics, General Medicine"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.professionalDetails.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          professionalDetails: {
                            ...formData.professionalDetails,
                            department: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.professionalDetails.yearsOfExperience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          professionalDetails: {
                            ...formData.professionalDetails,
                            yearsOfExperience: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Education
                    </label>
                    <textarea
                      value={formData.professionalDetails.education}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          professionalDetails: {
                            ...formData.professionalDetails,
                            education: e.target.value,
                          },
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., MD from University of Medicine, 2015"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Clinic Assignment */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                  Clinic Assignment
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {clinics.map((clinic) => (
                    <label
                      key={clinic._id}
                      className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedClinics.includes(clinic._id)}
                        onChange={() => toggleClinic(clinic._id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">{clinic.name}</span>
                    </label>
                  ))}
                </div>

                {formData.assignedClinics.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Clinic
                    </label>
                    <select
                      value={formData.primaryClinic}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryClinic: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select primary clinic...</option>
                      {clinics
                        .filter((c) => formData.assignedClinics.includes(c._id))
                        .map((clinic) => (
                          <option key={clinic._id} value={clinic._id}>
                            {clinic.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Working Schedule */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                  Working Schedule
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <label
                        key={day}
                        className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.availability.workingDays.includes(
                            day
                          )}
                          onChange={() => toggleWorkingDay(day)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{day.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.availability.workingHours.start}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availability: {
                            ...formData.availability,
                            workingHours: {
                              ...formData.availability.workingHours,
                              start: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.availability.workingHours.end}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availability: {
                            ...formData.availability,
                            workingHours: {
                              ...formData.availability.workingHours,
                              end: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingPractitioner
                    ? "Update Practitioner"
                    : "Create Practitioner"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
