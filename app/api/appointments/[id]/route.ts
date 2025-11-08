import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { withPermission } from "@/lib/apiHelpers";
import { Resource, Action } from "@/lib/permissions";

/**
 * GET /api/appointments/[id]
 * Get a specific appointment
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const appointment = await Appointment.findById(id)
      .populate("patient", "firstName lastName contactNumber email photo")
      .populate("practitioner", "firstName lastName professionalDetails")
      .populate("clinic", "name")
      .populate("createdBy", "firstName lastName");

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    console.error("Error fetching appointment:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch appointment",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/appointments/[id]
 * Update an appointment
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found",
        },
        { status: 404 }
      );
    }

    // If updating time, check for conflicts
    if (body.startTime || body.duration) {
      const startTime = body.startTime || appointment.startTime;
      const duration = body.duration || appointment.duration;

      const [startHour, startMin] = startTime.split(":").map(Number);
      const totalMinutes = startHour * 60 + startMin + duration;
      const endHour = Math.floor(totalMinutes / 60);
      const endMin = totalMinutes % 60;
      const endTime = `${String(endHour).padStart(2, "0")}:${String(
        endMin
      ).padStart(2, "0")}`;

      const conflictCheck = await Appointment.checkConflict(
        appointment.practitioner,
        appointment.appointmentDate,
        startTime,
        endTime,
        appointment._id
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

      body.endTime = endTime;
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "firstName lastName contactNumber email photo")
      .populate("practitioner", "firstName lastName professionalDetails")
      .populate("clinic", "name");

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      data: updatedAppointment,
    });
  } catch (error: any) {
    console.error("Error updating appointment:", error);

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
        error: "Failed to update appointment",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/[id]
 * Cancel an appointment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason");

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        cancellationReason: reason || "Cancelled by user",
        cancelledAt: new Date(),
      },
      { new: true }
    );

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error: any) {
    console.error("Error cancelling appointment:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel appointment",
      },
      { status: 500 }
    );
  }
}
