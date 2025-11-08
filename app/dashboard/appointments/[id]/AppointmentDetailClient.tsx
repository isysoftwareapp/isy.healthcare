"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  CircleCheckBig,
  CircleX,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

interface Appointment {
  _id: string;
  appointmentId: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    patientId: string;
    email: string;
    phone: string;
    address: {
      city: string;
      state: string;
    };
  };
  practitioner: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    professionalDetails?: {
      specialization?: string;
      licenseNumber?: string;
    };
  };
  clinic: {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
    };
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentDetailClientProps {
  appointment: Appointment;
}

export default function AppointmentDetailClient({
  appointment: initialAppointment,
}: AppointmentDetailClientProps) {
  const router = useRouter();
  const [appointment, setAppointment] = useState(initialAppointment);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      "checked-in": "bg-purple-100 text-purple-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      "no-show": "bg-orange-100 text-orange-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      consultation: "bg-blue-50 text-blue-700 border-blue-200",
      "follow-up": "bg-green-50 text-green-700 border-green-200",
      procedure: "bg-purple-50 text-purple-700 border-purple-200",
      checkup: "bg-yellow-50 text-yellow-700 border-yellow-200",
      emergency: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center rounded border px-2.5 py-1 text-sm font-medium ${
          styles[type as keyof typeof styles] ||
          "bg-gray-50 text-gray-700 border-gray-200"
        }`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
      </span>
    );
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/appointments/${appointment._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setAppointment(data.data);
      alert("Status updated successfully");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update appointment status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this appointment? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/appointments/${appointment._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }

      alert("Appointment cancelled successfully");
      router.push("/dashboard/appointments");
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Failed to cancel appointment");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/appointments"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-sm text-gray-600">{appointment.appointmentId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {appointment.status !== "cancelled" &&
            appointment.status !== "completed" && (
              <>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Cancelling..." : "Cancel Appointment"}
                </button>
              </>
            )}
        </div>
      </div>

      {/* Status and Type */}
      <div className="flex gap-3">
        {getStatusBadge(appointment.status)}
        {getTypeBadge(appointment.type)}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Time */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Time
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(appointment.appointmentDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">
                    {appointment.startTime} - {appointment.endTime} (
                    {appointment.duration} minutes)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Patient Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <Link
                    href={`/dashboard/patients/${appointment.patient._id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {appointment.patient.firstName}{" "}
                    {appointment.patient.lastName}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {appointment.patient.patientId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {appointment.patient.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">
                    {appointment.patient.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">
                    {appointment.patient.address.city},{" "}
                    {appointment.patient.address.state}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Practitioner Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Practitioner Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {appointment.practitioner.firstName}{" "}
                    {appointment.practitioner.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {appointment.practitioner.professionalDetails
                      ?.specialization || "General Practitioner"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {appointment.practitioner.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">
                    {appointment.practitioner.phone}
                  </p>
                </div>
              </div>
              {appointment.practitioner.professionalDetails?.licenseNumber && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">License Number</p>
                    <p className="font-medium text-gray-900">
                      {
                        appointment.practitioner.professionalDetails
                          .licenseNumber
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reason for Visit</p>
                <p className="text-gray-900">{appointment.reason}</p>
              </div>
              {appointment.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                  <p className="text-gray-900">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Clinic */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {appointment.status !== "cancelled" &&
            appointment.status !== "completed" && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-2">
                  {appointment.status === "scheduled" && (
                    <button
                      onClick={() => handleStatusUpdate("confirmed")}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CircleCheckBig className="h-4 w-4" />
                      Confirm Appointment
                    </button>
                  )}
                  {appointment.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusUpdate("checked-in")}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <User className="h-4 w-4" />
                      Check In Patient
                    </button>
                  )}
                  {appointment.status === "checked-in" && (
                    <button
                      onClick={() => handleStatusUpdate("in-progress")}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:opacity-50"
                    >
                      <Clock className="h-4 w-4" />
                      Start Consultation
                    </button>
                  )}
                  {appointment.status === "in-progress" && (
                    <button
                      onClick={() => handleStatusUpdate("completed")}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CircleCheckBig className="h-4 w-4" />
                      Complete Appointment
                    </button>
                  )}
                  {["scheduled", "confirmed"].includes(appointment.status) && (
                    <button
                      onClick={() => handleStatusUpdate("no-show")}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 rounded-md border border-orange-300 bg-white px-4 py-2 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Mark as No-Show
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Clinic Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Clinic Location
            </h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                {appointment.clinic.name}
              </p>
              <p className="text-sm text-gray-600">
                {appointment.clinic.address.street}
              </p>
              <p className="text-sm text-gray-600">
                {appointment.clinic.address.city},{" "}
                {appointment.clinic.address.state}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg bg-gray-50 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Metadata
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Created</p>
                <p className="text-gray-900">
                  {new Date(appointment.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Last Updated</p>
                <p className="text-gray-900">
                  {new Date(appointment.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
