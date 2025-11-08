import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Clinic from "@/models/Clinic";
import User from "@/models/User";
import Patient from "@/models/Patient";
import { getServerSession } from "next-auth";

// GET /api/clinics/[id] - Get a specific clinic
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
    const clinic = await Clinic.findById(id).lean();

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Get detailed stats
    const [staffCount, patientCount, staff] = await Promise.all([
      User.countDocuments({ clinics: id }),
      Patient.countDocuments({ clinic: id }),
      User.find({ clinics: id }).select("firstName lastName email role").lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...clinic,
        stats: {
          staff: staffCount,
          patients: patientCount,
        },
        staffList: staff,
      },
    });
  } catch (error: any) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/clinics/[id] - Update a clinic
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

    // If updating clinicId, check for duplicates
    if (body.clinicId && body.clinicId !== clinic.clinicId) {
      const existingClinic = await Clinic.findOne({ clinicId: body.clinicId });
      if (existingClinic) {
        return NextResponse.json(
          { success: false, error: "Clinic ID already exists" },
          { status: 400 }
        );
      }
    }

    // Update clinic
    const updatedClinic = await Clinic.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedClinic,
      message: "Clinic updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating clinic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/clinics/[id] - Delete a clinic
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

    // Check if clinic has associated data
    const [staffCount, patientCount] = await Promise.all([
      User.countDocuments({ clinics: id }),
      Patient.countDocuments({ clinic: id }),
    ]);

    if (staffCount > 0 || patientCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete clinic with associated staff or patients. Please reassign them first.",
        },
        { status: 400 }
      );
    }

    await Clinic.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Clinic deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting clinic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
