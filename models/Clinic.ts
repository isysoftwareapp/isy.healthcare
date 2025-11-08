import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Clinic Model
 * Represents a physical clinic location with its own settings, staff, and operational parameters
 * Supports multi-clinic management as per FR 5.1-5.4
 */

export interface IClinic extends Document {
  _id: mongoose.Types.ObjectId;
  clinicId: string; // Unique identifier (e.g., "NYC-001")
  name: string;
  code: string; // Short code for quick reference (e.g., "NYC", "LA")

  // Contact Information
  contactInfo: {
    email: string;
    phone: string;
    fax?: string;
    website?: string;
  };

  // Physical Address
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    timezone: string; // e.g., "America/New_York"
  };

  // Operational Settings
  operationalSettings: {
    operatingHours: {
      monday: { isOpen: boolean; open?: string; close?: string };
      tuesday: { isOpen: boolean; open?: string; close?: string };
      wednesday: { isOpen: boolean; open?: string; close?: string };
      thursday: { isOpen: boolean; open?: string; close?: string };
      friday: { isOpen: boolean; open?: string; close?: string };
      saturday: { isOpen: boolean; open?: string; close?: string };
      sunday: { isOpen: boolean; open?: string; close?: string };
    };
    appointmentSlotDuration: number; // in minutes (e.g., 15, 30)
    autoLogoutDuration: number; // in minutes (default: 15 per NFR 1.2)
    defaultLanguage: string; // Default language for this clinic
  };

  // Currency & Financial Settings
  financialSettings: {
    primaryCurrency: string; // e.g., "USD", "EUR"
    acceptedCurrencies: string[]; // Additional currencies accepted
    exchangeRates: Map<string, number>; // Daily exchange rates
    taxRate?: number; // Tax percentage if applicable
    invoicePrefix: string; // Invoice number prefix (e.g., "NYC-INV-")
  };

  // Templates & Documents (clinic-specific templates per FR 5.4)
  templates: {
    consultationNotes: mongoose.Types.ObjectId[]; // References to Template documents
    prescriptionForms: mongoose.Types.ObjectId[];
    labOrderForms: mongoose.Types.ObjectId[];
    radiologyOrderForms: mongoose.Types.ObjectId[];
    consentForms: mongoose.Types.ObjectId[];
  };

  // Pricing Configuration
  pricingConfig: {
    usesCustomPricelists: boolean;
    customPricelists: {
      name: string;
      description?: string;
      pricelistId: mongoose.Types.ObjectId; // Reference to Pricelist document
    }[];
  };

  // Insurance Providers accepted at this clinic
  acceptedInsuranceProviders: {
    providerId: mongoose.Types.ObjectId; // Reference to InsuranceProvider document
    contractNumber?: string;
    effectiveDate: Date;
    expiryDate?: Date;
  }[];

  // Status & Metadata
  isActive: boolean;
  registrationNumber?: string; // Official clinic registration/license number
  accreditations?: string[]; // Healthcare accreditations

  // Branding
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const ClinicSchema: Schema = new Schema(
  {
    clinicId: {
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
      unique: true,
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
      timezone: {
        type: String,
        required: true,
        default: "UTC",
      },
    },
    operationalSettings: {
      operatingHours: {
        monday: {
          isOpen: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "17:00" },
        },
        tuesday: {
          isOpen: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "17:00" },
        },
        wednesday: {
          isOpen: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "17:00" },
        },
        thursday: {
          isOpen: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "17:00" },
        },
        friday: {
          isOpen: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "17:00" },
        },
        saturday: {
          isOpen: { type: Boolean, default: false },
          open: String,
          close: String,
        },
        sunday: {
          isOpen: { type: Boolean, default: false },
          open: String,
          close: String,
        },
      },
      appointmentSlotDuration: {
        type: Number,
        default: 30,
        min: 5,
        max: 120,
      },
      autoLogoutDuration: {
        type: Number,
        default: 15, // NFR 1.2 requirement
        min: 5,
        max: 60,
      },
      defaultLanguage: {
        type: String,
        default: "en",
      },
    },
    financialSettings: {
      primaryCurrency: {
        type: String,
        required: true,
        default: "USD",
        uppercase: true,
      },
      acceptedCurrencies: {
        type: [String],
        default: ["USD"],
      },
      exchangeRates: {
        type: Map,
        of: Number,
        default: new Map([["USD", 1.0]]),
      },
      taxRate: {
        type: Number,
        min: 0,
        max: 100,
      },
      invoicePrefix: {
        type: String,
        required: true,
        uppercase: true,
      },
    },
    templates: {
      consultationNotes: [
        {
          type: Schema.Types.ObjectId,
          ref: "Template",
        },
      ],
      prescriptionForms: [
        {
          type: Schema.Types.ObjectId,
          ref: "Template",
        },
      ],
      labOrderForms: [
        {
          type: Schema.Types.ObjectId,
          ref: "Template",
        },
      ],
      radiologyOrderForms: [
        {
          type: Schema.Types.ObjectId,
          ref: "Template",
        },
      ],
      consentForms: [
        {
          type: Schema.Types.ObjectId,
          ref: "Template",
        },
      ],
    },
    pricingConfig: {
      usesCustomPricelists: {
        type: Boolean,
        default: false,
      },
      customPricelists: [
        {
          name: String,
          description: String,
          pricelistId: {
            type: Schema.Types.ObjectId,
            ref: "Pricelist",
          },
        },
      ],
    },
    acceptedInsuranceProviders: [
      {
        providerId: {
          type: Schema.Types.ObjectId,
          ref: "InsuranceProvider",
        },
        contractNumber: String,
        effectiveDate: {
          type: Date,
          required: true,
        },
        expiryDate: Date,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    registrationNumber: String,
    accreditations: [String],
    branding: {
      logoUrl: String,
      primaryColor: String,
      secondaryColor: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
ClinicSchema.index({ name: "text", code: "text" }); // Text search
ClinicSchema.index({ isActive: 1, code: 1 }); // Active clinics lookup
ClinicSchema.index({ "address.city": 1, "address.country": 1 }); // Location-based queries

// Virtual for full address
ClinicSchema.virtual("fullAddress").get(function (this: IClinic) {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.postalCode}, ${this.address.country}`;
});

// Method to check if clinic is currently open
ClinicSchema.methods.isCurrentlyOpen = function (this: IClinic): boolean {
  const now = new Date();
  const dayOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][now.getDay()] as keyof IClinic["operationalSettings"]["operatingHours"];

  const hours = this.operationalSettings.operatingHours[dayOfWeek];

  if (!hours.isOpen || !hours.open || !hours.close) {
    return false;
  }

  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  return currentTime >= hours.open && currentTime <= hours.close;
};

// Static method to find active clinics
ClinicSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

const Clinic: Model<IClinic> =
  mongoose.models.Clinic || mongoose.model<IClinic>("Clinic", ClinicSchema);

export default Clinic;
