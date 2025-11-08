import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  _id: string;
  clinic: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipients: mongoose.Types.ObjectId[]; // Can send to multiple staff
  subject: string;
  body: string;
  priority: "normal" | "high" | "urgent";
  isRead: Map<string, boolean>; // recipient ID -> read status
  readAt: Map<string, Date>; // recipient ID -> read timestamp
  relatedModel?:
    | "Appointment"
    | "Patient"
    | "Medication"
    | "Invoice"
    | "MedicalRecord";
  relatedId?: mongoose.Types.ObjectId;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
  replies?: mongoose.Types.ObjectId[]; // References to reply messages
  parentMessage?: mongoose.Types.ObjectId; // If this is a reply
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipients: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal",
    },
    isRead: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    readAt: {
      type: Map,
      of: Date,
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
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String,
      },
    ],
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    parentMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
messageSchema.index({ clinic: 1, recipients: 1, createdAt: -1 });
messageSchema.index({ clinic: 1, sender: 1, createdAt: -1 });

// Instance methods
messageSchema.methods.markAsReadByUser = async function (userId: string) {
  this.isRead.set(userId, true);
  if (!this.readAt) {
    this.readAt = new Map();
  }
  this.readAt.set(userId, new Date());
  return this.save();
};

// Static methods
messageSchema.statics.getUnreadCountForUser = async function (
  userId: string,
  clinicId?: string
) {
  const query: any = {
    recipients: userId,
  };
  if (clinicId) {
    query.clinic = clinicId;
  }

  const messages = await this.find(query);
  return messages.filter((msg: any) => !msg.isRead.get(userId)).length;
};

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

export default Message;
