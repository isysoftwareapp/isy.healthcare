import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

/**
 * GET /api/invoices/[id]
 * Get a specific invoice by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const invoice = await Invoice.findById(id)
      .populate(
        "patient",
        "firstName lastName patientId email phone address dateOfBirth"
      )
      .populate("clinic", "name address phone email taxId")
      .populate("appointment", "appointmentId appointmentDate")
      .populate("items.service", "name category")
      .populate("createdBy", "firstName lastName")
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
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error fetching invoice:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[id]
 * Update an invoice
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();

    // Don't allow updating certain fields if invoice is paid
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    if (
      existingInvoice.status === "paid" ||
      existingInvoice.status === "cancelled"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot update ${existingInvoice.status} invoice`,
        },
        { status: 400 }
      );
    }

    // Recalculate item totals if items are being updated
    if (body.items && body.items.length > 0) {
      body.items = body.items.map((item: any) => {
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice;

        const subtotalBeforeDiscount = unitPrice * quantity;

        let discountAmount = 0;
        if (item.discountType === "percentage") {
          discountAmount =
            (subtotalBeforeDiscount * (item.discount || 0)) / 100;
        } else {
          discountAmount = (item.discount || 0) * quantity;
        }

        const subtotal = subtotalBeforeDiscount - discountAmount;
        const tax = (subtotal * (item.taxRate || 0)) / 100;
        const total = subtotal + tax;

        return {
          ...item,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
        };
      });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "firstName lastName patientId")
      .populate("clinic", "name")
      .populate("updatedBy", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error("Error updating invoice:", error);

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
        error: "Failed to update invoice",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 * Delete (cancel) an invoice
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;

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

    // Don't allow deleting paid invoices
    if (invoice.status === "paid" || invoice.paidAmount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete invoice with payments. Cancel it instead.",
        },
        { status: 400 }
      );
    }

    // Mark as cancelled instead of hard delete
    invoice.status = "cancelled";
    await invoice.save();

    return NextResponse.json({
      success: true,
      message: "Invoice cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete invoice",
      },
      { status: 500 }
    );
  }
}
