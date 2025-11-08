import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";
import { getServerSession } from "next-auth";

// GET /api/reports/patients - Generate patient statistics
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    // Build filter
    const filter: any = { clinic: clinicId };
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get all patients
    const patients = await Patient.find({ clinic: clinicId }).lean();
    const newPatients =
      startDate && endDate ? await Patient.find(filter).lean() : [];

    // Total and active patients
    const totalPatients = patients.length;
    const activePatients = patients.filter(
      (p: any) => p.status === "active"
    ).length;
    const inactivePatients = patients.filter(
      (p: any) => p.status === "inactive"
    ).length;

    // Gender distribution
    const genderDistribution = {
      male: patients.filter((p: any) => p.gender === "male").length,
      female: patients.filter((p: any) => p.gender === "female").length,
      other: patients.filter((p: any) => p.gender === "other").length,
    };

    // Age groups (0-17, 18-35, 36-50, 51-65, 66+)
    const ageGroups = {
      "0-17": 0,
      "18-35": 0,
      "36-50": 0,
      "51-65": 0,
      "66+": 0,
    };

    patients.forEach((patient: any) => {
      if (patient.dateOfBirth) {
        const age = Math.floor(
          (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        if (age < 18) ageGroups["0-17"]++;
        else if (age < 36) ageGroups["18-35"]++;
        else if (age < 51) ageGroups["36-50"]++;
        else if (age < 66) ageGroups["51-65"]++;
        else ageGroups["66+"]++;
      }
    });

    // Insurance status
    const insuranceStatus = {
      hasInsurance: patients.filter((p: any) => p.insurance?.provider).length,
      noInsurance: patients.filter((p: any) => !p.insurance?.provider).length,
    };

    // New patient registrations by month (last 12 months)
    const last12Months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      last12Months[key] = 0;
    }

    patients.forEach((patient: any) => {
      if (patient.createdAt) {
        const date = new Date(patient.createdAt);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        if (last12Months.hasOwnProperty(key)) {
          last12Months[key]++;
        }
      }
    });

    const registrationTrend = Object.entries(last12Months).map(
      ([month, count]) => ({
        month,
        count,
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPatients,
          activePatients,
          inactivePatients,
          newPatients: newPatients.length,
        },
        genderDistribution,
        ageGroups,
        insuranceStatus,
        registrationTrend,
      },
    });
  } catch (error: any) {
    console.error("Error generating patient report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
