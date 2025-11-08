import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ExchangeRate from "@/models/ExchangeRate";

/**
 * GET /api/exchange-rates/convert
 * Convert amount between currencies
 * Query params: amount, from, to, clinicId (optional)
 */
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const amount = parseFloat(searchParams.get("amount") || "0");
    const fromCurrency = searchParams.get("from");
    const toCurrency = searchParams.get("to");
    const clinicId = searchParams.get("clinicId");

    if (!fromCurrency || !toCurrency) {
      return NextResponse.json(
        {
          success: false,
          error: "Both 'from' and 'to' currencies are required",
        },
        { status: 400 }
      );
    }

    if (amount < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be positive",
        },
        { status: 400 }
      );
    }

    // Get exchange rate
    const rate = await ExchangeRate.getCurrentRate(
      fromCurrency,
      toCurrency,
      clinicId || undefined
    );

    // Convert amount
    const convertedAmount = parseFloat((amount * rate).toFixed(2));

    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        originalCurrency: fromCurrency.toUpperCase(),
        convertedAmount,
        convertedCurrency: toCurrency.toUpperCase(),
        exchangeRate: rate,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error converting currency:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to convert currency",
      },
      { status: 500 }
    );
  }
}
