import { NextResponse } from "next/server";
import { isAdminPhone } from "@/lib/admin";
import { connectDb } from "@/lib/db";
import { getCurrentGame } from "@/lib/game";
import { Game } from "@/models/Game";

export async function POST(request) {
  await connectDb();
  const body = await request.json();
  if (!isAdminPhone(body.adminPhone)) {
    return NextResponse.json({ error: "אין הרשאת אדמין" }, { status: 403 });
  }

  const game = await getCurrentGame();
  if (body.teamId === "outside") {
    await Game.updateOne({ _id: game._id }, { $pull: { "teams.$[].players": body.playerId } });
    return NextResponse.json({ ok: true });
  }

  const team = game.teams.find((item) => item.id === body.teamId);
  if (!team) return NextResponse.json({ error: "קבוצה לא נמצאה" }, { status: 404 });
  if (!body.overrideLimit && team.players.length >= team.maxPlayers) {
    return NextResponse.json({ error: "הקבוצה מלאה. נדרש אישור חריגה." }, { status: 409 });
  }

  await Game.updateOne({ _id: game._id }, { $pull: { "teams.$[].players": body.playerId } });
  await Game.updateOne(
    { _id: game._id, "teams.id": body.teamId },
    { $addToSet: { "teams.$.players": body.playerId } }
  );
  return NextResponse.json({ ok: true });
}
