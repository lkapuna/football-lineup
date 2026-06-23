import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { serializeGame } from "@/lib/game";
import { Game } from "@/models/Game";
import { JoinRequest } from "@/models/JoinRequest";
import "@/models/Player";

export async function GET(_request, { params }) {
  await connectDb();
  const { gameId } = await params;
  const game = await Game.findById(gameId).populate("teams.players").lean();
  if (!game) return NextResponse.json({ error: "משחק לא נמצא" }, { status: 404 });
  const pendingRequests = await JoinRequest.find({ gameId, status: "pending" }).populate("playerId").lean();
  return NextResponse.json({ game: serializeGame(game), pendingRequests });
}
