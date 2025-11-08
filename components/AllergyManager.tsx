"use client";

import { useState } from "react";
import { AlertTriangle, Plus, Trash2, X } from "lucide-react";

interface Allergy {
  _id?: string;
  allergen: string;
  category: "medication" | "food" | "environmental" | "other";
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life-threatening";
  notes?: string;
}

interface AllergyManagerProps {
  allergies: Allergy[];
  onAdd: (allergy: Omit<Allergy, "_id">) => void;
  onRemove: (allergen: string) => void;
  loading?: boolean;
}

export default function AllergyManager({
  allergies,
  onAdd,
  onRemove,
  loading = false,
}: AllergyManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Allergy, "_id">>({
    allergen: "",
    category: "medication",
    reaction: "",
    severity: "mild",
    notes: "",
  });

  const handleChange = (field: keyof Omit<Allergy, "_id">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      allergen: "",
      category: "medication",
      reaction: "",
      severity: "mild",
      notes: "",
    });
    setShowForm(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "life-threatening":
        return "bg-red-100 text-red-800 border-red-300";
      case "severe":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "mild":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    return category.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Allergies
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Allergy
          </button>
        )}
      </div>

      {/* Add Allergy Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Add New Allergy</h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergen *
                </label>
                <input
                  type="text"
                  value={formData.allergen}
                  onChange={(e) => handleChange("allergen", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Penicillin, Peanuts"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="medication">Medication</option>
                  <option value="food">Food</option>
                  <option value="environmental">Environmental</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reaction *
                </label>
                <input
                  type="text"
                  value={formData.reaction}
                  onChange={(e) => handleChange("reaction", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Rash, Anaphylaxis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity *
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => handleChange("severity", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life-threatening">Life-Threatening</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional information..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Allergy"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Allergies List */}
      {allergies.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No known allergies</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allergies.map((allergy, index) => (
            <div
              key={allergy._id || index}
              className={`border rounded-lg p-4 ${getSeverityColor(
                allergy.severity
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold">
                      {getCategoryIcon(allergy.category)}
                    </div>
                    <h4 className="font-semibold text-lg">
                      {allergy.allergen}
                    </h4>
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                      {allergy.category}
                    </span>
                  </div>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Reaction:</span>{" "}
                    {allergy.reaction}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase">
                      {allergy.severity}
                    </span>
                    {allergy.severity === "life-threatening" && (
                      <span className="text-xs font-bold animate-pulse">
                        ⚠️ CRITICAL
                      </span>
                    )}
                  </div>
                  {allergy.notes && (
                    <p className="text-sm mt-2 italic">{allergy.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(allergy.allergen)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  title="Remove allergy"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning for life-threatening allergies */}
      {allergies.some((a) => a.severity === "life-threatening") && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-bold">
              CRITICAL: Patient has life-threatening allergies!
            </p>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Extreme caution required when prescribing medications.
          </p>
        </div>
      )}
    </div>
  );
}
