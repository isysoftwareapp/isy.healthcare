"use client";

import { useRouter } from "next/navigation";
import PatientRegistrationForm from "@/components/PatientRegistrationForm";
import { ArrowLeft } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();

  const handleSuccess = (patientId: string) => {
    // Redirect to patient detail page on success
    router.push(`/dashboard/patients/${patientId}`);
  };

  const handleCancel = () => {
    // Go back to patients list
    router.push("/dashboard/patients");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Register New Patient
          </h1>
          <p className="mt-2 text-gray-600">
            Enter patient information, medical history, and upload required
            documents
          </p>
        </div>

        <PatientRegistrationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
