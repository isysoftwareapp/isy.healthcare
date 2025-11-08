import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * POST /api/medical-records/[id]/vitals
 * Add vitals to a medical record
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "Medical record not found",
        },
        { status: 404 }
      );
    }

    // Add vitals to the record
    record.vitals.push(body);
    await record.save(); // This will trigger BMI auto-calculation

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name");

    return NextResponse.json({
      success: true,
      message: "Vitals added successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error adding vitals:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add vitals",
      },
      { status: 500 }
    );
  }
}
