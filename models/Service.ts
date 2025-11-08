import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
  serviceId: string;
  serviceName: string;
  category:
    | "Consultation"
    | "Procedure"
    | "Laboratory"
    | "Radiology"
    | "Pharmacy"
    | "Other";
  description?: string;
  pricing: {
    local: number;
    localWithInsurance: number;
    tourist: number;
    touristWithInsurance: number;
  };
  isActive: boolean;
  assignedClinic: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Consultation",
        "Procedure",
        "Laboratory",
        "Radiology",
        "Pharmacy",
        "Other",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    pricing: {
      local: {
        type: Number,
        required: true,
        min: 0,
      },
      localWithInsurance: {
        type: Number,
        required: true,
        min: 0,
      },
      tourist: {
        type: Number,
        required: true,
        min: 0,
      },
      touristWithInsurance: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedClinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick searches
ServiceSchema.index({ serviceName: "text", serviceId: "text" });
ServiceSchema.index({ assignedClinic: 1, isActive: 1 });

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);

export default Service;
