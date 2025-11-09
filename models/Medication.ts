import mongoose, { Schema, Document } from "mongoose";

/**
 * Medication Inventory Model
 * Manages medication stock, batch tracking, expiry dates, and reorder levels
 */

export interface IMedicationBatch {
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  receivedDate: Date;
  supplier?: string;
  cost?: number;
  isExpired?: boolean;
}

export interface IStockAdjustment {
  adjustmentDate: Date;
  adjustmentType:
    | "received"
    | "dispensed"
    | "expired"
    | "damaged"
    | "returned"
    | "correction";
  quantity: number; // Positive for addition, negative for reduction
  batchNumber?: string;
  reason?: string;
  performedBy: mongoose.Types.ObjectId; // Reference to User
  notes?: string;
}

export interface IMedication extends Document {
  _id: mongoose.Types.ObjectId;
  clinic: mongoose.Types.ObjectId; // Reference to Clinic

  // Basic Information
  name: string; // Generic/brand name
  genericName?: string;
  brandName?: string;
  manufacturer?: string;

  // Classification
  category:
    | "antibiotic"
    | "analgesic"
    | "antihistamine"
    | "antiviral"
    | "cardiovascular"
    | "diabetes"
    | "gastrointestinal"
    | "respiratory"
    | "dermatological"
    | "neurological"
    | "other";
  form:
    | "tablet"
    | "capsule"
    | "syrup"
    | "injection"
    | "cream"
    | "ointment"
    | "drops"
    | "inhaler"
    | "suppository"
    | "patch"
    | "other";
  strength: string; // e.g., "500mg", "10ml"
  unit: string; // e.g., "mg", "ml", "units"

  // Prescription Information
  requiresPrescription: boolean;
  isControlled: boolean; // Controlled substance
  controlledClass?: string; // DEA schedule if applicable

  // Inventory Management
  sku?: string; // Stock Keeping Unit
  barcode?: string;
  currentStock: number; // Total available quantity
  reorderLevel: number; // Minimum stock level before reorder
  reorderQuantity: number; // Quantity to order when below reorder level
  maxStockLevel?: number;

  // Batch Tracking
  batches: IMedicationBatch[];

  // Pricing
  costPrice?: number; // Purchase price per unit
  sellingPrice: number; // Selling price per unit
  currency: string;

  // Storage
  storageLocation?: string; // e.g., "Shelf A1", "Refrigerator 2"
  storageConditions?: string; // e.g., "Store in cool, dry place"
  requiresRefrigeration: boolean;

  // Usage Instructions
  dosageInstructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
  interactions?: string[];

  // Stock Adjustments History
  stockAdjustments: IStockAdjustment[];

  // Status
  isActive: boolean;
  isDiscontinued: boolean;
  discontinuedDate?: Date;
  discontinuedReason?: string;

  // Alerts
  hasLowStock?: boolean;
  hasExpiringSoon?: boolean; // Within 30 days
  hasExpired?: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  lastUpdatedBy: mongoose.Types.ObjectId;
}

const MedicationBatchSchema = new Schema<IMedicationBatch>({
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true },
  receivedDate: { type: Date, required: true, default: Date.now },
  supplier: { type: String },
  cost: { type: Number, min: 0 },
  isExpired: { type: Boolean, default: false },
});

const StockAdjustmentSchema = new Schema<IStockAdjustment>({
  adjustmentDate: { type: Date, required: true, default: Date.now },
  adjustmentType: {
    type: String,
    enum: [
      "received",
      "dispensed",
      "expired",
      "damaged",
      "returned",
      "correction",
    ],
    required: true,
  },
  quantity: { type: Number, required: true },
  batchNumber: { type: String },
  reason: { type: String },
  performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String },
});

