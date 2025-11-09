import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role:
    | "Admin"
    | "Director"
    | "Operational"
    | "Doctor"
    | "Nurse"
    | "Reception"
    | "Finance"
    | "Laboratory"
    | "Radiology"
    | "Pharmacy";
  firstName: string;
  lastName: string;

  // Multi-clinic assignment (FR 5.3)
  assignedClinics: mongoose.Types.ObjectId[]; // References to Clinic documents
  primaryClinic?: mongoose.Types.ObjectId; // Default/main clinic

  // Professional details
  professionalDetails?: {
    licenseNumber?: string;
    specialization?: string;
    department?: string;
  };

  // Status
  isActive: boolean;

  // User preferences (NFR 3.2, 3.3)
  preferences: {
    language: string; // Multi-language support
    theme: "light" | "dark"; // Dark/Light mode
    defaultClinic?: mongoose.Types.ObjectId; // Preferred clinic for login
  };

  // Security
  lastLogin?: Date;
  passwordChangedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        "Admin",
        "Director",
        "Operational",
        "Doctor",
        "Nurse",
        "Reception",
        "Finance",
        "Laboratory",
        "Radiology",
        "Pharmacy",
      ],
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    assignedClinics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Clinic",
      },
    ],
    primaryClinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
    },
    professionalDetails: {
      licenseNumber: String,
      specialization: String,
      department: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    preferences: {
      language: {
        type: String,
        default: "en",
      },
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      defaultClinic: {
        type: Schema.Types.ObjectId,
        ref: "Clinic",
      },
    },
    lastLogin: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
// NOTE: `email` field already includes `unique: true`. Removing the duplicate
// schema-level unique index declaration to avoid Mongoose duplicate index warnings.
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ assignedClinics: 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user has access to a specific clinic
UserSchema.methods.hasAccessToClinic = function (
  this: IUser,
  clinicId: string | mongoose.Types.ObjectId
): boolean {
  // Admin, Director, and Operational have global access
  if (["Admin", "Director", "Operational"].includes(this.role)) {
    return true;
  }

  // Check if clinic is in assignedClinics
  return this.assignedClinics.some(
    (clinic) => clinic.toString() === clinicId.toString()
  );
};

// Static method to find users by clinic
UserSchema.statics.findByClinic = function (
  clinicId: string | mongoose.Types.ObjectId,
  role?: string
) {
  const query: any = {
    isActive: true,
    assignedClinics: clinicId,
  };

  if (role) {
    query.role = role;
  }

  return this.find(query).sort({ firstName: 1, lastName: 1 });
};

export default models.User || model<IUser>("User", UserSchema);
