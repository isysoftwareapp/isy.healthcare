import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";
import User from "@/models/User";
import Invoice from "@/models/Invoice";

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  doctor: {
    _id: string;
    name: string;
  };
  appointmentDate: Date;
  status: string;
  reason: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, patients, appointments, invoices

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    await connectDB();

    // Get user to determine their clinic
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const results: any = {
      patients: [],
      appointments: [],
      invoices: [],
    };

    // Search patients
    if (type === "all" || type === "patients") {
      const searchRegex = new RegExp(query, "i");
      results.patients = await Patient.find({
        clinicId: user.primaryClinic,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { patientId: searchRegex },
        ],
      })
        .select("_id firstName lastName email phone patientId dateOfBirth")
        .limit(5)
        .lean();
    }

    // Search appointments (import model dynamically to avoid circular deps)
    if (type === "all" || type === "appointments") {
      try {
        const Appointment = (await import("@/models/Appointment")).default;
        const searchRegex = new RegExp(query, "i");

        const appointments = await Appointment.find({
          clinicId: user.primaryClinic,
          $or: [{ reason: searchRegex }, { notes: searchRegex }],
        })
          .populate("patient", "firstName lastName")
          .populate("doctor", "name")
          .select("_id patient doctor appointmentDate status reason")
          .limit(5)
          .lean();

        results.appointments = appointments;
      } catch (error) {
        console.error("Error searching appointments:", error);
      }
    }

    // Search invoices
    if (type === "all" || type === "invoices") {
      const searchRegex = new RegExp(query, "i");
      results.invoices = await Invoice.find({
        clinicId: user.primaryClinic,
        $or: [{ invoiceNumber: searchRegex }, { "patient.name": searchRegex }],
      })
        .select("_id invoiceNumber patient totalAmount status createdAt")
        .limit(5)
        .lean();
    }

    // Calculate total results
    const totalResults =
      results.patients.length +
      results.appointments.length +
      results.invoices.length;

    return NextResponse.json({
      query,
      totalResults,
      results,
    });
  } catch (error: any) {
    console.error("Error in global search:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
