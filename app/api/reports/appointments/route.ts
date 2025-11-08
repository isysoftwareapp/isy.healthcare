import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { getServerSession } from "next-auth";

// GET /api/reports/appointments - Generate appointment analytics
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get("clinic");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!clinicId || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Clinic ID, start date, and end date are required",
        },
        { status: 400 }
      );
    }

    // Build date filter
    const dateFilter: any = {
      clinic: clinicId,
      appointmentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Get all appointments in date range
    const appointments = await Appointment.find(dateFilter).lean();

    // Total appointments
    const totalAppointments = appointments.length;

    // Count by status
    const statusCounts = {
      scheduled: appointments.filter((a: any) => a.status === "scheduled")
        .length,
      confirmed: appointments.filter((a: any) => a.status === "confirmed")
        .length,
      inProgress: appointments.filter((a: any) => a.status === "in-progress")
        .length,
      completed: appointments.filter((a: any) => a.status === "completed")
        .length,
      cancelled: appointments.filter((a: any) => a.status === "cancelled")
        .length,
      noShow: appointments.filter((a: any) => a.status === "no-show").length,
    };

    // Count by type
    const typeCounts: Record<string, number> = {};
    appointments.forEach((apt: any) => {
      const type = apt.appointmentType || "general";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Calculate completion rate
    const completedCount = statusCounts.completed;
    const completionRate =
      totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;

    // Calculate no-show rate
    const noShowRate =
      totalAppointments > 0
        ? (statusCounts.noShow / totalAppointments) * 100
        : 0;

    // Calculate cancellation rate
    const cancellationRate =
      totalAppointments > 0
        ? (statusCounts.cancelled / totalAppointments) * 100
        : 0;

    // Appointments by day of week
    const dayOfWeekCounts = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    appointments.forEach((apt: any) => {
      const date = new Date(apt.appointmentDate);
      const dayName = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][date.getDay()];
      dayOfWeekCounts[dayName as keyof typeof dayOfWeekCounts]++;
    });

    // Appointments by hour (business hours 8-18)
    const hourCounts: Record<number, number> = {};
    for (let i = 8; i <= 18; i++) {
      hourCounts[i] = 0;
    }

    appointments.forEach((apt: any) => {
      if (apt.appointmentTime) {
        const hour = parseInt(apt.appointmentTime.split(":")[0]);
        if (hour >= 8 && hour <= 18) {
          hourCounts[hour]++;
        }
      }
    });

    // Appointments trend by day
    const appointmentsByDay: Record<string, number> = {};
    appointments.forEach((apt: any) => {
      const date = new Date(apt.appointmentDate);
      const key = date.toISOString().split("T")[0];
      appointmentsByDay[key] = (appointmentsByDay[key] || 0) + 1;
    });

    const appointmentTrend = Object.entries(appointmentsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Average appointments per day
    const daysInRange = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const avgAppointmentsPerDay =
      daysInRange > 0 ? totalAppointments / daysInRange : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAppointments,
          completedAppointments: completedCount,
          completionRate: Math.round(completionRate * 100) / 100,
          noShowRate: Math.round(noShowRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          avgAppointmentsPerDay: Math.round(avgAppointmentsPerDay * 100) / 100,
        },
        statusCounts,
        typeCounts,
        dayOfWeekCounts,
        hourCounts,
        appointmentTrend,
        dateRange: { startDate, endDate },
      },
    });
  } catch (error: any) {
    console.error("Error generating appointment report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
