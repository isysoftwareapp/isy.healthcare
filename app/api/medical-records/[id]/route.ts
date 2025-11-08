import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * GET /api/medical-records/[id]
 * Get a specific medical record by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const record = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId email phone")
      .populate("clinic", "name")
      .populate("appointment", "appointmentId appointmentDate")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "Medical record not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    console.error("Error fetching medical record:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch medical record",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/medical-records/[id]
 * Update a specific medical record
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();

    // If prescriptions are being updated, check for drug-allergy interactions
    if (body.prescriptions && body.prescriptions.length > 0) {
      const currentRecord = await MedicalRecord.findById(id);
      if (!currentRecord) {
        return NextResponse.json(
          {
            success: false,
            error: "Medical record not found",
          },
          { status: 404 }
        );
      }

      // Get patient's allergies from all records
      const patientRecords = await MedicalRecord.find({
        patient: currentRecord.patient,
      }).select("allergies");

      const allAllergies = patientRecords.flatMap((record) => record.allergies);
      const drugAllergies = allAllergies.filter(
        (allergy) => allergy.category === "medication"
      );

      // Check each prescription against drug allergies
      const interactions = [];
      for (const prescription of body.prescriptions) {
        for (const allergy of drugAllergies) {
          if (
            allergy.allergen
              .toLowerCase()
              .includes(prescription.medicationName.toLowerCase()) ||
            prescription.medicationName
              .toLowerCase()
              .includes(allergy.allergen.toLowerCase())
          ) {
            interactions.push({
              medication: prescription.medicationName,
              allergen: allergy.allergen,
              severity: allergy.severity,
              reaction: allergy.reaction,
            });
          }
        }
      }

      if (interactions.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Drug-allergy interaction detected",
            interactions,
          },
          { status: 409 }
        );
      }
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("updatedBy", "firstName lastName");

    if (!updatedRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Medical record not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Medical record updated successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error updating medical record:", error);

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
        error: "Failed to update medical record",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/medical-records/[id]
 * Delete a specific medical record
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const deletedRecord = await MedicalRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Medical record not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Medical record deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting medical record:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete medical record",
      },
      { status: 500 }
    );
  }
}