const MedicationSchema = new Schema<IMedication>(
  {
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },

    // Basic Information
    name: { type: String, required: true },
    genericName: { type: String },
    brandName: { type: String },
    manufacturer: { type: String },

    // Classification
    category: {
      type: String,
      enum: [
        "antibiotic",
        "analgesic",
        "antihistamine",
        "antiviral",
        "cardiovascular",
        "diabetes",
        "gastrointestinal",
        "respiratory",
        "dermatological",
        "neurological",
        "other",
      ],
      required: true,
    },
    form: {
      type: String,
      enum: [
        "tablet",
        "capsule",
        "syrup",
        "injection",
        "cream",
        "ointment",
        "drops",
        "inhaler",
        "suppository",
        "patch",
        "other",
      ],
      required: true,
    },
    strength: { type: String, required: true },
    unit: { type: String, required: true },

    // Prescription Information
    requiresPrescription: { type: Boolean, default: true },
    isControlled: { type: Boolean, default: false },
    controlledClass: { type: String },

    // Inventory Management
    sku: { type: String, unique: true, sparse: true },
    barcode: { type: String },
    currentStock: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, required: true, default: 10, min: 0 },
    reorderQuantity: { type: Number, required: true, default: 50, min: 0 },
    maxStockLevel: { type: Number, min: 0 },

    // Batch Tracking
    batches: [MedicationBatchSchema],

    // Pricing
    costPrice: { type: Number, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },

    // Storage
    storageLocation: { type: String },
    storageConditions: { type: String },
    requiresRefrigeration: { type: Boolean, default: false },

    // Usage Instructions
    dosageInstructions: { type: String },
    sideEffects: [{ type: String }],
    contraindications: [{ type: String }],
    interactions: [{ type: String }],

    // Stock Adjustments History
    stockAdjustments: [StockAdjustmentSchema],

    // Status
    isActive: { type: Boolean, default: true },
    isDiscontinued: { type: Boolean, default: false },
    discontinuedDate: { type: Date },
    discontinuedReason: { type: String },

    // Alerts (computed fields)
    hasLowStock: { type: Boolean, default: false },
    hasExpiringSoon: { type: Boolean, default: false },
    hasExpired: { type: Boolean, default: false },

    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MedicationSchema.index({ clinic: 1, name: 1 });
MedicationSchema.index({ clinic: 1, isActive: 1 });
MedicationSchema.index({ clinic: 1, hasLowStock: 1 });
MedicationSchema.index({ clinic: 1, hasExpiringSoon: 1 });
// `sku` is declared with `unique: true` on the field. Remove duplicate index
// declaration to avoid Mongoose duplicate index warnings.
MedicationSchema.index({ barcode: 1 });

// Pre-save middleware to update alert flags
MedicationSchema.pre("save", function (next) {
  // Check low stock
  this.hasLowStock = this.currentStock <= this.reorderLevel;

  // Check expiring batches (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  this.hasExpiringSoon = this.batches.some(
    (batch) =>
      batch.expiryDate <= thirtyDaysFromNow && batch.expiryDate > new Date()
  );

  // Check expired batches
  const now = new Date();
  this.hasExpired = this.batches.some((batch) => batch.expiryDate <= now);

  // Mark expired batches
  this.batches.forEach((batch) => {
    batch.isExpired = batch.expiryDate <= now;
  });

  next();
});

// Instance method to adjust stock
MedicationSchema.methods.adjustStock = function (
  adjustment: Omit<IStockAdjustment, "adjustmentDate">
) {
  // Add the adjustment to history
  this.stockAdjustments.push({
    ...adjustment,
    adjustmentDate: new Date(),
  });

  // Update current stock
  this.currentStock += adjustment.quantity;

  // If this is a batch-specific adjustment, update the batch
  if (adjustment.batchNumber) {
    const batch = this.batches.find(
      (b: IMedicationBatch) => b.batchNumber === adjustment.batchNumber
    );
    if (batch) {
      batch.quantity += adjustment.quantity;

      // Remove batch if quantity is 0 or less
      if (batch.quantity <= 0) {
        this.batches = this.batches.filter(
          (b: IMedicationBatch) => b.batchNumber !== adjustment.batchNumber
        );
      }
    }
  }

  return this.save();
};

// Instance method to add new batch
MedicationSchema.methods.addBatch = function (
  batch: Omit<IMedicationBatch, "receivedDate">
) {
  this.batches.push({
    ...batch,
    receivedDate: new Date(),
  });

  this.currentStock += batch.quantity;

  return this.save();
};

// Static method to get low stock medications
MedicationSchema.statics.getLowStock = function (clinicId: string) {
  return this.find({
    clinic: clinicId,
    isActive: true,
    hasLowStock: true,
  }).sort({ currentStock: 1 });
};

// Static method to get expiring medications
MedicationSchema.statics.getExpiringSoon = function (clinicId: string) {
  return this.find({
    clinic: clinicId,
    isActive: true,
    hasExpiringSoon: true,
  }).sort({ "batches.expiryDate": 1 });
};

const Medication =
  mongoose.models.Medication ||
  mongoose.model<IMedication>("Medication", MedicationSchema);

export default Medication;
