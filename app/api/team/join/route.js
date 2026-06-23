import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getCurrentGame } from "@/lib/game";
import { Game } from "@/models/Game";
import { JoinRequest } from "@/models/JoinRequest";
import { Player } from "@/models/Player";

export async function POST(request) {
  await connectDb();
  const { playerId, teamId } = await request.json();
  const player = await Player.findById(playerId);
  if (!player) return NextResponse.json({ error: "שחקן לא נמצא" }, { status: 404 });

  const game = await getCurrentGame();
  if (game.locked) return NextResponse.json({ error: "ההרכבים נעולים" }, { status: 423 });

  const team = game.teams.find((item) => item.id === teamId);
  if (!team) return NextResponse.json({ error: "קבוצה לא נמצאה" }, { status: 404 });

  const alreadyInTeam = game.teams.some((item) =>
    item.players.some((teamPlayer) => String(teamPlayer._id || teamPlayer) === String(playerId))
  );
  if (alreadyInTeam) {
    return NextResponse.json({ error: "השחקן כבר משובץ בקבוצה" }, { status: 400 });
  }

  if (team.players.length >= team.maxPlayers) {
    const joinRequest = await JoinRequest.findOneAndUpdate(
      { gameId: game._id, playerId, requestedTeamId: teamId, status: "pending" },
      { gameId: game._id, playerId, requestedTeamId: teamId, status: "pending" },
      { upsert: true, new: true }
    );
    return NextResponse.json({ status: "pending", request: joinRequest });
  }

  await Game.updateOne(
    { _id: game._id, "teams.id": teamId },
    { $addToSet: { "teams.$.players": player._id } }
  );
  return NextResponse.json({ status: "approved" });
}
