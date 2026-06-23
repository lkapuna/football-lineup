import { NextResponse } from "next/server";
import { isAdminPhone } from "@/lib/admin";
import { connectDb } from "@/lib/db";
import { getCurrentGame } from "@/lib/game";
import { Game } from "@/models/Game";
import { JoinRequest } from "@/models/JoinRequest";

export async function GET(request) {
  await connectDb();
  if (!isAdminPhone(request.nextUrl.searchParams.get("adminPhone"))) {
    return NextResponse.json({ error: "אין הרשאת אדמין" }, { status: 403 });
  }
  const game = await getCurrentGame();
  const requests = await JoinRequest.find({ gameId: game._id, status: "pending" })
    .populate("playerId")
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json({ requests });
}

export async function PATCH(request) {
  await connectDb();
  const body = await request.json();
  if (!isAdminPhone(body.adminPhone)) {
    return NextResponse.json({ error: "אין הרשאת אדמין" }, { status: 403 });
  }

  const joinRequest = await JoinRequest.findById(body.requestId);
  if (!joinRequest) return NextResponse.json({ error: "בקשה לא נמצאה" }, { status: 404 });

  if (body.status === "approved") {
    const game = await getCurrentGame();
    await Game.updateOne({ _id: game._id }, { $pull: { "teams.$[].players": joinRequest.playerId } });
    await Game.updateOne(
      { _id: game._id, "teams.id": joinRequest.requestedTeamId },
      { $addToSet: { "teams.$.players": joinRequest.playerId } }
    );
  }

  joinRequest.status = body.status === "approved" ? "approved" : "rejected";
  await joinRequest.save();
  return NextResponse.json({ ok: true });
}
