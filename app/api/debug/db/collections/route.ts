import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";

function convertBson(val: any): any {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(convertBson);
  if (typeof val === "object") {
    // handle ObjectId and Date
    if (val._bsontype === "ObjectID" && typeof val.toString === "function") {
      return val.toString();
    }
    if (val instanceof Date) return val.toISOString();
    const out: any = {};
    for (const k of Object.keys(val)) {
      try {
        out[k] = convertBson(val[k]);
      } catch (e) {
        out[k] = String(val[k]);
      }
    }
    return out;
  }
  return val;
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session?.user || !["Admin", "Director"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const mongoose = await import("mongoose");
    const conn = (mongoose as any).connection;
    const db = conn?.db;
    if (!db) {
      console.error("MongoDB connection not available");
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }
    const url = new URL(req.url);
    const allParam = url.searchParams.get("all");
    const returnAll = allParam === "1" || allParam === "true";
    const collections = await db.listCollections().toArray();

    const results: any[] = [];
    for (const col of collections) {
      const name = col.name as string;
      const collection = db.collection(name);
      const count = await collection.countDocuments();
      let samples: any[] = [];
      if (returnAll) {
        samples = await collection.find({}).toArray();
      } else {
        samples = await collection.find({}).limit(10).toArray();
      }
      const converted = samples.map((s: any) => convertBson(s));
      results.push({ name, count, samples: converted });
    }

    return NextResponse.json(
      { success: true, collections: results },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching DB collections:", err);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}
