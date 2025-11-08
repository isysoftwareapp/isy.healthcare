import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import Appointment from "@/models/Appointment";
import Patient from "@/models/Patient";
import { getServerSession } from "next-auth";

// GET /api/reports/financial - Generate financial reports
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
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    if (!clinicId || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Clinic ID, start date, and end date are required",
        },
        { status: 400 }
      );
    }

    // Build date filter
    const dateFilter: any = {
      clinic: clinicId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Get all invoices in date range
    const invoices = await Invoice.find(dateFilter).lean();

    // Calculate totals
    const totalRevenue = invoices.reduce(
      (sum, inv: any) => sum + inv.totalAmount,
      0
    );
    const totalPaid = invoices.reduce(
      (sum, inv: any) => sum + inv.paidAmount,
      0
    );
    const totalOutstanding = totalRevenue - totalPaid;

    // Count by status
    const statusCounts = {
      draft: invoices.filter((inv: any) => inv.status === "draft").length,
      issued: invoices.filter((inv: any) => inv.status === "issued").length,
      partiallyPaid: invoices.filter(
        (inv: any) => inv.status === "partially-paid"
      ).length,
      paid: invoices.filter((inv: any) => inv.status === "paid").length,
      cancelled: invoices.filter((inv: any) => inv.status === "cancelled")
        .length,
    };

    // Count by payment method
    const paymentMethods: Record<string, { count: number; total: number }> = {};
    invoices.forEach((inv: any) => {
      inv.payments?.forEach((payment: any) => {
        if (!paymentMethods[payment.method]) {
          paymentMethods[payment.method] = { count: 0, total: 0 };
        }
        paymentMethods[payment.method].count++;
        paymentMethods[payment.method].total += payment.amount;
      });
    });

    // Group revenue by time period
    const revenueByPeriod: Record<string, number> = {};
    invoices.forEach((inv: any) => {
      const date = new Date(inv.createdAt);
      let key: string;

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      }

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = 0;
      }
      revenueByPeriod[key] += inv.totalAmount;
    });

    // Sort periods
    const sortedRevenue = Object.entries(revenueByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, amount]) => ({ period, amount }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalPaid,
          totalOutstanding,
          invoiceCount: invoices.length,
          averageInvoiceAmount:
            invoices.length > 0 ? totalRevenue / invoices.length : 0,
        },
        statusCounts,
        paymentMethods,
        revenueByPeriod: sortedRevenue,
        dateRange: { startDate, endDate },
      },
    });
  } catch (error: any) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
