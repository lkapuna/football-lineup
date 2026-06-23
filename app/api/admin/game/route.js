import { NextResponse } from "next/server";
import { isAdminPhone } from "@/lib/admin";
import { connectDb } from "@/lib/db";
import { defaultTeams, getCurrentGame } from "@/lib/game";
import { Game } from "@/models/Game";
import { JoinRequest } from "@/models/JoinRequest";
import "@/models/Player";

function assertAdmin(phone) {
  if (!isAdminPhone(phone)) throw new Error("אין הרשאת אדמין");
}

export async function POST(request) {
  await connectDb();
  const body = await request.json();
  assertAdmin(body.adminPhone);

  const previous = body.duplicatePrevious
    ? await Game.findOne({ isActive: true }).populate("teams.players").lean()
    : null;
  await Game.updateMany({ isActive: true }, { isActive: false });
  const teams = previous
    ? previous.teams.map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
        maxPlayers: team.maxPlayers,
        players: body.copyPlayers ? team.players.map((player) => player._id || player) : [],
      }))
    : defaultTeams();

  const game = await Game.create({
    title: body.title || "משחק שבועי",
    gameDate: body.gameDate ? new Date(body.gameDate) : new Date(),
    teams,
    isActive: true,
    locked: false,
  });
  return NextResponse.json({ game });
}

export async function PATCH(request) {
  await connectDb();
  const body = await request.json();
  assertAdmin(body.adminPhone);
  const game = await getCurrentGame();

  if (body.action === "reset") {
    await Game.updateOne({ _id: game._id }, { $set: { "teams.$[].players": [] } });
    await JoinRequest.updateMany({ gameId: game._id, status: "pending" }, { status: "rejected" });
  }

  if (body.action === "lock") {
    await Game.updateOne({ _id: game._id }, { locked: Boolean(body.locked) });
  }

  if (body.action === "updateTeam") {
    const update = {};
    if (body.name !== undefined) update["teams.$.name"] = String(body.name);
    if (body.maxPlayers !== undefined) update["teams.$.maxPlayers"] = Number(body.maxPlayers);
    await Game.updateOne({ _id: game._id, "teams.id": body.teamId }, { $set: update });
  }

  return NextResponse.json({ ok: true });
}
