import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

/**
 * POST /api/invoices/[id]/payments
 * Add a payment to an invoice
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    // Don't allow payments on cancelled invoices
    if (invoice.status === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot add payment to cancelled invoice",
        },
        { status: 400 }
      );
    }

    // Don't allow overpayment
    const remainingBalance = invoice.balanceAmount;
    if (body.amount > remainingBalance) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment amount exceeds balance",
          details: `Remaining balance: ${remainingBalance}`,
        },
        { status: 400 }
      );
    }

    // Generate payment ID
    const paymentId = `PAY-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Add payment
    invoice.payments.push({
      paymentId,
      amount: body.amount,
      currency: body.currency || invoice.displayCurrency,
      paymentMethod: body.paymentMethod,
      reference: body.reference,
      paidAt: body.paidAt || new Date(),
      recordedBy: body.recordedBy,
      notes: body.notes,
    });

    await invoice.save();

    const updatedInvoice = await Invoice.findById(id)
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("payments.recordedBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Payment added successfully",
      data: updatedInvoice,
      paymentId,
    });
  } catch (error: any) {
    console.error("Error adding payment:", error);

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
        error: "Failed to add payment",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices/[id]/payments
 * Get all payments for an invoice
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;

    const invoice = await Invoice.findById(id)
      .select("payments totalAmount paidAmount balanceAmount status")
      .populate("payments.recordedBy", "firstName lastName");

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        payments: invoice.payments,
        summary: {
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          balanceAmount: invoice.balanceAmount,
          status: invoice.status,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payments",
      },
      { status: 500 }
    );
  }
}
