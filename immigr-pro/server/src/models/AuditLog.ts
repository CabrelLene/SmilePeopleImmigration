// server/src/models/AuditLog.ts
import mongoose, { Schema, Document } from "mongoose";

interface IAuditLog extends Document {
  at: Date;
  action: string;
  targetType?: string;
  targetId?: string;
  who?: { id?: string; email?: string };
  meta?: any;
}

const AuditLogSchema = new Schema<IAuditLog>({
  at: { type: Date, default: () => new Date() },
  action: { type: String, required: true, index: true },
  targetType: { type: String, index: true },
  targetId: { type: String, index: true },
  who: {
    id: String,
    email: String,
  },
  meta: Schema.Types.Mixed,
});

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
