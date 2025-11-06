import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  fullName: { type: String, required: true },
  role: { type: String, enum: ["user","admin"], default: "user" },
  phone: String,
  verified: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password as string, 10);
  next();
});

userSchema.methods.compare = function (plain: string) {
  // @ts-ignore
  return bcrypt.compare(plain, this.password);
};

export default model("User", userSchema);
