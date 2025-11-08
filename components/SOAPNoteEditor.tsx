"use client";

import { useState } from "react";
import { FileText, Save } from "lucide-react";

interface SOAPNoteData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  recordedBy: string;
}

interface SOAPNoteEditorProps {
  onSubmit: (soapNote: SOAPNoteData) => void;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: Partial<SOAPNoteData>;
}

export default function SOAPNoteEditor({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
}: SOAPNoteEditorProps) {
  const [formData, setFormData] = useState<SOAPNoteData>({
    subjective: initialData?.subjective || "",
    objective: initialData?.objective || "",
    assessment: initialData?.assessment || "",
    plan: initialData?.plan || "",
    recordedBy: initialData?.recordedBy || "",
  });

  const handleChange = (field: keyof SOAPNoteData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const useTemplate = () => {
    setFormData({
      ...formData,
      subjective:
        "Chief Complaint:\n\nHistory of Present Illness:\n\nPast Medical History:\n\nMedications:\n\nAllergies:\n\nSocial History:",
      objective:
        "Vital Signs:\n- Temperature:\n- Blood Pressure:\n- Heart Rate:\n- Respiratory Rate:\n- O2 Saturation:\n\nPhysical Examination:\n- General:\n- HEENT:\n- Cardiovascular:\n- Respiratory:\n- Abdomen:\n- Extremities:\n- Neurological:",
      assessment:
        "Primary Diagnosis:\n\nDifferential Diagnosis:\n\nProblem List:",
      plan: "Diagnostic:\n\nTherapeutic:\n\nPatient Education:\n\nFollow-up:\n\nReferrals:",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">SOAP Note</h3>
        </div>
        <button
          type="button"
          onClick={useTemplate}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Use Template
        </button>
      </div>

      {/* Subjective */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-blue-600 font-semibold">S</span>ubjective
          <span className="text-gray-500 text-xs ml-2">
            (Patient's reported symptoms, history)
          </span>
        </label>
        <textarea
          value={formData.subjective}
          onChange={(e) => handleChange("subjective", e.target.value)}
          rows={6}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="Patient reports..."
        />
      </div>

      {/* Objective */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-green-600 font-semibold">O</span>bjective
          <span className="text-gray-500 text-xs ml-2">
            (Observable findings, vitals, exam results)
          </span>
        </label>
        <textarea
          value={formData.objective}
          onChange={(e) => handleChange("objective", e.target.value)}
          rows={6}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="Physical examination reveals..."
        />
      </div>

      {/* Assessment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-yellow-600 font-semibold">A</span>ssessment
          <span className="text-gray-500 text-xs ml-2">
            (Diagnosis, clinical impression)
          </span>
        </label>
        <textarea
          value={formData.assessment}
          onChange={(e) => handleChange("assessment", e.target.value)}
          rows={5}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="Clinical assessment and diagnosis..."
        />
      </div>

      {/* Plan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-purple-600 font-semibold">P</span>lan
          <span className="text-gray-500 text-xs ml-2">
            (Treatment plan, follow-up, patient education)
          </span>
        </label>
        <textarea
          value={formData.plan}
          onChange={(e) => handleChange("plan", e.target.value)}
          rows={6}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="Treatment and management plan..."
        />
      </div>

      {/* Character counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-500">Subjective</div>
          <div className="text-sm font-medium text-gray-700">
            {formData.subjective.length} chars
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Objective</div>
          <div className="text-sm font-medium text-gray-700">
            {formData.objective.length} chars
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Assessment</div>
          <div className="text-sm font-medium text-gray-700">
            {formData.assessment.length} chars
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Plan</div>
          <div className="text-sm font-medium text-gray-700">
            {formData.plan.length} chars
          </div>
        </div>
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
            <>
              <Save className="w-4 h-4" />
              <span>Save SOAP Note</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
