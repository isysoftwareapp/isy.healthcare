import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { language, theme, notifications } = body;

    const updateData: any = {};
    if (language) updateData["preferences.language"] = language;
    if (theme) updateData["preferences.theme"] = theme;
    if (notifications !== undefined)
      updateData["preferences.notifications"] = notifications;

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      preferences: user.preferences,
    });
  } catch (error: any) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
