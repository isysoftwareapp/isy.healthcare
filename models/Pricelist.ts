import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Pricelist Model
 * Manages custom pricelists for specific insurance providers or special contracts
 * Supports FR 4.5-4.7 for dynamic pricing
 */

export interface IPricelist extends Document {
  _id: mongoose.Types.ObjectId;
  pricelistId: string;
  name: string;
  description?: string;
  type: "Insurance" | "Contract" | "Custom" | "Promotional";

  // Clinic association
  assignedClinic: mongoose.Types.ObjectId;

  // Pricelist items (services and their prices)
  items: {
    serviceId: mongoose.Types.ObjectId; // Reference to Service
    price: number;
    currency: string;
    effectiveDate: Date;
    expiryDate?: Date;
  }[];

  // Discount configuration
  discount?: {
    type: "Percentage" | "Fixed";
    value: number;
    appliesTo: "All" | "Selected"; // All services or selected categories
    categories?: string[];
  };

  // Validity
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;

  // Associated with specific insurance provider (if applicable)
  insuranceProviderId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const PricelistSchema: Schema = new Schema(
  {
    pricelistId: {
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
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Insurance", "Contract", "Custom", "Promotional"],
      default: "Custom",
    },
    assignedClinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    items: [
      {
        serviceId: {
          type: Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        currency: {
          type: String,
          required: true,
          default: "USD",
          uppercase: true,
        },
        effectiveDate: {
          type: Date,
          required: true,
          default: Date.now,
        },
        expiryDate: Date,
      },
    ],
    discount: {
      type: {
        type: String,
        enum: ["Percentage", "Fixed"],
      },
      value: {
        type: Number,
        min: 0,
      },
      appliesTo: {
        type: String,
        enum: ["All", "Selected"],
        default: "All",
      },
      categories: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: Date,
    insuranceProviderId: {
      type: Schema.Types.ObjectId,
      ref: "InsuranceProvider",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PricelistSchema.index({ assignedClinic: 1, isActive: 1 });
PricelistSchema.index({ type: 1, isActive: 1 });
PricelistSchema.index({ insuranceProviderId: 1 });
PricelistSchema.index({ effectiveDate: 1, expiryDate: 1 });

// Method to get price for a specific service
PricelistSchema.methods.getPriceForService = function (
  this: IPricelist,
  serviceId: string | mongoose.Types.ObjectId
): number | null {
  const item = this.items.find(
    (item) => item.serviceId.toString() === serviceId.toString()
  );
  return item ? item.price : null;
};

// Method to check if pricelist is currently valid
PricelistSchema.methods.isCurrentlyValid = function (
  this: IPricelist
): boolean {
  const now = new Date();
  const isEffective = now >= this.effectiveDate;
  const notExpired = !this.expiryDate || now <= this.expiryDate;
  return this.isActive && isEffective && notExpired;
};

// Static method to find active pricelists for a clinic
PricelistSchema.statics.findActiveByClinic = function (
  clinicId: string | mongoose.Types.ObjectId
) {
  const now = new Date();
  return this.find({
    assignedClinic: clinicId,
    isActive: true,
    effectiveDate: { $lte: now },
    $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: now } }],
  }).populate("items.serviceId");
};

const Pricelist: Model<IPricelist> =
  mongoose.models.Pricelist ||
  mongoose.model<IPricelist>("Pricelist", PricelistSchema);

export default Pricelist;
