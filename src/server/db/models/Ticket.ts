import mongoose, { type Document, Schema } from "mongoose";

export interface ITicketMessage {
  senderId: mongoose.Types.ObjectId;
  senderRole: "user" | "admin";
  content: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketNumber: number;
  userId: mongoose.Types.ObjectId;
  title: string;
  category: "account" | "payment" | "gameplay" | "bug" | "other";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  messages: ITicketMessage[];
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: Number, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["account", "payment", "gameplay", "bug", "other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    messages: [TicketMessageSchema],
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

TicketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketNumber = count + 1;
  }
  next();
});

export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
