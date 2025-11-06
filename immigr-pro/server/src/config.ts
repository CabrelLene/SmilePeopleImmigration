import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/immigrpro",
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret_change_me",
  PORT: Number(process.env.PORT || 5000),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads"
};
