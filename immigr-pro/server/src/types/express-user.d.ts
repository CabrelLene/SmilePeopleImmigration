// server/src/types/express-user.d.ts
import type { Types } from "mongoose";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      _id: string | Types.ObjectId;
      email?: string;
      fullName?: string;
      role?: "user" | "admin";
    };
  }
}
