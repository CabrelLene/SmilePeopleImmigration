import { Schema, model, Document, Types } from 'mongoose';

export interface IDocument extends Document {
  userId: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

const DocSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);

export const DocumentModel = model<IDocument>('Document', DocSchema);
