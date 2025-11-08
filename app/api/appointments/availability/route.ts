import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { withPermission } from "@/lib/apiHelpers";
import { Resource, Action } from "@/lib/permissions";
import { Types } from "mongoose";

/**
 * GET /api/appointments/availability
 * Check practitioner availability for a specific date
 */
export const GET = withPermission(
  Resource.Appointment,
  Action.Read,
  async (req, user) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const practitionerId = searchParams.get("practitionerId");
    const date = searchParams.get("date");
    const clinicId = searchParams.get("clinicId") || user.primaryClinic;

    if (!practitionerId || !date || !clinicId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: practitionerId, date, clinicId",
        },
        { status: 400 }
      );
    }

    try {
      const appointmentDate = new Date(date);

      const availability = await Appointment.getPractitionerAvailability(
        new Types.ObjectId(practitionerId),
        appointmentDate,
        new Types.ObjectId(clinicId)
      );

      return NextResponse.json({
        success: true,
        data: availability,
      });
    } catch (error: any) {
      console.error("Availability check error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to check availability",
        },
        { status: 500 }
      );
    }
  }
);
