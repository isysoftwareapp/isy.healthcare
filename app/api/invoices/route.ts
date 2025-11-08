import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import ExchangeRate from "@/models/ExchangeRate";

/**
 * GET /api/invoices
 * Get invoices with filtering and pagination
 */
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const patientId = searchParams.get("patientId");
    const clinicId = searchParams.get("clinicId");
    const status = searchParams.get("status");
    const pricelistType = searchParams.get("pricelistType");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const filter: any = {};

    if (patientId) filter.patient = patientId;
    if (clinicId) filter.clinic = clinicId;
    if (status) filter.status = status;
    if (pricelistType) filter.pricelistType = pricelistType;

    if (fromDate || toDate) {
      filter.issueDate = {};
      if (fromDate) filter.issueDate.$gte = new Date(fromDate);
      if (toDate) filter.issueDate.$lte = new Date(toDate);
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate("patient", "firstName lastName patientId email phone")
      .populate("clinic", "name address")
      .populate("appointment", "appointmentId appointmentDate")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate summary statistics
    const stats = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$paidAmount" },
          balanceAmount: { $sum: "$balanceAmount" },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: stats[0] || { totalAmount: 0, paidAmount: 0, balanceAmount: 0 },
    });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoices",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
 */
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    // Generate invoice number if not provided
    if (!body.invoiceNumber) {
      const count = await Invoice.countDocuments({
        clinic: body.clinic,
      });
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
        count + 1
      ).padStart(6, "0")}`;
      body.invoiceNumber = invoiceNumber;
    }

    // Get exchange rate if currencies are different
    if (body.baseCurrency !== body.displayCurrency) {
      const exchangeRate = await ExchangeRate.getCurrentRate(
        body.baseCurrency,
        body.displayCurrency,
        body.clinic
      );
      body.exchangeRate = exchangeRate;
    } else {
      body.exchangeRate = 1;
    }

    // Calculate item totals
    if (body.items && body.items.length > 0) {
      body.items = body.items.map((item: any) => {
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice;

        // Calculate subtotal before discount
        const subtotalBeforeDiscount = unitPrice * quantity;

        // Calculate discount amount
        let discountAmount = 0;
        if (item.discountType === "percentage") {
          discountAmount =
            (subtotalBeforeDiscount * (item.discount || 0)) / 100;
        } else {
          discountAmount = (item.discount || 0) * quantity;
        }

        // Calculate subtotal after discount
        const subtotal = subtotalBeforeDiscount - discountAmount;

        // Calculate tax
        const tax = (subtotal * (item.taxRate || 0)) / 100;

        // Calculate total
        const total = subtotal + tax;

        return {
          ...item,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
        };
      });
    }

    const invoice = await Invoice.create(body);

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("patient", "firstName lastName patientId email phone")
      .populate("clinic", "name address")
      .populate("createdBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully",
      data: populatedInvoice,
    });
  } catch (error: any) {
    console.error("Error creating invoice:", error);

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

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice number already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create invoice",
      },
      { status: 500 }
    );
  }
}
