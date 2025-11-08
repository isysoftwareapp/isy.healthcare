import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medication from "@/models/Medication";
import { getServerSession } from "next-auth";

// GET /api/medications - List all medications (with filtering)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get("clinic");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock");
    const expiringSoon = searchParams.get("expiringSoon");
    const isActive = searchParams.get("isActive");

    // Build filter
    const filter: any = {};

    if (clinicId) {
      filter.clinic = clinicId;
    }

    if (category) {
      filter.category = category;
    }

    if (lowStock === "true") {
      filter.hasLowStock = true;
    }

    if (expiringSoon === "true") {
      filter.hasExpiringSoon = true;
    }

    if (isActive !== null) {
      filter.isActive = isActive === "true";
    } else {
      filter.isActive = true; // Default to active only
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { genericName: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const medications = await Medication.find(filter)
      .populate("clinic", "name clinicId")
      .sort({ name: 1 })
      .lean();

    // Calculate summary statistics
    const summary = {
      total: medications.length,
      lowStock: medications.filter((m: any) => m.hasLowStock).length,
      expiringSoon: medications.filter((m: any) => m.hasExpiringSoon).length,
      expired: medications.filter((m: any) => m.hasExpired).length,
      totalValue: medications.reduce(
        (sum: number, m: any) => sum + m.currentStock * (m.costPrice || 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: medications,
      summary,
      count: medications.length,
    });
  } catch (error: any) {
    console.error("Error fetching medications:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/medications - Create a new medication
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const { clinic, name, category, form, strength, unit, sellingPrice } = body;
    if (
      !clinic ||
      !name ||
      !category ||
      !form ||
      !strength ||
      !unit ||
      sellingPrice === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create medication
    const medication = await Medication.create({
      ...body,
      createdBy: session.user?.id,
      lastUpdatedBy: session.user?.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: medication,
        message: "Medication created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating medication:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
