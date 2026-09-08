// models/Post.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  upvotes: Types.ObjectId[]; // Array of User IDs who upvoted
  upvoteCount: number;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Post = model<IPost>('Post', PostSchema);