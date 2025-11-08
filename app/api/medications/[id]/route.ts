import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medication from "@/models/Medication";
import { getServerSession } from "next-auth";

// GET /api/medications/[id] - Get a specific medication
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
    const medication = await Medication.findById(id)
      .populate("clinic", "name clinicId")
      .populate("createdBy", "firstName lastName")
      .populate("lastUpdatedBy", "firstName lastName")
      .lean();

    if (!medication) {
      return NextResponse.json(
        { success: false, error: "Medication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: medication,
    });
  } catch (error: any) {
    console.error("Error fetching medication:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/medications/[id] - Update a medication
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

    // Check if medication exists
    const medication = await Medication.findById(id);
    if (!medication) {
      return NextResponse.json(
        { success: false, error: "Medication not found" },
        { status: 404 }
      );
    }

    // Update medication
    body.lastUpdatedBy = session.user?.id;

    const updatedMedication = await Medication.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedMedication,
      message: "Medication updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating medication:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/medications/[id] - Delete (deactivate) a medication
export async function DELETE(
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

    // Soft delete - mark as inactive instead of actually deleting
    const medication = await Medication.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
          lastUpdatedBy: session.user?.id,
        },
      },
      { new: true }
    );

    if (!medication) {
      return NextResponse.json(
        { success: false, error: "Medication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Medication deactivated successfully",
    });
  } catch (error: any) {
    console.error("Error deleting medication:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
