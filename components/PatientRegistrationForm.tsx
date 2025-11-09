"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Camera, Upload, Save, X } from "lucide-react";
import WebcamCapture from "./WebcamCapture";
import SecureFileUpload from "./SecureFileUpload";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  contactNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    providerId?: string;
    policyNumber: string;
    groupNumber: string;
    validFrom: string;
    validTo: string;
  };
  medicalHistory: {
    allergies: string;
    chronicConditions: string;
    currentMedications: string;
    pastSurgeries: string;
  };
  passportNumber?: string;
  nationality?: string;
  primaryClinic?: string;
}

interface PatientRegistrationFormProps {
  onSuccess?: (patientId: string) => void;
  onCancel?: () => void;
}

export default function PatientRegistrationForm({
  onSuccess,
  onCancel,
}: PatientRegistrationFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male",
    contactNumber: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    insurance: {
      policyNumber: "",
      groupNumber: "",
      validFrom: "",
      validTo: "",
    },
    medicalHistory: {
      allergies: "",
      chronicConditions: "",
      currentMedications: "",
      pastSurgeries: "",
    },
    primaryClinic: undefined,
  });

  const [clinics, setClinics] = useState<Array<{ _id: string; name: string }>>(
    []
  );
  const [clinicsLoading, setClinicsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setClinicsLoading(true);
      try {
        const res = await fetch("/api/clinics");
        if (!res.ok) return;
        const json = await res.json();
        // Expecting { data: [...] } or array — normalize
        const list = Array.isArray(json) ? json : json.data || [];
        if (mounted)
          setClinics(
            list.map((c: any) => ({ _id: c._id || c.id, name: c.name }))
          );
      } catch (err) {
        console.warn("Failed to load clinics", err);
      } finally {
        if (mounted) setClinicsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const [photoData, setPhotoData] = useState<string>("");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [encryptedPassportData, setEncryptedPassportData] =
    useState<string>("");
  const [showWebcam, setShowWebcam] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = 4;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PatientFormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoCapture = (imageDataUrl: string) => {
    setPhotoData(imageDataUrl);
  };

  const handlePassportUpload = (file: File, encryptedData?: string) => {
    setPassportFile(file);
    if (encryptedData) {
      setEncryptedPassportData(encryptedData);
    }
  };

  const validateStep = (step: number): boolean => {
    setError("");

    switch (step) {
      case 1:
        if (
          !formData.firstName ||
          !formData.lastName ||
          !formData.dateOfBirth
        ) {
          setError("Please fill in all required basic information fields");
          return false;
        }
        break;
      case 2:
        if (!formData.contactNumber || !formData.address.city) {
          setError("Please fill in contact information");
          return false;
        }
        break;
      case 3:
        // Medical history is optional but show warning if empty
        break;
      case 4:
        // Documents are optional, but ensure a primary clinic exists (either chosen or from session)
        if (!formData.primaryClinic && !session?.user?.primaryClinic) {
          setError("Please select a primary clinic for this patient");
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        ...formData,
        photo: photoData,
        passportScan: encryptedPassportData,
        // prefer explicit selection, fall back to user's primary clinic
        primaryClinic: formData.primaryClinic ?? session?.user?.primaryClinic,
      };

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register patient");
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess(data.data._id);
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while registering the patient"
      );
      console.error("Registration error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Number
                </label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <h4 className="text-md font-semibold text-gray-900 mt-6">
              Emergency Contact
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Medical History & Insurance
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <textarea
                name="medicalHistory.allergies"
                value={formData.medicalHistory.allergies}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="List any known allergies..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chronic Conditions
              </label>
              <textarea
                name="medicalHistory.chronicConditions"
                value={formData.medicalHistory.chronicConditions}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Diabetes, hypertension, etc..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Medications
              </label>
              <textarea
                name="medicalHistory.currentMedications"
                value={formData.medicalHistory.currentMedications}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="List current medications and dosages..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Past Surgeries
              </label>
              <textarea
                name="medicalHistory.pastSurgeries"
                value={formData.medicalHistory.pastSurgeries}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="List any past surgeries with dates..."
              />
            </div>

            <h4 className="text-md font-semibold text-gray-900 mt-6">
              Insurance Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Number
                </label>
                <input
                  type="text"
                  name="insurance.policyNumber"
                  value={formData.insurance.policyNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Number
                </label>
                <input
                  type="text"
                  name="insurance.groupNumber"
                  value={formData.insurance.groupNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <input
                  type="date"
                  name="insurance.validFrom"
                  value={formData.insurance.validFrom}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid To
                </label>
                <input
                  type="date"
                  name="insurance.validTo"
                  value={formData.insurance.validTo}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Documents & Photo
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Photo
              </label>

              {!photoData ? (
                <button
                  type="button"
                  onClick={() => setShowWebcam(true)}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4" />
                  Capture Photo
                </button>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={photoData}
                    alt="Patient"
                    className="h-32 w-32 rounded-lg object-cover border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoData("")}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <SecureFileUpload
                label="Passport / ID Scan"
                description="Upload a scan or photo of the patient's passport or ID (encrypted for security)"
                acceptedTypes="image/*,.pdf"
                maxSizeMB={10}
                encrypt={true}
                onFileSelect={handlePassportUpload}
                currentFile={
                  passportFile ? URL.createObjectURL(passportFile) : ""
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Clinic <span className="text-red-500">*</span>
              </label>
              <div>
                {clinicsLoading ? (
                  <div className="text-sm text-gray-600">
                    Loading clinics...
                  </div>
                ) : (
                  <select
                    name="primaryClinic"
                    value={formData.primaryClinic ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryClinic: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a clinic</option>
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>Privacy Note:</strong> All uploaded documents are
                encrypted and stored securely. Passport and ID scans are only
                accessible to authorized personnel.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`flex items-center ${
                step < totalSteps ? "flex-1" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step <= currentStep
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-500"
                }`}
              >
                {step}
              </div>
              {step < totalSteps && (
                <div
                  className={`h-1 flex-1 ${
                    step < currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Basic Info</span>
          <span>Contact</span>
          <span>Medical</span>
          <span>Documents</span>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-300 bg-white p-6"
      >
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Registering..." : "Register Patient"}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Webcam Modal */}
      {showWebcam && (
        <WebcamCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  );
}
