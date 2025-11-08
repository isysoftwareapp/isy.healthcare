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

    // Mock data - replace with actual database query
    const mockTests = [
      {
        _id: "1",
        testNumber: "LAB-2025-001",
        patient: {
          _id: "p1",
          firstName: "John",
          lastName: "Doe",
        },
        testType: "Complete Blood Count",
        status: "completed",
        orderedDate: "2025-11-05",
        completedDate: "2025-11-06",
        results: "Normal",
      },
      {
        _id: "2",
        testNumber: "LAB-2025-002",
        patient: {
          _id: "p2",
          firstName: "Jane",
          lastName: "Smith",
        },
        testType: "Urinalysis",
        status: "in-progress",
        orderedDate: "2025-11-07",
      },
      {
        _id: "3",
        testNumber: "LAB-2025-003",
        patient: {
          _id: "p3",
          firstName: "Bob",
          lastName: "Johnson",
        },
        testType: "Lipid Panel",
        status: "pending",
        orderedDate: "2025-11-07",
      },
    ];

    return NextResponse.json(mockTests);
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab tests" },
      { status: 500 }
    );
  }
}
