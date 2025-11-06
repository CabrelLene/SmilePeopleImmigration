import { Schema, model, Types } from "mongoose";

const docSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  application: { type: Types.ObjectId, ref: "Application" },
  originalName: String,
  mimeType: String,
  size: Number,
  url: String // served from /files/<name>
}, { timestamps: true });

export default model("Document", docSchema);
