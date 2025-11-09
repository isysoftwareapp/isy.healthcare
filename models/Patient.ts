import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: string; // Unique auto-generated ID (FR 1.2)
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: "Male" | "Female" | "Other" | "male" | "female" | "other";
  email?: string;
  phoneNumber?: string;

  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  // Emergency Contact (FR 1.1)
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  };

  // Insurance Details (FR 1.1)
  insuranceDetails?: {
    providerId: mongoose.Types.ObjectId; // Reference to InsuranceProvider
    provider: string; // Provider name for display
    policyNumber: string;
    groupNumber?: string;
    expiryDate: Date;
    copayAmount?: number;
    copayPercentage?: number;
  };

  // Patient Photo & ID (FR 1.4, 1.5)
  photo?: string; // URL or base64 encoded image
  passportScan?: string; // URL or encrypted storage path (NFR 1.4 - highest encryption)

  // Patient Category for pricing (FR 4.5)
  category?: "Local" | "Local_Insurance" | "Tourist" | "Tourist_Insurance";

  // Multi-clinic support
  primaryClinic?: mongoose.Types.ObjectId; // Main clinic
  visitedClinics?: mongoose.Types.ObjectId[]; // All clinics patient has visited

  // Status
  isActive: boolean;

  // Medical Alerts (quick reference)
  medicalAlerts?: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "male", "Female", "female", "Other", "other"],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },
    insuranceDetails: {
      providerId: {
        type: Schema.Types.ObjectId,
        ref: "InsuranceProvider",
      },
      provider: String,
      policyNumber: String,
      groupNumber: String,
      expiryDate: Date,
      copayAmount: Number,
      copayPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    photo: String,
    passportScan: {
      type: String,
      select: false, // Restricted access (NFR 1.4)
    },
    category: {
      type: String,
      enum: ["Local", "Local_Insurance", "Tourist", "Tourist_Insurance"],
      default: "Local",
    },
    primaryClinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      index: true,
    },
    visitedClinics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Clinic",
      },
    ],
    medicalAlerts: {
      allergies: [String],
      chronicConditions: [String],
      currentMedications: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and search optimization
// NOTE: `patientId` is already declared with `unique: true` on the field.
// Avoid duplicate index declarations which emit Mongoose warnings.
PatientSchema.index({ firstName: "text", lastName: "text", patientId: "text" });
PatientSchema.index({ phoneNumber: 1 });
PatientSchema.index({ primaryClinic: 1, isActive: 1 });
PatientSchema.index({ visitedClinics: 1 });
PatientSchema.index({ "insuranceDetails.providerId": 1 });

// Virtual for full name
PatientSchema.virtual("fullName").get(function (this: IPatient) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
PatientSchema.virtual("age").get(function (this: IPatient) {
  if (!this.dateOfBirth) return undefined;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth as Date);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

// Pre-save hook to add clinic to visitedClinics
PatientSchema.pre("save", function (next) {
  if (this.isNew && this.primaryClinic) {
    this.visitedClinics = [this.primaryClinic];
  }
  next();
});

export default models.Patient || model<IPatient>("Patient", PatientSchema);
