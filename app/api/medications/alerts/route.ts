import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medication from "@/models/Medication";
import { getServerSession } from "next-auth";

// GET /api/medications/alerts - Get medications with alerts (low stock, expiring, expired)
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

    // Get low stock medications
    const lowStockMeds = await Medication.find({
      clinic: clinicId,
      isActive: true,
      hasLowStock: true,
    })
      .select("name currentStock reorderLevel form strength")
      .sort({ currentStock: 1 })
      .lean();

    // Get expiring soon medications
    const expiringSoonMeds = await Medication.find({
      clinic: clinicId,
      isActive: true,
      hasExpiringSoon: true,
    })
      .select("name batches form strength")
      .sort({ "batches.expiryDate": 1 })
      .lean();

    // Get expired medications
    const expiredMeds = await Medication.find({
      clinic: clinicId,
      isActive: true,
      hasExpired: true,
    })
      .select("name batches form strength")
      .lean();

    // Extract expiring batches with details
    const expiringBatches = expiringSoonMeds.flatMap((med: any) => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      return med.batches
        .filter(
          (batch: any) =>
            new Date(batch.expiryDate) <= thirtyDaysFromNow &&
            new Date(batch.expiryDate) > new Date()
        )
        .map((batch: any) => ({
          medicationId: med._id,
          medicationName: med.name,
          form: med.form,
          strength: med.strength,
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          daysUntilExpiry: Math.ceil(
            (new Date(batch.expiryDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }));
    });

    // Extract expired batches with details
    const expiredBatches = expiredMeds.flatMap((med: any) => {
      return med.batches
        .filter((batch: any) => new Date(batch.expiryDate) <= new Date())
        .map((batch: any) => ({
          medicationId: med._id,
          medicationName: med.name,
          form: med.form,
          strength: med.strength,
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
        }));
    });

    return NextResponse.json({
      success: true,
      data: {
        lowStock: lowStockMeds,
        expiringSoon: expiringBatches,
        expired: expiredBatches,
      },
      summary: {
        lowStockCount: lowStockMeds.length,
        expiringSoonCount: expiringBatches.length,
        expiredCount: expiredBatches.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching medication alerts:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
