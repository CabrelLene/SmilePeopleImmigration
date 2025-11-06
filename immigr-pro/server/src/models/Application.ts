import { Schema, model, Types } from "mongoose";

const stepSchema = new Schema({
  key: String,
  data: Schema.Types.Mixed
}, { _id: false });

const applicationSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["draft","submitted","review","waiting-info","in-progress","done"], default: "draft" },
  programSuggestion: { type: String }, // e.g., "Entrée Express - Travailleur qualifié"
  scoreBreakdown: Schema.Types.Mixed,
  budgetEstimate: Number,
  answers: [stepSchema]
}, { timestamps: true });

export default model("Application", applicationSchema);
