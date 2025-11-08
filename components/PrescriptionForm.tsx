"use client";

import { useState } from "react";
import { Pill, AlertTriangle, X } from "lucide-react";

interface Prescription {
  medicationName: string;
  dosage: string;
  frequency: string;
  route:
    | "oral"
    | "topical"
    | "intravenous"
    | "intramuscular"
    | "subcutaneous"
    | "inhalation"
    | "other";
  duration: string;
  quantity: number;
  refills: number;
  instructions: string;
  startDate: string;
  prescribedBy: string;
  status: "active";
}

interface DrugInteraction {
  medication: string;
  allergen: string;
  severity: string;
  reaction: string;
}

interface PrescriptionFormProps {
  onSubmit: (
    prescription: Prescription
  ) => Promise<{ success: boolean; interactions?: DrugInteraction[] }>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function PrescriptionForm({
  onSubmit,
  onCancel,
  loading = false,
}: PrescriptionFormProps) {
  const [formData, setFormData] = useState<Prescription>({
    medicationName: "",
    dosage: "",
    frequency: "",
    route: "oral",
    duration: "",
    quantity: 0,
    refills: 0,
    instructions: "",
    startDate: new Date().toISOString().split("T")[0],
    prescribedBy: "",
    status: "active",
  });

  const [interactionWarning, setInteractionWarning] = useState<
    DrugInteraction[] | null
  >(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleChange = (field: keyof Prescription, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, override = false) => {
    e.preventDefault();

    const result = await onSubmit(formData);

    if (!result.success && result.interactions && !override) {
      setInteractionWarning(result.interactions);
      setShowConfirmation(true);
    } else if (result.success) {
      // Reset form on success
      setFormData({
        medicationName: "",
        dosage: "",
        frequency: "",
        route: "oral",
        duration: "",
        quantity: 0,
        refills: 0,
        instructions: "",
        startDate: new Date().toISOString().split("T")[0],
        prescribedBy: "",
        status: "active",
      });
      setInteractionWarning(null);
      setShowConfirmation(false);
    }
  };

  const handleOverride = async () => {
    // In a real implementation, this would require additional authorization
    // For now, we'll just log the override and close the warning
    console.warn(
      "OVERRIDE: Prescription with drug-allergy interaction approved"
    );
    setShowConfirmation(false);
    setInteractionWarning(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Pill className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">E-Prescribing</h3>
      </div>

      {/* Drug Interaction Warning */}
      {showConfirmation && interactionWarning && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 text-lg mb-2">
                ⚠️ DRUG-ALLERGY INTERACTION DETECTED
              </h4>
              <p className="text-red-800 mb-3">
                Patient has known allergies to this medication:
              </p>
              {interactionWarning.map((interaction, index) => (
                <div
                  key={index}
                  className="bg-white border border-red-300 rounded p-3 mb-2"
                >
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">Medication:</span>{" "}
                      {interaction.medication}
                    </div>
                    <div>
                      <span className="font-semibold">Allergen:</span>{" "}
                      {interaction.allergen}
                    </div>
                    <div>
                      <span className="font-semibold">Severity:</span>{" "}
                      <span className="uppercase font-bold text-red-700">
                        {interaction.severity}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Reaction:</span>{" "}
                      {interaction.reaction}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmation(false);
                    setInteractionWarning(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold"
                >
                  Cancel Prescription
                </button>
                <button
                  type="button"
                  onClick={handleOverride}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Override (Requires Authorization)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        {/* Medication Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medication Name *
          </label>
          <input
            type="text"
            value={formData.medicationName}
            onChange={(e) => handleChange("medicationName", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Amoxicillin"
          />
        </div>

        {/* Dosage and Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dosage *
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => handleChange("dosage", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 500mg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <input
              type="text"
              value={formData.frequency}
              onChange={(e) => handleChange("frequency", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Twice daily, Every 8 hours"
            />
          </div>
        </div>

        {/* Route and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route *
            </label>
            <select
              value={formData.route}
              onChange={(e) => handleChange("route", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="oral">Oral</option>
              <option value="topical">Topical</option>
              <option value="intravenous">Intravenous (IV)</option>
              <option value="intramuscular">Intramuscular (IM)</option>
              <option value="subcutaneous">Subcutaneous (SC)</option>
              <option value="inhalation">Inhalation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration *
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 7 days, 2 weeks"
            />
          </div>
        </div>

        {/* Quantity and Refills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                handleChange("quantity", parseInt(e.target.value))
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of units"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refills
            </label>
            <input
              type="number"
              min="0"
              value={formData.refills}
              onChange={(e) =>
                handleChange("refills", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of refills"
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions *
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => handleChange("instructions", e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Take with food. Complete the full course even if symptoms improve."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Pill className="w-4 h-4" />
                <span>Prescribe Medication</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
