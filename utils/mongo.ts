import mongoose from "mongoose";

export async function connectToDatabase(): Promise<void> {
  const db = String(process.env.MONGODB_URI);
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(db);
}
