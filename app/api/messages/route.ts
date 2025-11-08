import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Notification from "@/models/Notification";

// GET /api/messages - Get messages for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get("folder") || "inbox"; // inbox, sent, all
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Build query based on folder
    const query: any = {
      clinic: session.user.primaryClinic,
    };

    if (folder === "inbox") {
      query.recipients = session.user.id;
    } else if (folder === "sent") {
      query.sender = session.user.id;
    } else if (folder === "all") {
      query.$or = [
        { recipients: session.user.id },
        { sender: session.user.id },
      ];
    }

    // Only get top-level messages (not replies)
    query.parentMessage = { $exists: false };

    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("sender", "name email")
      .populate("recipients", "name email")
      .lean();

    // Get unread count
    const unreadCount = await (Message as any).getUnreadCountForUser(
      session.user.id,
      session.user.primaryClinic
    );

    const total = await Message.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        messages,
        unreadCount,
        total,
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      recipientIds,
      subject,
      messageBody,
      priority,
      relatedModel,
      relatedId,
      attachments,
      parentMessageId,
    } = body;

    // Validate required fields
    if (
      !recipientIds ||
      !Array.isArray(recipientIds) ||
      recipientIds.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    if (!subject || !messageBody) {
      return NextResponse.json(
        { error: "Subject and message body are required" },
        { status: 400 }
      );
    }

    // Create message
    const message = await Message.create({
      clinic: session.user.primaryClinic,
      sender: session.user.id,
      recipients: recipientIds,
      subject,
      body: messageBody,
      priority: priority || "normal",
      relatedModel,
      relatedId,
      attachments,
      parentMessage: parentMessageId,
      isRead: new Map(recipientIds.map((id: string) => [id, false])),
    });

    // If this is a reply, add to parent's replies array
    if (parentMessageId) {
      await Message.findByIdAndUpdate(parentMessageId, {
        $push: { replies: message._id },
      });
    }

    // Create notifications for recipients
    for (const recipientId of recipientIds) {
      await Notification.create({
        clinic: session.user.primaryClinic,
        recipient: recipientId,
        type: "staff-message",
        title: "New Message",
        message: `New message from ${session.user.name}: ${subject}`,
        priority: priority === "urgent" ? "high" : "medium",
        relatedModel: "Message",
        relatedId: message._id,
        actionUrl: `/dashboard/messages/${message._id}`,
        sentAt: new Date(),
        metadata: {
          senderName: session.user.name,
          subject,
        },
        createdBy: session.user.id,
      });
    }

    // Populate sender and recipients
    await message.populate("sender", "name email");
    await message.populate("recipients", "name email");

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
