import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 4000),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/immigrpro',
  JWT_SECRET: process.env.JWT_SECRET || 'change_me',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB || 10),
} as const;
