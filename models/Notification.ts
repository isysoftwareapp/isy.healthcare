import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  _id: string;
  clinic: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId; // User who receives the notification
  type:
    | "appointment-reminder"
    | "appointment-confirmed"
    | "appointment-cancelled"
    | "prescription-ready"
    | "low-stock-alert"
    | "medication-expiring"
    | "invoice-overdue"
    | "patient-message"
    | "system-message"
    | "staff-message";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "unread" | "read" | "archived";
  relatedModel?:
    | "Appointment"
    | "Patient"
    | "Medication"
    | "Invoice"
    | "MedicalRecord";
  relatedId?: mongoose.Types.ObjectId;
  actionUrl?: string; // URL to navigate when notification is clicked
  scheduledFor?: Date; // For scheduled notifications (e.g., appointment reminders)
  sentAt?: Date;
  readAt?: Date;
  archivedAt?: Date;
  metadata?: {
    appointmentDate?: Date;
    patientName?: string;
    medicationName?: string;
    invoiceAmount?: number;
    stockLevel?: number;
    expiryDate?: Date;
    [key: string]: any;
  };
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "appointment-reminder",
        "appointment-confirmed",
        "appointment-cancelled",
        "prescription-ready",
        "low-stock-alert",
        "medication-expiring",
        "invoice-overdue",
        "patient-message",
        "system-message",
        "staff-message",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
      index: true,
    },
    relatedModel: {
      type: String,
      enum: [
        "Appointment",
        "Patient",
        "Medication",
        "Invoice",
        "MedicalRecord",
      ],
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    actionUrl: {
      type: String,
    },
    scheduledFor: {
      type: Date,
      index: true,
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
notificationSchema.index({ clinic: 1, recipient: 1, status: 1 });
notificationSchema.index({ clinic: 1, type: 1, status: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });

// Instance methods
notificationSchema.methods.markAsRead = async function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsArchived = async function () {
  this.status = "archived";
  this.archivedAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = async function (
  userId: string,
  clinicId?: string
) {
  const query: any = {
    recipient: userId,
    status: "unread",
  };
  if (clinicId) {
    query.clinic = clinicId;
  }
  return this.countDocuments(query);
};

notificationSchema.statics.markAllAsRead = async function (
  userId: string,
  clinicId?: string
) {
  const query: any = {
    recipient: userId,
    status: "unread",
  };
  if (clinicId) {
    query.clinic = clinicId;
  }
  return this.updateMany(query, {
    $set: { status: "read", readAt: new Date() },
  });
};

notificationSchema.statics.createAppointmentReminder = async function (
  appointmentId: string,
  clinicId: string,
  patientUserId: string,
  appointmentDate: Date,
  doctorName: string
) {
  // Schedule reminder 24 hours before appointment
  const reminderTime = new Date(appointmentDate);
  reminderTime.setHours(reminderTime.getHours() - 24);

  return this.create({
    clinic: clinicId,
    recipient: patientUserId,
    type: "appointment-reminder",
    title: "Appointment Reminder",
    message: `You have an appointment tomorrow with ${doctorName} at ${appointmentDate.toLocaleTimeString()}`,
    priority: "medium",
    relatedModel: "Appointment",
    relatedId: appointmentId,
    actionUrl: `/dashboard/appointments/${appointmentId}`,
    scheduledFor: reminderTime,
    metadata: {
      appointmentDate,
      doctorName,
    },
  });
};

notificationSchema.statics.createLowStockAlert = async function (
  medicationId: string,
  clinicId: string,
  pharmacistUserId: string,
  medicationName: string,
  currentStock: number,
  reorderLevel: number
) {
  return this.create({
    clinic: clinicId,
    recipient: pharmacistUserId,
    type: "low-stock-alert",
    title: "Low Stock Alert",
    message: `${medicationName} is running low (${currentStock} units remaining, reorder level: ${reorderLevel})`,
    priority: currentStock === 0 ? "urgent" : "high",
    relatedModel: "Medication",
    relatedId: medicationId,
    actionUrl: `/dashboard/pharmacy/medications/${medicationId}`,
    sentAt: new Date(),
    metadata: {
      medicationName,
      stockLevel: currentStock,
      reorderLevel,
    },
  });
};

notificationSchema.statics.createPrescriptionReadyAlert = async function (
  patientUserId: string,
  clinicId: string,
  patientName: string,
  medicationNames: string[]
) {
  return this.create({
    clinic: clinicId,
    recipient: patientUserId,
    type: "prescription-ready",
    title: "Prescription Ready",
    message: `Your prescription is ready for pickup: ${medicationNames.join(
      ", "
    )}`,
    priority: "medium",
    sentAt: new Date(),
    metadata: {
      patientName,
      medications: medicationNames,
    },
  });
};

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
