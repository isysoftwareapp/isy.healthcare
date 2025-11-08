import mongoose, { Schema, Document, Model } from "mongoose";

// Exchange Rate Interface
export interface IExchangeRate extends Document {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  inverseRate: number;
  clinic?: mongoose.Types.ObjectId;
  source: "manual" | "api" | "system";
  effectiveDate: Date;
  isActive: boolean;

  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Exchange Rate Model Interface with static methods
export interface IExchangeRateModel extends Model<IExchangeRate> {
  getCurrentRate(
    baseCurrency: string,
    targetCurrency: string,
    clinicId?: string
  ): Promise<number>;
  convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    clinicId?: string
  ): Promise<number>;
  setRate(
    baseCurrency: string,
    targetCurrency: string,
    rate: number,
    options?: {
      clinicId?: string;
      source?: "manual" | "api" | "system";
      userId?: string;
    }
  ): Promise<IExchangeRate>;
}

// Exchange Rate Schema
const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    targetCurrency: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    inverseRate: {
      type: Number,
      required: true,
      min: 0,
    },
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "api", "system"],
      default: "manual",
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Compound indexes
ExchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1, isActive: 1 });
ExchangeRateSchema.index({ clinic: 1, baseCurrency: 1, targetCurrency: 1 });

// Pre-save middleware to calculate inverse rate
ExchangeRateSchema.pre("save", function (next) {
  if (this.rate && this.rate > 0) {
    this.inverseRate = parseFloat((1 / this.rate).toFixed(6));
  }
  next();
});

// Static method to get current exchange rate
ExchangeRateSchema.statics.getCurrentRate = async function (
  baseCurrency: string,
  targetCurrency: string,
  clinicId?: string
) {
  // If same currency, return 1
  if (baseCurrency === targetCurrency) {
    return 1;
  }

  // Try to find clinic-specific rate first
  if (clinicId) {
    const clinicRate = await this.findOne({
      baseCurrency: baseCurrency.toUpperCase(),
      targetCurrency: targetCurrency.toUpperCase(),
      clinic: clinicId,
      isActive: true,
    }).sort({ effectiveDate: -1 });

    if (clinicRate) {
      return clinicRate.rate;
    }
  }

  // Fallback to global rate
  const globalRate = await this.findOne({
    baseCurrency: baseCurrency.toUpperCase(),
    targetCurrency: targetCurrency.toUpperCase(),
    clinic: { $exists: false },
    isActive: true,
  }).sort({ effectiveDate: -1 });

  if (globalRate) {
    return globalRate.rate;
  }

  // If direct rate not found, try inverse
  const inverseRate = await this.findOne({
    baseCurrency: targetCurrency.toUpperCase(),
    targetCurrency: baseCurrency.toUpperCase(),
    clinic: clinicId || { $exists: false },
    isActive: true,
  }).sort({ effectiveDate: -1 });

  if (inverseRate) {
    return inverseRate.inverseRate;
  }

  // Default to 1 if no rate found
  return 1;
};

// Static method to convert amount between currencies
ExchangeRateSchema.statics.convertAmount = async function (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  clinicId?: string
) {
  const ExchangeRateModel = this as IExchangeRateModel;
  const rate = await ExchangeRateModel.getCurrentRate(
    fromCurrency,
    toCurrency,
    clinicId
  );
  return parseFloat((amount * rate).toFixed(2));
};

// Method to create or update exchange rate
ExchangeRateSchema.statics.setRate = async function (
  baseCurrency: string,
  targetCurrency: string,
  rate: number,
  options: {
    clinicId?: string;
    source?: "manual" | "api" | "system";
    userId?: string;
  } = {}
) {
  const { clinicId, source = "manual", userId } = options;

  // Deactivate previous rates
  await this.updateMany(
    {
      baseCurrency: baseCurrency.toUpperCase(),
      targetCurrency: targetCurrency.toUpperCase(),
      ...(clinicId ? { clinic: clinicId } : { clinic: { $exists: false } }),
    },
    {
      $set: { isActive: false },
    }
  );

  // Create new rate
  const exchangeRate = await this.create({
    baseCurrency: baseCurrency.toUpperCase(),
    targetCurrency: targetCurrency.toUpperCase(),
    rate,
    clinic: clinicId,
    source,
    effectiveDate: new Date(),
    isActive: true,
    createdBy: userId,
  });

  return exchangeRate;
};

// Export model
export default (mongoose.models.ExchangeRate as IExchangeRateModel) ||
  mongoose.model<IExchangeRate, IExchangeRateModel>(
    "ExchangeRate",
    ExchangeRateSchema
  );
