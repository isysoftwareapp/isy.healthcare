import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medication from "@/models/Medication";
import { getServerSession } from "next-auth";

// POST /api/medications/[id]/batch - Add a new batch to medication
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

    const { batchNumber, quantity, expiryDate, supplier, cost } = body;

    if (!batchNumber || !quantity || !expiryDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch number, quantity, and expiry date are required",
        },
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

    // Check if batch number already exists
    const batchExists = medication.batches.some(
      (b: any) => b.batchNumber === batchNumber
    );
    if (batchExists) {
      return NextResponse.json(
        { success: false, error: "Batch number already exists" },
        { status: 400 }
      );
    }

    // Add batch using the instance method
    await medication.addBatch({
      batchNumber,
      quantity: Number(quantity),
      expiryDate: new Date(expiryDate),
      supplier,
      cost: cost ? Number(cost) : undefined,
    });

    // Also record this as a stock adjustment
    await medication.adjustStock({
      adjustmentType: "received",
      quantity: Number(quantity),
      batchNumber,
      reason: "New batch received",
      performedBy: session.user?.id,
      notes: supplier ? `Supplier: ${supplier}` : undefined,
    });

    return NextResponse.json({
      success: true,
      data: medication,
      message: "Batch added successfully",
    });
  } catch (error: any) {
    console.error("Error adding batch:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/medications/[id]/batch - Get all batches for a medication
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
    const medication = (await Medication.findById(id)
      .select("batches name")
      .lean()) as any;

    if (!medication) {
      return NextResponse.json(
        { success: false, error: "Medication not found" },
        { status: 404 }
      );
    }

    // Sort batches by expiry date
    const sortedBatches = [...(medication.batches || [])].sort(
      (a: any, b: any) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        medicationName: medication.name,
        batches: sortedBatches,
      },
    });
  } catch (error: any) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
