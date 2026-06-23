import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getCurrentGame, serializeGame } from "@/lib/game";
import { JoinRequest } from "@/models/JoinRequest";

export async function GET() {
  await connectDb();
  const game = await getCurrentGame();
  const requests = await JoinRequest.find({ gameId: game._id, status: "pending" })
    .populate("playerId")
    .lean();
  return NextResponse.json({ game: serializeGame(game), pendingRequests: requests });
}
