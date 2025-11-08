import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

/**
 * POST /api/medical-records/[id]/documents
 * Add a medical document to a medical record
 * Note: This route handles metadata only. File upload should be handled by a separate upload service.
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

    // Add document metadata to the record
    // In production, this should be called after successful file upload
    record.documents.push(body);
    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("documents.uploadedBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Document added successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error adding document:", error);

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
        error: "Failed to add document",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/medical-records/[id]/documents
 * Remove a document from a medical record
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Document ID is required",
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

    // Remove document
    const initialLength = record.documents.length;
    record.documents = record.documents.filter(
      (doc: any) => doc._id.toString() !== documentId
    );

    if (record.documents.length === initialLength) {
      return NextResponse.json(
        {
          success: false,
          error: "Document not found",
        },
        { status: 404 }
      );
    }

    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name");

    return NextResponse.json({
      success: true,
      message: "Document removed successfully",
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error removing document:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove document",
      },
      { status: 500 }
    );
  }
}
