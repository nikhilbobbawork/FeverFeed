import { Schema, model, Document } from "mongoose";

export interface IContact extends Document {
  subject: string;
  question: string;
  createdAt: Date;
}

const contactSchema = new Schema<IContact>({
  subject: { type: String, required: true },
  question: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<IContact>("Contact", contactSchema);