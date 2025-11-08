import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ExchangeRate from "@/models/ExchangeRate";

/**
 * GET /api/exchange-rates
 * Get exchange rates
 */
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get("clinicId");
    const baseCurrency = searchParams.get("baseCurrency");
    const targetCurrency = searchParams.get("targetCurrency");

    const filter: any = { isActive: true };

    if (clinicId) {
      filter.$or = [{ clinic: clinicId }, { clinic: { $exists: false } }];
    }

    if (baseCurrency) {
      filter.baseCurrency = baseCurrency.toUpperCase();
    }

    if (targetCurrency) {
      filter.targetCurrency = targetCurrency.toUpperCase();
    }

    const rates = await ExchangeRate.find(filter)
      .populate("clinic", "name")
      .populate("createdBy", "firstName lastName")
      .sort({ effectiveDate: -1 });

    return NextResponse.json({
      success: true,
      data: rates,
    });
  } catch (error: any) {
    console.error("Error fetching exchange rates:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch exchange rates",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exchange-rates
 * Create or update an exchange rate
 */
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    const { baseCurrency, targetCurrency, rate, clinicId, source, userId } =
      body;

    if (!baseCurrency || !targetCurrency || !rate) {
      return NextResponse.json(
        {
          success: false,
          error: "Base currency, target currency, and rate are required",
        },
        { status: 400 }
      );
    }

    // Use the setRate static method to create/update
    const exchangeRate = await ExchangeRate.setRate(
      baseCurrency,
      targetCurrency,
      rate,
      {
        clinicId,
        source: source || "manual",
        userId,
      }
    );

    const populatedRate = await ExchangeRate.findById(exchangeRate._id)
      .populate("clinic", "name")
      .populate("createdBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Exchange rate created successfully",
      data: populatedRate,
    });
  } catch (error: any) {
    console.error("Error creating exchange rate:", error);

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
        error: "Failed to create exchange rate",
      },
      { status: 500 }
    );
  }
}
