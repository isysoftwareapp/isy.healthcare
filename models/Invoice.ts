import mongoose, { Schema, Document } from "mongoose";

// Invoice Item Interface
export interface IInvoiceItem {
  service: mongoose.Types.ObjectId;
  serviceName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: "percentage" | "fixed";
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

// Payment Interface
export interface IPayment {
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod:
    | "cash"
    | "card"
    | "bank-transfer"
    | "insurance"
    | "cheque"
    | "mobile-payment";
  reference?: string;
  paidAt: Date;
  recordedBy: mongoose.Types.ObjectId;
  notes?: string;
}

// Invoice Interface
export interface IInvoice extends Document {
  invoiceNumber: string;
  clinic: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;

  // Pricelist Information
  pricelistType:
    | "locals"
    | "locals-insurance"
    | "tourist"
    | "tourist-insurance"
    | "custom-1"
    | "custom-2";
  pricelistName?: string;

  // Currency and Exchange
  baseCurrency: string;
  displayCurrency: string;
  exchangeRate: number;

  // Invoice Items
  items: IInvoiceItem[];

  // Totals (in display currency)
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;

  // Payments
  payments: IPayment[];
  paidAmount: number;
  balanceAmount: number;

  // Status
  status:
    | "draft"
    | "issued"
    | "partially-paid"
    | "paid"
    | "cancelled"
    | "refunded";

  // Insurance Details (if applicable)
  insuranceProvider?: string;
  insuranceClaimNumber?: string;
  insuranceApprovalCode?: string;
  insuranceCoverage?: number;
  patientResponsibility?: number;

  // Dates
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;

  // Notes and References
  notes?: string;
  internalNotes?: string;

  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Item Schema
const InvoiceItemSchema = new Schema<IInvoiceItem>({
  service: {
    type: Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "percentage",
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

// Payment Schema
const PaymentSchema = new Schema<IPayment>({
  paymentId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: "USD",
  },
  paymentMethod: {
    type: String,
    enum: [
      "cash",
      "card",
      "bank-transfer",
      "insurance",
      "cheque",
      "mobile-payment",
    ],
    required: true,
  },
  reference: String,
  paidAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  notes: String,
});

// Invoice Schema
const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    pricelistType: {
      type: String,
      enum: [
        "locals",
        "locals-insurance",
        "tourist",
        "tourist-insurance",
        "custom-1",
        "custom-2",
      ],
      required: true,
      index: true,
    },
    pricelistName: String,
    baseCurrency: {
      type: String,
      required: true,
      default: "USD",
    },
    displayCurrency: {
      type: String,
      required: true,
      default: "USD",
    },
    exchangeRate: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    items: [InvoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    payments: [PaymentSchema],
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "issued",
        "partially-paid",
        "paid",
        "cancelled",
        "refunded",
      ],
      default: "draft",
      index: true,
    },
    insuranceProvider: String,
    insuranceClaimNumber: String,
    insuranceApprovalCode: String,
    insuranceCoverage: {
      type: Number,
      min: 0,
      max: 100,
    },
    patientResponsibility: Number,
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: Date,
    notes: String,
    internalNotes: String,
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
InvoiceSchema.index({ clinic: 1, createdAt: -1 });
InvoiceSchema.index({ patient: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });
// `invoiceNumber` is declared with `unique: true` on the field itself above.
// Remove duplicate schema-level unique index declaration to prevent Mongoose warnings.

// Pre-save middleware to calculate totals and balance
InvoiceSchema.pre("save", function (next) {
  // Calculate totals from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.totalDiscount = this.items.reduce((sum, item) => {
    if (item.discountType === "percentage") {
      return sum + (item.unitPrice * item.quantity * item.discount) / 100;
    } else {
      return sum + item.discount * item.quantity;
    }
  }, 0);
  this.totalTax = this.items.reduce((sum, item) => sum + item.tax, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + item.total, 0);

  // Calculate paid amount from payments
  this.paidAmount = this.payments.reduce((sum, payment) => {
    // Convert payment amount to display currency if needed
    if (payment.currency === this.displayCurrency) {
      return sum + payment.amount;
    } else {
      // In production, this should use actual exchange rates
      return sum + payment.amount * this.exchangeRate;
    }
  }, 0);

  // Calculate balance
  this.balanceAmount = this.totalAmount - this.paidAmount;

  // Auto-update status based on payment
  if (this.balanceAmount <= 0 && this.totalAmount > 0) {
    this.status = "paid";
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  } else if (this.paidAmount > 0 && this.balanceAmount > 0) {
    this.status = "partially-paid";
  } else if (this.status === "draft" && this.items.length > 0) {
    this.status = "issued";
  }

  // Set due date if not provided (default 30 days from issue)
  if (!this.dueDate) {
    this.dueDate = new Date(this.issueDate);
    this.dueDate.setDate(this.dueDate.getDate() + 30);
  }

  next();
});

// Method to add a payment
InvoiceSchema.methods.addPayment = function (
  payment: Omit<IPayment, "paymentId">
) {
  const paymentId = `PAY-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  this.payments.push({ ...payment, paymentId });
  return this.save();
};

// Method to calculate item totals
InvoiceSchema.methods.calculateItemTotals = function (item: IInvoiceItem) {
  const quantity = item.quantity;
  const unitPrice = item.unitPrice;

  // Calculate subtotal before discount
  const subtotalBeforeDiscount = unitPrice * quantity;

  // Calculate discount amount
  let discountAmount = 0;
  if (item.discountType === "percentage") {
    discountAmount = (subtotalBeforeDiscount * item.discount) / 100;
  } else {
    discountAmount = item.discount * quantity;
  }

  // Calculate subtotal after discount
  const subtotal = subtotalBeforeDiscount - discountAmount;

  // Calculate tax
  const tax = (subtotal * item.taxRate) / 100;

  // Calculate total
  const total = subtotal + tax;

  return {
    ...item,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

// Export model
export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);
