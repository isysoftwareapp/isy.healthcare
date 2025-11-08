import mongoose, { Schema, Document, Types, Model } from "mongoose";

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  appointmentId: string;
  patient: Types.ObjectId;
  practitioner: Types.ObjectId;
  clinic: Types.ObjectId;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  type: "consultation" | "follow-up" | "procedure" | "checkup" | "emergency";
  status:
    | "scheduled"
    | "confirmed"
    | "checked-in"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "no-show";
  reason: string;
  notes?: string;
  reminderSent: {
    sms: boolean;
    email: boolean;
    sentAt?: Date;
  };
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointmentModel extends Model<IAppointment> {
  checkConflict(
    practitionerId: Types.ObjectId,
    appointmentDate: Date,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: Types.ObjectId
  ): Promise<{
    hasConflict: boolean;
    conflictingAppointment?: IAppointment;
  }>;

  getPractitionerAvailability(
    practitionerId: Types.ObjectId,
    appointmentDate: Date,
    clinicId: Types.ObjectId
  ): Promise<{
    isAvailable: boolean;
    reason?: string;
    operatingHours?: {
      open: string;
      close: string;
    };
    slots: Array<{
      startTime: string;
      endTime: string;
      isBooked: boolean;
    }>;
  }>;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    practitioner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480, // 8 hours max
    },
    type: {
      type: String,
      enum: ["consultation", "follow-up", "procedure", "checkup", "emergency"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "checked-in",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: "scheduled",
      index: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    reminderSent: {
      sms: {
        type: Boolean,
        default: false,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: Date,
    cancellationReason: {
      type: String,
      maxlength: 500,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
AppointmentSchema.index({ clinic: 1, appointmentDate: 1 });
AppointmentSchema.index({ practitioner: 1, appointmentDate: 1 });
AppointmentSchema.index({ patient: 1, appointmentDate: -1 });
AppointmentSchema.index({ appointmentDate: 1, status: 1 });

// Virtual for full datetime
AppointmentSchema.virtual("startDateTime").get(function (this: IAppointment) {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
});

AppointmentSchema.virtual("endDateTime").get(function (this: IAppointment) {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.endTime.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
});

// Check if appointment time conflicts with another appointment
AppointmentSchema.statics.checkConflict = async function (
  practitionerId: Types.ObjectId,
  appointmentDate: Date,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: Types.ObjectId
) {
  const query: any = {
    practitioner: practitionerId,
    appointmentDate,
    status: { $in: ["scheduled", "confirmed", "checked-in", "in-progress"] },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const appointments = await this.find(query);

  const [newStartHour, newStartMin] = startTime.split(":").map(Number);
  const [newEndHour, newEndMin] = endTime.split(":").map(Number);
  const newStart = newStartHour * 60 + newStartMin;
  const newEnd = newEndHour * 60 + newEndMin;

  for (const apt of appointments) {
    const [existingStartHour, existingStartMin] = apt.startTime
      .split(":")
      .map(Number);
    const [existingEndHour, existingEndMin] = apt.endTime
      .split(":")
      .map(Number);
    const existingStart = existingStartHour * 60 + existingStartMin;
    const existingEnd = existingEndHour * 60 + existingEndMin;

    // Check for overlap
    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      return {
        hasConflict: true,
        conflictingAppointment: apt,
      };
    }
  }

  return { hasConflict: false };
};

// Get practitioner's availability for a date
AppointmentSchema.statics.getPractitionerAvailability = async function (
  practitionerId: Types.ObjectId,
  appointmentDate: Date,
  clinicId: Types.ObjectId
) {
  // Get clinic operating hours
  const Clinic = mongoose.model("Clinic");
  const clinic = await Clinic.findById(clinicId);

  if (!clinic) {
    throw new Error("Clinic not found");
  }

  const dayOfWeek = appointmentDate.getDay();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[dayOfWeek];

  const operatingHours = clinic.operatingHours?.[dayName];

  if (!operatingHours || !operatingHours.isOpen) {
    return {
      isAvailable: false,
      reason: "Clinic is closed on this day",
      slots: [],
    };
  }

  // Get all appointments for the practitioner on this date
  const appointments = await this.find({
    practitioner: practitionerId,
    appointmentDate,
    status: { $in: ["scheduled", "confirmed", "checked-in", "in-progress"] },
  }).sort({ startTime: 1 });

  // Generate available slots (30-minute intervals)
  const slots = [];
  const [openHour, openMin] = operatingHours.open.split(":").map(Number);
  const [closeHour, closeMin] = operatingHours.close.split(":").map(Number);

  let currentTime = openHour * 60 + openMin;
  const endTime = closeHour * 60 + closeMin;

  while (currentTime + 30 <= endTime) {
    const slotStart = currentTime;
    const slotEnd = currentTime + 30;

    // Check if this slot conflicts with any appointment
    let isBooked = false;
    for (const apt of appointments) {
      const [aptStartHour, aptStartMin] = apt.startTime.split(":").map(Number);
      const [aptEndHour, aptEndMin] = apt.endTime.split(":").map(Number);
      const aptStart = aptStartHour * 60 + aptStartMin;
      const aptEnd = aptEndHour * 60 + aptEndMin;

      if (slotStart < aptEnd && slotEnd > aptStart) {
        isBooked = true;
        break;
      }
    }

    const startHour = Math.floor(slotStart / 60);
    const startMin = slotStart % 60;
    const endHour = Math.floor(slotEnd / 60);
    const endMin = slotEnd % 60;

    slots.push({
      startTime: `${String(startHour).padStart(2, "0")}:${String(
        startMin
      ).padStart(2, "0")}`,
      endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(
        2,
        "0"
      )}`,
      isBooked,
    });

    currentTime += 30;
  }

  return {
    isAvailable: true,
    operatingHours: {
      open: operatingHours.open,
      close: operatingHours.close,
    },
    slots,
  };
};

// Ensure virtual fields are serialized
AppointmentSchema.set("toJSON", { virtuals: true });
AppointmentSchema.set("toObject", { virtuals: true });

const Appointment =
  (mongoose.models.Appointment as IAppointmentModel) ||
  mongoose.model<IAppointment, IAppointmentModel>(
    "Appointment",
    AppointmentSchema
  );

export default Appointment;
