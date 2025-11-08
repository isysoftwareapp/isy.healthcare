import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * GET /api/medical-records
 * Get medical records with filtering and pagination
 */
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const patientId = searchParams.get("patientId");
    const clinicId = searchParams.get("clinicId");
    const appointmentId = searchParams.get("appointmentId");

    const filter: any = {};

    if (patientId) filter.patient = patientId;
    if (clinicId) filter.clinic = clinicId;
    if (appointmentId) filter.appointment = appointmentId;

    const total = await MedicalRecord.countDocuments(filter);
    const records = await MedicalRecord.find(filter)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("appointment", "appointmentId appointmentDate")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching medical records:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch medical records",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/medical-records
 * Create a new medical record
 */
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    // Drug-allergy interaction check for prescriptions
    if (body.prescriptions && body.prescriptions.length > 0) {
      // Get patient's allergies
      const existingRecords = await MedicalRecord.find({
        patient: body.patient,
      }).select("allergies");

      const allAllergies = existingRecords.flatMap(
        (record) => record.allergies
      );
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

    const medicalRecord = await MedicalRecord.create(body);

    const populatedRecord = await MedicalRecord.findById(medicalRecord._id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("createdBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Medical record created successfully",
      data: populatedRecord,
    });
  } catch (error: any) {
    console.error("Error creating medical record:", error);

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
        error: "Failed to create medical record",
      },
      { status: 500 }
    );
  }
}
