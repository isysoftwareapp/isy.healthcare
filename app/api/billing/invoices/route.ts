import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Mock data - replace with actual Invoice model query
    const mockInvoices = [
      {
        _id: "1",
        invoiceNumber: "INV-2025-001",
        patient: {
          _id: "p1",
          firstName: "John",
          lastName: "Doe",
        },
        amount: 250.0,
        status: "paid",
        createdAt: "2025-11-01",
      },
      {
        _id: "2",
        invoiceNumber: "INV-2025-002",
        patient: {
          _id: "p2",
          firstName: "Jane",
          lastName: "Smith",
        },
        amount: 450.0,
        status: "pending",
        createdAt: "2025-11-05",
      },
      {
        _id: "3",
        invoiceNumber: "INV-2025-003",
        patient: {
          _id: "p3",
          firstName: "Bob",
          lastName: "Johnson",
        },
        amount: 180.0,
        status: "overdue",
        createdAt: "2025-10-20",
      },
    ];

    return NextResponse.json(mockInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
