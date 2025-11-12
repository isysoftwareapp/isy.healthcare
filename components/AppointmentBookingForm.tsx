"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import Calendar from "./Calendar";
import TimeSlotSelector from "./TimeSlotSelector";

interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface AppointmentFormData {
  patient: string;
  practitioner: string;
  appointmentDate: string;
  startTime: string;
  duration: number;
  type: "consultation" | "follow-up" | "procedure" | "checkup" | "emergency";
  reason: string;
  notes?: string;
}

interface AppointmentBookingFormProps {
  patientId?: string;
  onSuccess?: (appointmentId: string) => void;
  onCancel?: () => void;
}

export default function AppointmentBookingForm({
  patientId,
  onSuccess,
  onCancel,
}: AppointmentBookingFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState<AppointmentFormData>({
    patient: patientId || "",
    practitioner: "",
    appointmentDate: "",
    startTime: "",
    duration: 30,
    type: "consultation",
    reason: "",
    notes: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  // Fetch practitioners (doctors, nurses, and other medical staff)
  useEffect(() => {
    const fetchPractitioners = async () => {
      try {
        const response = await fetch(
          "/api/users?role=Doctor,Nurse,Laboratory,Radiology,Pharmacy"
        );
        if (response.ok) {
          const data = await response.json();
          // Filter to only active practitioners
          const activePractitioners = (data.users || data.data || []).filter(
            (p: any) => p.isActive
          );
          setPractitioners(activePractitioners);
        }
      } catch (err) {
        console.error("Error fetching practitioners:", err);
      }
    };

    fetchPractitioners();
  }, []);

  // Fetch patients if no patientId provided
  useEffect(() => {
    if (!patientId) {
      const fetchPatients = async () => {
        try {
          const response = await fetch("/api/patients?limit=100");
          if (response.ok) {
            const data = await response.json();
            setPatients(data.data || []);
          }
        } catch (err) {
          console.error("Error fetching patients:", err);
        }
      };

      fetchPatients();
    }
  }, [patientId]);

  // Fetch available slots when date or practitioner changes
  useEffect(() => {
    if (formData.practitioner && selectedDate) {
      fetchAvailableSlots();
    }
  }, [formData.practitioner, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetch(
        `/api/appointments/availability?practitionerId=${formData.practitioner}&date=${dateStr}&clinicId=${session?.user?.primaryClinic}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.isAvailable) {
          setAvailableSlots(data.data.slots || []);
        } else {
          setAvailableSlots([]);
        }
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError("Failed to load available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setFormData((prev) => ({
      ...prev,
      appointmentDate: date.toISOString().split("T")[0],
    }));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setFormData((prev) => ({
      ...prev,
      startTime: slot.startTime,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.patient) {
      setError("Please select a patient");
      return;
    }

    if (!formData.practitioner) {
      setError("Please select a practitioner");
      return;
    }

    if (!formData.appointmentDate || !formData.startTime) {
      setError("Please select a date and time");
      return;
    }

    if (!formData.reason) {
      setError("Please provide a reason for the appointment");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create appointment");
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess(data.data._id);
      } else {
        router.push(`/dashboard/appointments/${data.data._id}`);
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while creating the appointment"
      );
      console.error("Appointment creation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Step 1: Select Patient and Practitioner */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Step 1: Select Patient & Practitioner
          </h3>

          {!patientId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                name="patient"
                value={formData.patient}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName} - {patient.patientId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Practitioner <span className="text-red-500">*</span>
            </label>
            <select
              name="practitioner"
              value={formData.practitioner}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a practitioner</option>
              {practitioners.map((practitioner) => (
                <option key={practitioner._id} value={practitioner._id}>
                  {practitioner.firstName} {practitioner.lastName} -{" "}
                  {practitioner.professionalDetails?.specialization ||
                    "General"}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!formData.patient || !formData.practitioner}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Select Date & Time
          </button>
        </div>
      )}

      {/* Step 2: Select Date and Time */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Step 2: Select Date & Time
            </h3>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              minDate={new Date()}
            />

            <TimeSlotSelector
              slots={availableSlots}
              selectedSlot={selectedSlot || undefined}
              onSlotSelect={handleSlotSelect}
              loading={loadingSlots}
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!selectedSlot}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Appointment Details
          </button>
        </div>
      )}

      {/* Step 3: Appointment Details */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Step 3: Appointment Details
            </h3>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="procedure">Procedure</option>
                <option value="checkup">Checkup</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder="Describe the reason for this appointment..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="Any additional information..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Appointment Summary
            </h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(formData.appointmentDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong> {formData.startTime}
              </p>
              <p>
                <strong>Duration:</strong> {formData.duration} minutes
              </p>
              <p>
                <strong>Type:</strong>{" "}
                {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
