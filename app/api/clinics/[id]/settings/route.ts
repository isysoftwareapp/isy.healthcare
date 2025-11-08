import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Clinic from "@/models/Clinic";
import { getServerSession } from "next-auth";

// GET /api/clinics/[id]/settings - Get clinic settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const clinic = await Clinic.findById(id)
      .select("operationalSettings financialSettings templates")
      .lean();

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        operationalSettings: clinic.operationalSettings,
        financialSettings: clinic.financialSettings,
        templates: clinic.templates,
      },
    });
  } catch (error: any) {
    console.error("Error fetching clinic settings:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/clinics/[id]/settings - Update clinic settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if clinic exists
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Build update object
    const update: any = {};

    if (body.operationalSettings) {
      update.operationalSettings = body.operationalSettings;
    }

    if (body.financialSettings) {
      update.financialSettings = body.financialSettings;
    }

    if (body.templates) {
      update.templates = body.templates;
    }

    // Update clinic
    const updatedClinic = await Clinic.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("operationalSettings financialSettings templates");

    return NextResponse.json({
      success: true,
      data: updatedClinic,
      message: "Clinic settings updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating clinic settings:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
