import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { withPermission } from "@/lib/apiHelpers";
import { buildClinicFilter } from "@/lib/rbac";
import { Resource, Action } from "@/lib/permissions";

/**
 * GET /api/appointments
 * List appointments with filtering and pagination
 */
export const GET = withPermission(
  Resource.Appointment,
  Action.Read,
  async (req, user) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const date = searchParams.get("date");
    const practitionerId = searchParams.get("practitionerId");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const clinicId = searchParams.get("clinicId");

    // Build clinic filter based on user's access
    const clinicFilter = buildClinicFilter(user);

    // Build query
    const query: any = { ...clinicFilter };

    // Add clinic filter if specified
    if (clinicId) {
      query.clinic = clinicId;
    }

    // Add date filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // Add practitioner filter
    if (practitionerId) {
      query.practitioner = practitionerId;
    }

    // Add patient filter
    if (patientId) {
      query.patient = patientId;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await Appointment.countDocuments(query);

    // Get appointments
    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName contactNumber photo")
      .populate("practitioner", "firstName lastName professionalDetails")
      .populate("clinic", "name")
      .sort({ appointmentDate: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * POST /api/appointments
 * Create a new appointment
 */
export const POST = withPermission(
  Resource.Appointment,
  Action.Create,
  async (req, user) => {
    await dbConnect();

    try {
      const body = await req.json();

      // Validate required fields
      if (
        !body.patient ||
        !body.practitioner ||
        !body.appointmentDate ||
        !body.startTime ||
        !body.duration ||
        !body.type ||
        !body.reason
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields",
          },
          { status: 400 }
        );
      }

      // Set clinic from user session if not provided
      if (!body.clinic) {
        body.clinic = user.primaryClinic;
      }

      // Verify user has access to the specified clinic
      const userHasAccess =
        body.clinic.toString() === user.primaryClinic?.toString() ||
        user.assignedClinics?.includes(body.clinic.toString());

      if (!userHasAccess) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You don't have access to create appointments for this clinic",
          },
          { status: 403 }
        );
      }

      // Calculate end time based on duration
      const [startHour, startMin] = body.startTime.split(":").map(Number);
      const totalMinutes = startHour * 60 + startMin + body.duration;
      const endHour = Math.floor(totalMinutes / 60);
      const endMin = totalMinutes % 60;
      body.endTime = `${String(endHour).padStart(2, "0")}:${String(
        endMin
      ).padStart(2, "0")}`;

      // Check for conflicts
      const conflictCheck = await Appointment.checkConflict(
        body.practitioner,
        new Date(body.appointmentDate),
        body.startTime,
        body.endTime
      );

      if (conflictCheck.hasConflict) {
        return NextResponse.json(
          {
            success: false,
            error: "Time slot is already booked",
            conflictingAppointment: conflictCheck.conflictingAppointment,
          },
          { status: 409 }
        );
      }

      // Generate appointment ID
      const clinicCode = body.clinic.toString().slice(-4).toUpperCase();
      const dateCode = new Date(body.appointmentDate)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      body.appointmentId = `APT-${clinicCode}-${dateCode}-${random}`;

      // Set created by
      body.createdBy = user.id;

      // Create appointment
      const appointment = await Appointment.create(body);

      // Populate references
      await appointment.populate(
        "patient",
        "firstName lastName contactNumber photo"
      );
      await appointment.populate(
        "practitioner",
        "firstName lastName professionalDetails"
      );
      await appointment.populate("clinic", "name");

      return NextResponse.json(
        {
          success: true,
          message: "Appointment created successfully",
          data: appointment,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error("Appointment creation error:", error);

      if (error.name === "ValidationError") {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: Object.values(error.errors).map((e: any) => e.message),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create appointment",
        },
        { status: 500 }
      );
    }
  }
);
