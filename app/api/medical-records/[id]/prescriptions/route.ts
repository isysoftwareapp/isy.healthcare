import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * POST /api/medical-records/[id]/prescriptions
 * Add a prescription to a medical record with drug-allergy interaction check
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

    // Get patient's drug allergies from all medical records
    const patientRecords = await MedicalRecord.find({
      patient: record.patient,
    }).select("allergies");

    const allAllergies = patientRecords.flatMap((r) => r.allergies);
    const drugAllergies = allAllergies.filter(
      (allergy) => allergy.category === "medication"
    );

    // Check for drug-allergy interactions
    const interactions = [];
    for (const allergy of drugAllergies) {
      if (
        allergy.allergen
          .toLowerCase()
          .includes(body.medicationName.toLowerCase()) ||
        body.medicationName
          .toLowerCase()
          .includes(allergy.allergen.toLowerCase())
      ) {
        interactions.push({
          medication: body.medicationName,
          allergen: allergy.allergen,
          severity: allergy.severity,
          reaction: allergy.reaction,
        });
      }
    }

    if (interactions.length > 0) {
      // Return interaction warning (client should confirm before override)
      return NextResponse.json(
        {
          success: false,
          error: "Drug-allergy interaction detected",
          interactions,
          warning:
            "Patient has known allergies to this medication. Override requires confirmation.",
        },
        { status: 409 }
      );
    }

    // Add prescription to the record
    record.prescriptions.push(body);
    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("prescriptions.prescribedBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Prescription added successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error adding prescription:", error);

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
        error: "Failed to add prescription",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/medical-records/[id]/prescriptions
 * Update prescription status (active/completed/discontinued/on-hold)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();
    const { prescriptionId, status, discontinuationReason } = body;

    if (!prescriptionId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Prescription ID and status are required",
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

    // Find and update prescription
    const prescriptionIndex = record.prescriptions.findIndex(
      (p: any) => p._id.toString() === prescriptionId
    );

    if (prescriptionIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Prescription not found",
        },
        { status: 404 }
      );
    }

    record.prescriptions[prescriptionIndex].status = status;
    if (status === "discontinued" && discontinuationReason) {
      record.prescriptions[prescriptionIndex].discontinuedReason =
        discontinuationReason;
      record.prescriptions[prescriptionIndex].discontinuedAt = new Date();
    }

    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("prescriptions.prescribedBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Prescription updated successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error updating prescription:", error);

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
        error: "Failed to update prescription",
      },
      { status: 500 }
    );
  }
}
