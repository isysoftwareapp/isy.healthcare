"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Building2,
  Save,
  X,
} from "lucide-react";

interface Template {
  _id?: string;
  name: string;
  type: "soap" | "prescription" | "consent-form";
  content: string;
  isGlobal: boolean;
  clinic?: string;
}

interface Clinic {
  _id: string;
  name: string;
  clinicId: string;
  code: string;
}

const TEMPLATE_TYPES = [
  { value: "soap", label: "SOAP Note Template" },
  { value: "prescription", label: "Prescription Template" },
  { value: "consent-form", label: "Consent Form Template" },
];

const SOAP_TEMPLATE_DEFAULTS = [
  {
    name: "General Consultation",
    content: `SUBJECTIVE:
Chief Complaint:
History of Present Illness:
Past Medical History:
Current Medications:
Allergies:

OBJECTIVE:
Vital Signs:
Physical Examination:

ASSESSMENT:
Diagnosis:

PLAN:
Treatment:
Follow-up:`,
  },
  {
    name: "Follow-up Visit",
    content: `SUBJECTIVE:
Status since last visit:
Current symptoms:
Medication compliance:

OBJECTIVE:
Vital Signs:
Examination findings:

ASSESSMENT:
Progress:

PLAN:
Continue/Adjust treatment:
Next follow-up:`,
  },
];

export default function TemplatesPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("global");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Template>({
    name: "",
    type: "soap",
    content: "",
    isGlobal: true,
  });

  useEffect(() => {
    fetchClinics();
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [selectedClinic]);

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics");
      const data = await response.json();

      if (data.success) {
        setClinics(data.data);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from /api/templates
      // For now, we'll use mock data
      const mockTemplates: Template[] = [
        {
          _id: "1",
          name: "General Consultation",
          type: "soap",
          content: SOAP_TEMPLATE_DEFAULTS[0].content,
          isGlobal: true,
        },
        {
          _id: "2",
          name: "Follow-up Visit",
          type: "soap",
          content: SOAP_TEMPLATE_DEFAULTS[1].content,
          isGlobal: true,
        },
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      type: "soap",
      content: "",
      isGlobal: selectedClinic === "global",
      clinic: selectedClinic === "global" ? undefined : selectedClinic,
    });
    setShowEditor(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData(template);
    setShowEditor(true);
  };

  const handleSave = async () => {
    // In real implementation, this would POST/PATCH to /api/templates
    console.log("Saving template:", formData);
    setShowEditor(false);
    await fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    // In real implementation, this would DELETE to /api/templates/:id
    console.log("Deleting template:", id);
    await fetchTemplates();
  };

  const handleDuplicate = (template: Template) => {
    setEditingTemplate(null);
    setFormData({
      ...template,
      _id: undefined,
      name: `${template.name} (Copy)`,
    });
    setShowEditor(true);
  };

  const useDefault = (defaultTemplate: (typeof SOAP_TEMPLATE_DEFAULTS)[0]) => {
    setFormData({
      ...formData,
      name: defaultTemplate.name,
      content: defaultTemplate.content,
    });
  };

  const getTypeLabel = (type: string) => {
    return TEMPLATE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      soap: "bg-blue-100 text-blue-800",
      prescription: "bg-green-100 text-green-800",
      "consent-form": "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredTemplates = templates.filter((t) =>
    selectedClinic === "global" ? t.isGlobal : t.clinic === selectedClinic
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Template Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage SOAP notes, prescriptions, and form templates
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Template</span>
          </button>
        </div>

        {/* Clinic Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Scope
          </label>
          <select
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
          >
            <option value="global">Global (All Clinics)</option>
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name} ({clinic.clinicId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedClinic === "global"
              ? "Global Templates"
              : "Clinic Templates"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No templates found</p>
            <p className="text-sm mt-2">
              Create your first template to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <div
                key={template._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(
                          template.type
                        )}`}
                      >
                        {getTypeLabel(template.type)}
                      </span>
                      {template.isGlobal && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          Global
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                      {template.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplicate template"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit template"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template._id!)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? "Edit Template" : "New Template"}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Template Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as Template["type"],
                    })
                  }
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Templates (for SOAP) */}
              {formData.type === "soap" && !editingTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start with a default template
                  </label>
                  <div className="flex gap-2">
                    {SOAP_TEMPLATE_DEFAULTS.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => useDefault(template)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Content *
                </label>
                <textarea
                  required
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter your template content here..."
                />
              </div>

              {/* Scope */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isGlobal}
                    onChange={(e) =>
                      setFormData({ ...formData, isGlobal: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Make this template available to all clinics
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{editingTemplate ? "Update" : "Create"} Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
