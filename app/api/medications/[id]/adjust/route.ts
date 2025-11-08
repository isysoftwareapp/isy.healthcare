import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medication from "@/models/Medication";
import { getServerSession } from "next-auth";

// POST /api/medications/[id]/adjust - Adjust medication stock
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
    const body = await request.json();

    const { adjustmentType, quantity, batchNumber, reason, notes } = body;

    if (!adjustmentType || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "Adjustment type and quantity are required" },
        { status: 400 }
      );
    }

    // Get medication
    const medication = await Medication.findById(id);
    if (!medication) {
      return NextResponse.json(
        { success: false, error: "Medication not found" },
        { status: 404 }
      );
    }

    // Adjust stock using the instance method
    await medication.adjustStock({
      adjustmentType,
      quantity,
      batchNumber,
      reason,
      performedBy: session.user?.id,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: medication,
      message: "Stock adjusted successfully",
    });
  } catch (error: any) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
