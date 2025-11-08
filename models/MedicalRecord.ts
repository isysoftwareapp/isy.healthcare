import mongoose, { Schema, Document, Model } from "mongoose";

// Vitals Interface
export interface IVitals {
  temperature?: number; // Celsius
  bloodPressureSystolic?: number; // mmHg
  bloodPressureDiastolic?: number; // mmHg
  heartRate?: number; // bpm
  respiratoryRate?: number; // breaths per minute
  oxygenSaturation?: number; // SpO2 percentage
  weight?: number; // kg
  height?: number; // cm
  bmi?: number; // calculated
  bloodGlucose?: number; // mg/dL
  recordedAt: Date;
  recordedBy: mongoose.Types.ObjectId; // User reference
  notes?: string;
}

// SOAP Note Interface
export interface ISOAPNote {
  subjective: string; // Patient's description of symptoms
  objective: string; // Observable findings, vitals, test results
  assessment: string; // Diagnosis or clinical impression
  plan: string; // Treatment plan, medications, follow-up
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId; // User reference
}

// Allergy Interface
export interface IAllergy {
  allergen: string; // Name of allergen
  category: "medication" | "food" | "environmental" | "other";
  reaction: string; // Description of reaction
  severity: "mild" | "moderate" | "severe" | "life-threatening";
  onsetDate?: Date;
  notes?: string;
  recordedAt: Date;
  recordedBy: mongoose.Types.ObjectId;
}

// Diagnosis Interface
export interface IDiagnosis {
  code: string; // ICD-10 code
  description: string; // Diagnosis description
  type: "primary" | "secondary" | "differential";
  status: "active" | "resolved" | "ruled-out";
  onsetDate?: Date;
  resolvedDate?: Date;
  notes?: string;
  recordedAt: Date;
  recordedBy: mongoose.Types.ObjectId;
}

// Prescription Interface
export interface IPrescription {
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
  startDate: Date;
  endDate?: Date;
  prescribedBy: mongoose.Types.ObjectId;
  status: "active" | "completed" | "discontinued" | "on-hold";
  discontinuedReason?: string;
  discontinuedAt?: Date;
}

// Medical Document Interface
export interface IMedicalDocument {
  documentType:
    | "lab-result"
    | "imaging"
    | "report"
    | "consent"
    | "referral"
    | "other";
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
}

// Main Medical Record Interface
export interface IMedicalRecord extends Document {
  patient: mongoose.Types.ObjectId;
  clinic: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId; // Optional link to appointment

  // SOAP Notes
  soapNotes: ISOAPNote[];

  // Vitals
  vitals: IVitals[];

  // Allergies
  allergies: IAllergy[];

  // Diagnoses
  diagnoses: IDiagnosis[];

  // Prescriptions
  prescriptions: IPrescription[];

  // Documents
  documents: IMedicalDocument[];

  // Chief Complaint
  chiefComplaint?: string;

  // Medical History Summary
  medicalHistory?: string;

  // Family History
  familyHistory?: string;

  // Social History
  socialHistory?: string;

  // Review of Systems
  reviewOfSystems?: string;

  // Created/Updated tracking
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Vitals Schema
const VitalsSchema = new Schema<IVitals>({
  temperature: { type: Number, min: 30, max: 45 },
  bloodPressureSystolic: { type: Number, min: 60, max: 250 },
  bloodPressureDiastolic: { type: Number, min: 40, max: 150 },
  heartRate: { type: Number, min: 30, max: 220 },
  respiratoryRate: { type: Number, min: 8, max: 60 },
  oxygenSaturation: { type: Number, min: 50, max: 100 },
  weight: { type: Number, min: 0.5, max: 500 },
  height: { type: Number, min: 30, max: 250 },
  bmi: { type: Number, min: 10, max: 80 },
  bloodGlucose: { type: Number, min: 20, max: 600 },
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  notes: String,
});

// SOAP Note Schema
const SOAPNoteSchema = new Schema<ISOAPNote>({
  subjective: { type: String, required: true },
  objective: { type: String, required: true },
  assessment: { type: String, required: true },
  plan: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Allergy Schema
const AllergySchema = new Schema<IAllergy>({
  allergen: { type: String, required: true },
  category: {
    type: String,
    enum: ["medication", "food", "environmental", "other"],
    required: true,
  },
  reaction: { type: String, required: true },
  severity: {
    type: String,
    enum: ["mild", "moderate", "severe", "life-threatening"],
    required: true,
  },
  onsetDate: Date,
  notes: String,
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Diagnosis Schema
const DiagnosisSchema = new Schema<IDiagnosis>({
  code: { type: String, required: true }, // ICD-10 code
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["primary", "secondary", "differential"],
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "resolved", "ruled-out"],
    default: "active",
  },
  onsetDate: Date,
  resolvedDate: Date,
  notes: String,
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Prescription Schema
const PrescriptionSchema = new Schema<IPrescription>({
  medicationName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  route: {
    type: String,
    enum: [
      "oral",
      "topical",
      "intravenous",
      "intramuscular",
      "subcutaneous",
      "inhalation",
      "other",
    ],
    required: true,
  },
  duration: { type: String, required: true },
  quantity: { type: Number, required: true },
  refills: { type: Number, default: 0 },
  instructions: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  prescribedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["active", "completed", "discontinued", "on-hold"],
    default: "active",
  },
  discontinuedReason: String,
  discontinuedAt: Date,
});

// Medical Document Schema
const MedicalDocumentSchema = new Schema<IMedicalDocument>({
  documentType: {
    type: String,
    enum: ["lab-result", "imaging", "report", "consent", "referral", "other"],
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Main Medical Record Schema
const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    soapNotes: [SOAPNoteSchema],
    vitals: [VitalsSchema],
    allergies: [AllergySchema],
    diagnoses: [DiagnosisSchema],
    prescriptions: [PrescriptionSchema],
    documents: [MedicalDocumentSchema],
    chiefComplaint: String,
    medicalHistory: String,
    familyHistory: String,
    socialHistory: String,
    reviewOfSystems: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MedicalRecordSchema.index({ patient: 1, createdAt: -1 });
MedicalRecordSchema.index({ clinic: 1, createdAt: -1 });
MedicalRecordSchema.index({ appointment: 1 });
MedicalRecordSchema.index({ "diagnoses.code": 1 });
MedicalRecordSchema.index({ "prescriptions.status": 1 });

// Pre-save middleware to calculate BMI
VitalsSchema.pre("save", function (next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat(
      (this.weight / (heightInMeters * heightInMeters)).toFixed(1)
    );
  }
  next();
});

// Drug-allergy interaction check method
MedicalRecordSchema.methods.checkDrugAllergyInteraction = function (
  medicationName: string
): { hasInteraction: boolean; allergies: IAllergy[] } {
  const drugAllergies = this.allergies.filter(
    (allergy: IAllergy) =>
      allergy.category === "medication" &&
      allergy.allergen.toLowerCase().includes(medicationName.toLowerCase())
  );

  return {
    hasInteraction: drugAllergies.length > 0,
    allergies: drugAllergies,
  };
};

const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ||
  mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);

export default MedicalRecord;
