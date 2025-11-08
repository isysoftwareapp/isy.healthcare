import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Clinic from "@/models/Clinic";
import User from "@/models/User";
import Patient from "@/models/Patient";
import { getServerSession } from "next-auth";

// GET /api/clinics - List all clinics (with optional filtering)
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
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    // Build filter
    const filter: any = {};

    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { clinicId: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const clinics = await Clinic.find(filter).sort({ name: 1 }).lean();

    // Get stats for each clinic
    const clinicsWithStats = await Promise.all(
      clinics.map(async (clinic) => {
        const [staffCount, patientCount] = await Promise.all([
          User.countDocuments({ clinics: clinic._id }),
          Patient.countDocuments({ clinic: clinic._id }),
        ]);

        return {
          ...clinic,
          stats: {
            staff: staffCount,
            patients: patientCount,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: clinicsWithStats,
      count: clinicsWithStats.length,
    });
  } catch (error: any) {
    console.error("Error fetching clinics:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clinics - Create a new clinic
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
    const { name, clinicId, code, contactInfo, address } = body;
    if (!name || !clinicId || !code || !contactInfo || !address) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if clinicId already exists
    const existingClinic = await Clinic.findOne({ clinicId });
    if (existingClinic) {
      return NextResponse.json(
        { success: false, error: "Clinic ID already exists" },
        { status: 400 }
      );
    }

    // Create clinic with default settings
    const clinic = await Clinic.create({
      name,
      clinicId,
      code,
      contactInfo,
      address,
      isActive: body.isActive !== undefined ? body.isActive : true,
      operationalSettings: body.operationalSettings || {
        operatingHours: {
          monday: { isOpen: true, open: "09:00", close: "17:00" },
          tuesday: { isOpen: true, open: "09:00", close: "17:00" },
          wednesday: { isOpen: true, open: "09:00", close: "17:00" },
          thursday: { isOpen: true, open: "09:00", close: "17:00" },
          friday: { isOpen: true, open: "09:00", close: "17:00" },
          saturday: { isOpen: false },
          sunday: { isOpen: false },
        },
        appointmentSlotDuration: 30,
        autoLogoutDuration: 15,
        defaultLanguage: "en",
      },
      financialSettings: body.financialSettings || {
        primaryCurrency: "USD",
        acceptedCurrencies: ["USD"],
        exchangeRates: new Map(),
        invoicePrefix: `${code}-INV-`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: clinic,
        message: "Clinic created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating clinic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
