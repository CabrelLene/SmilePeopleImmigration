import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface AppFile {
  id?: string;
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface ApplicationDoc extends Document {
  user: Types.ObjectId;
  status: "draft" | "submitted" | "review" | "waiting-info" | "in-progress" | "done";
  programSuggestion?: string;
  budgetEstimate?: number;
  score?: number;
  answers?: Record<string, any>;
  files?: AppFile[];
  counselor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<AppFile>(
  {
    id: String,
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: Number,
    mimeType: String,
  },
  { _id: false }
);

const ApplicationSchema = new Schema<ApplicationDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "review", "waiting-info", "in-progress", "done"],
      default: "draft",
      index: true,
    },
    programSuggestion: { type: String },
    budgetEstimate: { type: Number },
    score: { type: Number },
    answers: { type: Schema.Types.Mixed },
    files: [FileSchema],
    counselor: { type: String },
  },
  { timestamps: true }
);

const Application: Model<ApplicationDoc> =
  (mongoose.models.Application as Model<ApplicationDoc>) ||
  mongoose.model<ApplicationDoc>("Application", ApplicationSchema);

export default Application;
