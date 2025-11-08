import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * POST /api/medical-records/[id]/diagnoses
 * Add a diagnosis to a medical record
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

    // Add diagnosis to the record
    record.diagnoses.push(body);
    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name");

    return NextResponse.json({
      success: true,
      message: "Diagnosis added successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error adding diagnosis:", error);

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
        error: "Failed to add diagnosis",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/medical-records/[id]/diagnoses
 * Update diagnosis status (active/resolved/ruled-out)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();
    const { diagnosisId, status } = body;

    if (!diagnosisId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Diagnosis ID and status are required",
        },
        { status: 400 }
      );
    }

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

    // Find and update diagnosis
    const diagnosisIndex = record.diagnoses.findIndex(
      (d: any) => d._id.toString() === diagnosisId
    );

    if (diagnosisIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Diagnosis not found",
        },
        { status: 404 }
      );
    }

    record.diagnoses[diagnosisIndex].status = status;
    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name");

    return NextResponse.json({
      success: true,
      message: "Diagnosis updated successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error updating diagnosis:", error);

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
        error: "Failed to update diagnosis",
      },
      { status: 500 }
    );
  }
}
