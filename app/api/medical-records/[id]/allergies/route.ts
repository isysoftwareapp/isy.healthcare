import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * POST /api/medical-records/[id]/allergies
 * Add or update an allergy in a medical record
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

    // Check if allergy already exists
    const existingAllergyIndex = record.allergies.findIndex(
      (allergy) =>
        allergy.allergen.toLowerCase() === body.allergen.toLowerCase() &&
        allergy.category === body.category
    );

    if (existingAllergyIndex !== -1) {
      // Update existing allergy
      record.allergies[existingAllergyIndex] = {
        ...record.allergies[existingAllergyIndex],
        ...body,
      };
    } else {
      // Add new allergy
      record.allergies.push(body);
    }

    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name");

    return NextResponse.json({
      success: true,
      message:
        existingAllergyIndex !== -1
          ? "Allergy updated successfully"
          : "Allergy added successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error managing allergy:", error);

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
        error: "Failed to manage allergy",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/medical-records/[id]/allergies
 * Remove an allergy from a medical record
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const allergen = searchParams.get("allergen");

    if (!allergen) {
      return NextResponse.json(
        {
          success: false,
          error: "Allergen name is required",
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

    // Remove allergy
    record.allergies = record.allergies.filter(
      (allergy) => allergy.allergen.toLowerCase() !== allergen.toLowerCase()
    );

    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name");

    return NextResponse.json({
      success: true,
      message: "Allergy removed successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error removing allergy:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove allergy",
      },
      { status: 500 }
    );
  }
}
