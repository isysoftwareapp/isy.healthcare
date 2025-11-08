import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Template Model
 * Manages clinic-specific templates for various documents
 * Supports FR 5.4 for clinic-specific templates
 */

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId;
  templateId: string;
  name: string;
  type:
    | "ConsultationNote"
    | "Prescription"
    | "LabOrder"
    | "RadiologyOrder"
    | "ConsentForm"
    | "Invoice"
    | "Other";

  // Clinic association
  assignedClinics: mongoose.Types.ObjectId[]; // Can be used by multiple clinics

  // Template content structure
  sections: {
    sectionId: string;
    title: string;
    order: number;
    isRequired: boolean;
    type:
      | "Text"
      | "Checkbox"
      | "Dropdown"
      | "Table"
      | "Signature"
      | "Date"
      | "Number";
    fields?: {
      fieldId: string;
      label: string;
      type:
        | "Text"
        | "Number"
        | "Date"
        | "Checkbox"
        | "Radio"
        | "Dropdown"
        | "Textarea";
      placeholder?: string;
      defaultValue?: string;
      options?: string[]; // For dropdown/radio
      isRequired: boolean;
      validationRules?: {
        min?: number;
        max?: number;
        pattern?: string;
        customMessage?: string;
      };
    }[];
  }[];

  // SOAP format specific (for consultation notes)
  soapFormat?: {
    subjective: boolean;
    objective: boolean;
    assessment: boolean;
    plan: boolean;
  };

  // Template metadata
  version: string;
  isActive: boolean;
  isDefault: boolean; // Default template for the type

  // Permissions
  allowedRoles: string[]; // Which roles can use this template

  // Branding/Formatting
  headerContent?: string; // HTML/text for header
  footerContent?: string; // HTML/text for footer
  styling?: {
    fontSize?: string;
    fontFamily?: string;
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };

  createdBy: mongoose.Types.ObjectId; // User who created it
  lastModifiedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema(
  {
    templateId: {
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
    type: {
      type: String,
      required: true,
      enum: [
        "ConsultationNote",
        "Prescription",
        "LabOrder",
        "RadiologyOrder",
        "ConsentForm",
        "Invoice",
        "Other",
      ],
      index: true,
    },
    assignedClinics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Clinic",
        required: true,
      },
    ],
    sections: [
      {
        sectionId: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
          required: true,
          min: 1,
        },
        isRequired: {
          type: Boolean,
          default: false,
        },
        type: {
          type: String,
          enum: [
            "Text",
            "Checkbox",
            "Dropdown",
            "Table",
            "Signature",
            "Date",
            "Number",
          ],
          required: true,
        },
        fields: [
          {
            fieldId: {
              type: String,
              required: true,
            },
            label: {
              type: String,
              required: true,
            },
            type: {
              type: String,
              enum: [
                "Text",
                "Number",
                "Date",
                "Checkbox",
                "Radio",
                "Dropdown",
                "Textarea",
              ],
              required: true,
            },
            placeholder: String,
            defaultValue: String,
            options: [String],
            isRequired: {
              type: Boolean,
              default: false,
            },
            validationRules: {
              min: Number,
              max: Number,
              pattern: String,
              customMessage: String,
            },
          },
        ],
      },
    ],
    soapFormat: {
      subjective: {
        type: Boolean,
        default: false,
      },
      objective: {
        type: Boolean,
        default: false,
      },
      assessment: {
        type: Boolean,
        default: false,
      },
      plan: {
        type: Boolean,
        default: false,
      },
    },
    version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    allowedRoles: {
      type: [String],
      default: ["Admin", "Director", "Doctor"],
    },
    headerContent: String,
    footerContent: String,
    styling: {
      fontSize: String,
      fontFamily: String,
      margins: {
        top: Number,
        right: Number,
        bottom: Number,
        left: Number,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TemplateSchema.index({ type: 1, isActive: 1 });
TemplateSchema.index({ assignedClinics: 1, isActive: 1 });
TemplateSchema.index({ name: "text" });

// Static method to find templates by clinic and type
TemplateSchema.statics.findByClinicAndType = function (
  clinicId: string | mongoose.Types.ObjectId,
  type: string
) {
  return this.find({
    assignedClinics: clinicId,
    type: type,
    isActive: true,
  }).sort({ isDefault: -1, name: 1 });
};

// Static method to get default template for a type and clinic
TemplateSchema.statics.getDefaultTemplate = function (
  clinicId: string | mongoose.Types.ObjectId,
  type: string
) {
  return this.findOne({
    assignedClinics: clinicId,
    type: type,
    isActive: true,
    isDefault: true,
  });
};

const Template: Model<ITemplate> =
  mongoose.models.Template ||
  mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;
