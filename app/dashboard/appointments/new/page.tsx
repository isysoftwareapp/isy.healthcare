import { Metadata } from "next";
import AppointmentBookingForm from "@/components/AppointmentBookingForm";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Book Appointment | Clinic Management",
  description: "Schedule a new appointment",
};

export default function NewAppointmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-sm text-gray-600">
            Schedule a new appointment for a patient
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm p-6">
        <AppointmentBookingForm />
      </div>
    </div>
  );
}
