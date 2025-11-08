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
    const mockExams = [
      {
        _id: "1",
        examNumber: "RAD-2025-001",
        patient: {
          _id: "p1",
          firstName: "John",
          lastName: "Doe",
        },
        examType: "Chest X-Ray",
        status: "completed",
        scheduledDate: "2025-11-05",
        completedDate: "2025-11-05",
        findings: "Clear",
      },
      {
        _id: "2",
        examNumber: "RAD-2025-002",
        patient: {
          _id: "p2",
          firstName: "Jane",
          lastName: "Smith",
        },
        examType: "MRI Brain",
        status: "scheduled",
        scheduledDate: "2025-11-10",
      },
      {
        _id: "3",
        examNumber: "RAD-2025-003",
        patient: {
          _id: "p3",
          firstName: "Bob",
          lastName: "Johnson",
        },
        examType: "CT Scan Abdomen",
        status: "in-progress",
        scheduledDate: "2025-11-07",
      },
    ];

    return NextResponse.json(mockExams);
  } catch (error) {
    console.error("Error fetching radiology exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch radiology exams" },
      { status: 500 }
    );
  }
}
