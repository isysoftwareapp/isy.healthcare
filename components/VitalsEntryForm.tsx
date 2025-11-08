"use client";

import { useState } from "react";
import {
  Activity,
  Thermometer,
  Heart,
  Droplet,
  Weight,
  Ruler,
} from "lucide-react";

interface VitalsData {
  temperature: number | string;
  bloodPressure: {
    systolic: number | string;
    diastolic: number | string;
  };
  heartRate: number | string;
  respiratoryRate: number | string;
  oxygenSaturation: number | string;
  weight: number | string;
  height: number | string;
  bloodGlucose?: number | string;
  notes?: string;
  recordedBy: string;
}

interface VitalsEntryFormProps {
  onSubmit: (vitals: VitalsData) => void;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: Partial<VitalsData>;
}

export default function VitalsEntryForm({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
}: VitalsEntryFormProps) {
  const [formData, setFormData] = useState<VitalsData>({
    temperature: initialData?.temperature || "",
    bloodPressure: {
      systolic: initialData?.bloodPressure?.systolic || "",
      diastolic: initialData?.bloodPressure?.diastolic || "",
    },
    heartRate: initialData?.heartRate || "",
    respiratoryRate: initialData?.respiratoryRate || "",
    oxygenSaturation: initialData?.oxygenSaturation || "",
    weight: initialData?.weight || "",
    height: initialData?.height || "",
    bloodGlucose: initialData?.bloodGlucose || "",
    notes: initialData?.notes || "",
    recordedBy: initialData?.recordedBy || "",
  });

  const handleChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof VitalsData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight as string);
    const height = parseFloat(formData.height as string);
    if (weight && height && height > 0) {
      const bmi = weight / Math.pow(height, 2);
      return bmi.toFixed(1);
    }
    return "-";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Temperature and Heart Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Temperature (°C)
            </div>
          </label>
          <input
            type="number"
            step="0.1"
            min="30"
            max="45"
            value={formData.temperature}
            onChange={(e) => handleChange("temperature", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="36.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Heart Rate (bpm)
            </div>
          </label>
          <input
            type="number"
            min="30"
            max="220"
            value={formData.heartRate}
            onChange={(e) => handleChange("heartRate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="72"
          />
        </div>
      </div>

      {/* Blood Pressure */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Blood Pressure (mmHg)
          </div>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              min="60"
              max="250"
              value={formData.bloodPressure.systolic}
              onChange={(e) =>
                handleChange("bloodPressure.systolic", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="120 (Systolic)"
            />
          </div>
          <div>
            <input
              type="number"
              min="40"
              max="150"
              value={formData.bloodPressure.diastolic}
              onChange={(e) =>
                handleChange("bloodPressure.diastolic", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="80 (Diastolic)"
            />
          </div>
        </div>
      </div>

      {/* Respiratory Rate and Oxygen Saturation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Respiratory Rate (breaths/min)
          </label>
          <input
            type="number"
            min="8"
            max="40"
            value={formData.respiratoryRate}
            onChange={(e) => handleChange("respiratoryRate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="16"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Oxygen Saturation (%)
            </div>
          </label>
          <input
            type="number"
            min="50"
            max="100"
            value={formData.oxygenSaturation}
            onChange={(e) => handleChange("oxygenSaturation", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="98"
          />
        </div>
      </div>

      {/* Weight and Height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4" />
              Weight (kg)
            </div>
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="300"
            value={formData.weight}
            onChange={(e) => handleChange("weight", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="70.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Height (m)
            </div>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.5"
            max="2.5"
            value={formData.height}
            onChange={(e) => handleChange("height", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1.75"
          />
        </div>
      </div>

      {/* BMI Display */}
      {formData.weight && formData.height && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Calculated BMI:
            </span>
            <span className="text-lg font-bold text-blue-900">
              {calculateBMI()} kg/m²
            </span>
          </div>
        </div>
      )}

      {/* Blood Glucose (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Blood Glucose (mg/dL) - Optional
        </label>
        <input
          type="number"
          step="0.1"
          min="20"
          max="600"
          value={formData.bloodGlucose}
          onChange={(e) => handleChange("bloodGlucose", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="100"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional observations..."
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Vitals</span>
          )}
        </button>
      </div>
    </form>
  );
}
