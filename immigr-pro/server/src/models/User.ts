import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

export interface IUser extends mongoose.Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role?: "user" | "admin";
  photoUrl?: string;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    photoUrl: { type: String },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;
