import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Insurance Provider Model
 * Manages insurance companies and their contracts with clinics
 * Supports FR 4.3 for insurance claims processing
 */

export interface IInsuranceProvider extends Document {
  _id: mongoose.Types.ObjectId;
  providerId: string;
  name: string;
  code: string; // Short code (e.g., "BCBS", "UHC")

  // Contact Information
  contactInfo: {
    email: string;
    phone: string;
    fax?: string;
    website?: string;
  };

  // Address
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  // Contract Details
  contracts: {
    clinicId: mongoose.Types.ObjectId; // Reference to Clinic
    contractNumber: string;
    effectiveDate: Date;
    expiryDate?: Date;
    pricelistId?: mongoose.Types.ObjectId; // Custom pricelist for this contract
    copayAmount?: number;
    copayPercentage?: number;
    claimSubmissionMethod: "Electronic" | "Paper" | "Portal";
    claimSubmissionEmail?: string;
    claimSubmissionUrl?: string;
  }[];

  // Coverage Types
  coverageTypes: string[]; // e.g., ["Medical", "Dental", "Vision", "Pharmacy"]

  // Pre-authorization requirements
  requiresPreAuth: boolean;
  preAuthServices?: string[]; // Service categories requiring pre-auth

  // Payment terms
  paymentTerms?: {
    daysUntilPayment: number; // Average days until claim payment
    claimProcessingFee?: number;
  };

  // Provider Network
  networkType?: "HMO" | "PPO" | "EPO" | "POS" | "Other";

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const InsuranceProviderSchema: Schema = new Schema(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
      index: true,
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
      },
      fax: String,
      website: String,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
    },
    contracts: [
      {
        clinicId: {
          type: Schema.Types.ObjectId,
          ref: "Clinic",
          required: true,
        },
        contractNumber: {
          type: String,
          required: true,
        },
        effectiveDate: {
          type: Date,
          required: true,
        },
        expiryDate: Date,
        pricelistId: {
          type: Schema.Types.ObjectId,
          ref: "Pricelist",
        },
        copayAmount: Number,
        copayPercentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        claimSubmissionMethod: {
          type: String,
          enum: ["Electronic", "Paper", "Portal"],
          default: "Electronic",
        },
        claimSubmissionEmail: String,
        claimSubmissionUrl: String,
      },
    ],
    coverageTypes: {
      type: [String],
      default: ["Medical"],
    },
    requiresPreAuth: {
      type: Boolean,
      default: false,
    },
    preAuthServices: [String],
    paymentTerms: {
      daysUntilPayment: {
        type: Number,
        min: 1,
        default: 30,
      },
      claimProcessingFee: Number,
    },
    networkType: {
      type: String,
      enum: ["HMO", "PPO", "EPO", "POS", "Other"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
InsuranceProviderSchema.index({ name: "text", code: "text" });
InsuranceProviderSchema.index({ isActive: 1, code: 1 });
InsuranceProviderSchema.index({ "contracts.clinicId": 1 });

// Method to get active contract for a specific clinic
InsuranceProviderSchema.methods.getActiveContractForClinic = function (
  this: IInsuranceProvider,
  clinicId: string | mongoose.Types.ObjectId
) {
  const now = new Date();
  return this.contracts.find(
    (contract) =>
      contract.clinicId.toString() === clinicId.toString() &&
      contract.effectiveDate <= now &&
      (!contract.expiryDate || contract.expiryDate >= now)
  );
};

// Static method to find providers by clinic
InsuranceProviderSchema.statics.findByClinic = function (
  clinicId: string | mongoose.Types.ObjectId
) {
  return this.find({
    isActive: true,
    "contracts.clinicId": clinicId,
  });
};

const InsuranceProvider: Model<IInsuranceProvider> =
  mongoose.models.InsuranceProvider ||
  mongoose.model<IInsuranceProvider>(
    "InsuranceProvider",
    InsuranceProviderSchema
  );

export default InsuranceProvider;
