import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";

// Mock data for demonstration - replace with actual model imports
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Mock data - replace with actual database query
    // const inventory = await Inventory.find({}).populate('clinic').sort({ createdAt: -1 });

    const mockInventory = [
      {
        _id: "1",
        name: "Paracetamol 500mg",
        sku: "MED-001",
        category: "medication",
        quantity: 150,
        lowStockThreshold: 50,
        price: 5.99,
        expiryDate: "2025-12-31",
      },
      {
        _id: "2",
        name: "Surgical Gloves",
        sku: "SUP-002",
        category: "supply",
        quantity: 30,
        lowStockThreshold: 100,
        price: 12.5,
      },
      {
        _id: "3",
        name: "Bandages",
        sku: "SUP-003",
        category: "supply",
        quantity: 200,
        lowStockThreshold: 50,
        price: 3.99,
      },
    ];

    return NextResponse.json(mockInventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
