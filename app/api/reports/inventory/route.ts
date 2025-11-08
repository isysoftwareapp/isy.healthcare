import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medication from "@/models/Medication";
import { getServerSession } from "next-auth";

// GET /api/reports/inventory - Generate inventory reports
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

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    // Get all active medications
    const medications = await Medication.find({
      clinic: clinicId,
      isActive: true,
    }).lean();

    // Total medications
    const totalMedications = medications.length;

    // Calculate total inventory value
    const totalInventoryValue = medications.reduce(
      (sum, med: any) => sum + med.currentStock * (med.costPrice || 0),
      0
    );

    const totalSellingValue = medications.reduce(
      (sum, med: any) => sum + med.currentStock * med.sellingPrice,
      0
    );

    // Count by category
    const categoryDistribution: Record<string, number> = {};
    medications.forEach((med: any) => {
      categoryDistribution[med.category] =
        (categoryDistribution[med.category] || 0) + 1;
    });

    // Count by form
    const formDistribution: Record<string, number> = {};
    medications.forEach((med: any) => {
      formDistribution[med.form] = (formDistribution[med.form] || 0) + 1;
    });

    // Alert counts
    const lowStockCount = medications.filter((m: any) => m.hasLowStock).length;
    const expiringSoonCount = medications.filter(
      (m: any) => m.hasExpiringSoon
    ).length;
    const expiredCount = medications.filter((m: any) => m.hasExpired).length;

    // Stock level categories
    const stockLevels = {
      outOfStock: medications.filter((m: any) => m.currentStock === 0).length,
      lowStock: medications.filter(
        (m: any) => m.currentStock > 0 && m.hasLowStock
      ).length,
      adequate: medications.filter((m: any) => m.currentStock > m.reorderLevel)
        .length,
    };

    // Top 10 medications by value
    const topByValue = medications
      .map((med: any) => ({
        name: med.name,
        form: med.form,
        strength: med.strength,
        currentStock: med.currentStock,
        value: med.currentStock * (med.costPrice || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Top 10 low stock medications
    const topLowStock = medications
      .filter((m: any) => m.hasLowStock)
      .map((med: any) => ({
        name: med.name,
        form: med.form,
        strength: med.strength,
        currentStock: med.currentStock,
        reorderLevel: med.reorderLevel,
        shortfall: med.reorderLevel - med.currentStock,
      }))
      .sort((a, b) => b.shortfall - a.shortfall)
      .slice(0, 10);

    // Medications requiring prescription
    const prescriptionRequired = medications.filter(
      (m: any) => m.requiresPrescription
    ).length;
    const controlledSubstances = medications.filter(
      (m: any) => m.isControlled
    ).length;

    // Storage requirements
    const refrigerationRequired = medications.filter(
      (m: any) => m.requiresRefrigeration
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalMedications,
          totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
          totalSellingValue: Math.round(totalSellingValue * 100) / 100,
          potentialProfit:
            Math.round((totalSellingValue - totalInventoryValue) * 100) / 100,
          lowStockCount,
          expiringSoonCount,
          expiredCount,
        },
        categoryDistribution,
        formDistribution,
        stockLevels,
        topByValue,
        topLowStock,
        compliance: {
          prescriptionRequired,
          controlledSubstances,
          refrigerationRequired,
        },
      },
    });
  } catch (error: any) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
