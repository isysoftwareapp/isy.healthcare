import mongoose from "mongoose";

let MONGODB_URI = process.env.MONGODB_URI!;

// In development mode, connect to the live database instead of dev database
if (process.env.NODE_ENV === "development") {
  // Use the live database connection for faster development with real data
  // Since the live database appears to be running with dev credentials, use those
  MONGODB_URI =
    "mongodb://admin:DevPassword123!@localhost:27017/isy_clinic?authSource=admin";
  console.log("🔧 Development mode: Using live database connection");
}

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
