import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Build query
    const query: any = {
      recipient: session.user.id,
    };

    if (session.user.primaryClinic) {
      query.clinic = session.user.primaryClinic;
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (priority) {
      query.priority = priority;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get counts
    const unreadCount = await (Notification as any).getUnreadCount(
      session.user.id,
      session.user.primaryClinic
    );

    const total = await Notification.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total,
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      recipientId,
      type,
      title,
      message,
      priority,
      relatedModel,
      relatedId,
      actionUrl,
      scheduledFor,
      metadata,
    } = body;

    // Validate required fields
    if (!recipientId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await Notification.create({
      clinic: session.user.primaryClinic,
      recipient: recipientId,
      type,
      title,
      message,
      priority: priority || "medium",
      relatedModel,
      relatedId,
      actionUrl,
      scheduledFor,
      sentAt: scheduledFor ? undefined : new Date(),
      metadata,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Bulk update notifications
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { action } = body; // "mark-all-read" or "archive-all"

    if (action === "mark-all-read") {
      await (Notification as any).markAllAsRead(
        session.user.id,
        session.user.primaryClinic
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (action === "archive-all") {
      const query: any = {
        recipient: session.user.id,
        status: { $ne: "archived" },
      };
      if (session.user.primaryClinic) {
        query.clinic = session.user.primaryClinic;
      }

      await Notification.updateMany(query, {
        $set: { status: "archived", archivedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications archived",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
