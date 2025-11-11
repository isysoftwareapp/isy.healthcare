import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Only Admin and Director can migrate services
    if (!["Admin", "Director"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin or Director role required" },
        { status: 403 }
      );
    }

    const { clinicId } = await request.json();

    if (!clinicId) {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update all services to the selected clinic
    const result = await Service.updateMany(
      {},
      {
        $set: {
          assignedClinic: new mongoose.Types.ObjectId(clinicId),
        },
      }
    );

    return NextResponse.json({
      success: true,
      count: result.modifiedCount,
      message: `Successfully migrated ${result.modifiedCount} services`,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to migrate services" },
      { status: 500 }
    );
  }
}
