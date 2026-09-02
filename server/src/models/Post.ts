import { Schema, model, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  author: string; // User ID or username
  createdAt: Date;
}

const postSchema = new Schema<IPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<IPost>("Post", postSchema);