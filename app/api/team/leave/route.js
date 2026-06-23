import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getCurrentGame } from "@/lib/game";
import { Game } from "@/models/Game";

export async function POST(request) {
  await connectDb();
  const { playerId } = await request.json();
  const game = await getCurrentGame();
  await Game.updateOne({ _id: game._id }, { $pull: { "teams.$[].players": playerId } });
  return NextResponse.json({ ok: true });
}
