import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Clinic from "@/models/Clinic";
import User from "@/models/User";
import { getServerSession } from "next-auth";

// GET /api/clinics/[id]/staff - Get all staff assigned to a clinic
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

    // Check if clinic exists
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Get all staff assigned to this clinic
    const staff = await User.find({ clinics: id })
      .select("firstName lastName email role phone isActive clinics")
      .lean();

    // Group by role
    const staffByRole = staff.reduce((acc: any, member: any) => {
      if (!acc[member.role]) {
        acc[member.role] = [];
      }
      acc[member.role].push(member);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        staff,
        staffByRole,
        count: staff.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching clinic staff:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clinics/[id]/staff - Assign a user to a clinic
export async function POST(
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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already assigned
    if (user.clinics.includes(id)) {
      return NextResponse.json(
        { success: false, error: "User is already assigned to this clinic" },
        { status: 400 }
      );
    }

    // Assign user to clinic
    user.clinics.push(id);
    await user.save();

    return NextResponse.json({
      success: true,
      data: user,
      message: "User assigned to clinic successfully",
    });
  } catch (error: any) {
    console.error("Error assigning staff to clinic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/clinics/[id]/staff - Remove a user from a clinic
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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Remove user from clinic
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { clinics: id } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "User removed from clinic successfully",
    });
  } catch (error: any) {
    console.error("Error removing staff from clinic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
