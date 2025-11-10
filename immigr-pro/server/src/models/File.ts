import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

export interface IFile extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

const FileSchema = new Schema<IFile>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: Number,
    mimeType: String,
  },
  { timestamps: true }
);

const File = models.File || model<IFile>("File", FileSchema);
export default File;
