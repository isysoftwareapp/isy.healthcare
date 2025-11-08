"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  User,
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  Pill,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import VitalsEntryForm from "@/components/VitalsEntryForm";
import SOAPNoteEditor from "@/components/SOAPNoteEditor";
import AllergyManager from "@/components/AllergyManager";
import PrescriptionForm from "@/components/PrescriptionForm";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  patientId: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
}

interface MedicalRecord {
  _id: string;
  patient: Patient;
  createdAt: string;
  vitals: any[];
  soapNotes: any[];
  allergies: any[];
  diagnoses: any[];
  prescriptions: any[];
  documents: any[];
}

export default function PatientMedicalHistory() {
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch patient details
      const patientResponse = await fetch(`/api/patients/${patientId}`);
      const patientData = await patientResponse.json();

      if (patientData.success) {
        setPatient(patientData.data);
      }

      // Fetch medical records
      const recordsResponse = await fetch(
        `/api/medical-records?patientId=${patientId}`
      );
      const recordsData = await recordsResponse.json();

      if (recordsData.success) {
        setRecords(recordsData.data);
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVitals = async (vitals: any) => {
    try {
      // This would create a new medical record or add to existing one
      const response = await fetch(`/api/medical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientId,
          clinic: "current-clinic-id", // Should come from session
          vitals: [vitals],
          createdBy: "current-user-id", // Should come from session
        }),
      });

      if (response.ok) {
        fetchPatientData();
        setActiveSection(null);
      }
    } catch (error) {
      console.error("Error adding vitals:", error);
    }
  };

  const handleAddSOAPNote = async (soapNote: any) => {
    try {
      const response = await fetch(`/api/medical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientId,
          clinic: "current-clinic-id",
          soapNotes: [soapNote],
          createdBy: "current-user-id",
        }),
      });

      if (response.ok) {
        fetchPatientData();
        setActiveSection(null);
      }
    } catch (error) {
      console.error("Error adding SOAP note:", error);
    }
  };

  const handleAddAllergy = async (allergy: any) => {
    try {
      // Add to most recent record or create new one
      const latestRecord = records[0];
      if (latestRecord) {
        const response = await fetch(
          `/api/medical-records/${latestRecord._id}/allergies`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(allergy),
          }
        );

        if (response.ok) {
          fetchPatientData();
        }
      }
    } catch (error) {
      console.error("Error adding allergy:", error);
    }
  };

  const handleRemoveAllergy = async (allergen: string) => {
    try {
      const latestRecord = records[0];
      if (latestRecord) {
        const response = await fetch(
          `/api/medical-records/${latestRecord._id}/allergies?allergen=${allergen}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          fetchPatientData();
        }
      }
    } catch (error) {
      console.error("Error removing allergy:", error);
    }
  };

  const handleAddPrescription = async (prescription: any) => {
    try {
      const latestRecord = records[0];
      if (latestRecord) {
        const response = await fetch(
          `/api/medical-records/${latestRecord._id}/prescriptions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prescription),
          }
        );

        const data = await response.json();

        if (data.success) {
          fetchPatientData();
          return { success: true };
        } else if (data.interactions) {
          return { success: false, interactions: data.interactions };
        }
      }
    } catch (error) {
      console.error("Error adding prescription:", error);
    }
    return { success: false };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Get all allergies from all records
  const allAllergies = records.flatMap((r) => r.allergies || []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient medical history...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Patient not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>ID: {patient.patientId}</span>
                <span>•</span>
                <span>
                  {patient.gender} • {calculateAge(patient.dateOfBirth)} years
                </span>
                <span>•</span>
                <span>DOB: {formatDate(patient.dateOfBirth)}</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>{patient.email}</span>
                <span>•</span>
                <span>{patient.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() =>
            setActiveSection(activeSection === "vitals" ? null : "vitals")
          }
          className="bg-white border-2 border-blue-500 text-blue-600 rounded-lg p-4 hover:bg-blue-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span className="font-semibold">Add Vitals</span>
          </div>
        </button>

        <button
          onClick={() =>
            setActiveSection(activeSection === "soap" ? null : "soap")
          }
          className="bg-white border-2 border-green-500 text-green-600 rounded-lg p-4 hover:bg-green-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="font-semibold">SOAP Note</span>
          </div>
        </button>

        <button
          onClick={() =>
            setActiveSection(activeSection === "allergy" ? null : "allergy")
          }
          className="bg-white border-2 border-orange-500 text-orange-600 rounded-lg p-4 hover:bg-orange-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Allergies</span>
          </div>
        </button>

        <button
          onClick={() =>
            setActiveSection(
              activeSection === "prescription" ? null : "prescription"
            )
          }
          className="bg-white border-2 border-purple-500 text-purple-600 rounded-lg p-4 hover:bg-purple-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            <span className="font-semibold">Prescribe</span>
          </div>
        </button>
      </div>

      {/* Active Section Forms */}
      {activeSection === "vitals" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <VitalsEntryForm
            onSubmit={handleAddVitals}
            onCancel={() => setActiveSection(null)}
          />
        </div>
      )}

      {activeSection === "soap" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <SOAPNoteEditor
            onSubmit={handleAddSOAPNote}
            onCancel={() => setActiveSection(null)}
          />
        </div>
      )}

      {activeSection === "allergy" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <AllergyManager
            allergies={allAllergies}
            onAdd={handleAddAllergy}
            onRemove={handleRemoveAllergy}
          />
        </div>
      )}

      {activeSection === "prescription" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <PrescriptionForm
            onSubmit={handleAddPrescription}
            onCancel={() => setActiveSection(null)}
          />
        </div>
      )}

      {/* Medical Records Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Medical History Timeline
          </h2>
        </div>

        <div className="p-6">
          {records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No medical records found</p>
              <p className="text-sm mt-2">
                Start by adding vitals or a SOAP note
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record._id} className="border rounded-lg">
                  <button
                    onClick={() =>
                      setExpandedRecord(
                        expandedRecord === record._id ? null : record._id
                      )
                    }
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">
                          {formatDate(record.createdAt)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {record.soapNotes.length} notes •{" "}
                          {record.vitals.length} vitals •{" "}
                          {record.prescriptions.length} prescriptions
                        </div>
                      </div>
                    </div>
                    {expandedRecord === record._id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedRecord === record._id && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-6">
                      {/* Vitals */}
                      {record.vitals.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Vitals
                          </h4>
                          {record.vitals.map((vital: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white p-3 rounded border"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Temp:</span>{" "}
                                  <span className="font-medium">
                                    {vital.temperature}°C
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">BP:</span>{" "}
                                  <span className="font-medium">
                                    {vital.bloodPressure.systolic}/
                                    {vital.bloodPressure.diastolic}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">HR:</span>{" "}
                                  <span className="font-medium">
                                    {vital.heartRate} bpm
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">SpO2:</span>{" "}
                                  <span className="font-medium">
                                    {vital.oxygenSaturation}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* SOAP Notes */}
                      {record.soapNotes.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            SOAP Notes
                          </h4>
                          {record.soapNotes.map((note: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white p-4 rounded border space-y-3"
                            >
                              <div>
                                <div className="text-xs font-semibold text-blue-600 mb-1">
                                  SUBJECTIVE
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {note.subjective}
                                </p>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-green-600 mb-1">
                                  OBJECTIVE
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {note.objective}
                                </p>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-yellow-600 mb-1">
                                  ASSESSMENT
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {note.assessment}
                                </p>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-purple-600 mb-1">
                                  PLAN
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {note.plan}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Prescriptions */}
                      {record.prescriptions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Prescriptions
                          </h4>
                          <div className="space-y-2">
                            {record.prescriptions.map(
                              (rx: any, index: number) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 rounded border"
                                >
                                  <div className="font-medium text-gray-900">
                                    {rx.medicationName}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {rx.dosage} • {rx.frequency} • {rx.route} •{" "}
                                    {rx.duration}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {rx.instructions}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
