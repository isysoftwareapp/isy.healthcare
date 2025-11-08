import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * POST /api/medical-records/[id]/soap-notes
 * Add a SOAP note to a medical record
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

    // Add SOAP note to the record
    record.soapNotes.push(body);
    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("soapNotes.recordedBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "SOAP note added successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error adding SOAP note:", error);

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
        error: "Failed to add SOAP note",
      },
      { status: 500 }
    );
  }
}
