import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  _id: string;
  session: any;
  expires: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    _id: { type: String, required: true },
    session: { type: Schema.Types.Mixed, required: true },
    expires: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: false }
);

export const Session = mongoose.model<ISession>('Session', SessionSchema);
