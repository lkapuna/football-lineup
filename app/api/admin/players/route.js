import { NextResponse } from "next/server";
import { isAdminPhone, normalizePhone } from "@/lib/admin";
import { connectDb } from "@/lib/db";
import { getCurrentGame } from "@/lib/game";
import { Game } from "@/models/Game";
import { Player } from "@/models/Player";

function assertAdmin(phone) {
  if (!isAdminPhone(phone)) throw new Error("אין הרשאת אדמין");
}

export async function GET(request) {
  await connectDb();
  const phone = normalizePhone(request.nextUrl.searchParams.get("adminPhone"));
  assertAdmin(phone);
  const players = await Player.find().sort({ name: 1 }).lean();
  return NextResponse.json({ players });
}

export async function POST(request) {
  await connectDb();
  const body = await request.json();
  assertAdmin(body.adminPhone);

  const player = await Player.findOneAndUpdate(
    { phone: normalizePhone(body.phone) },
    {
      name: String(body.name || "").trim(),
      phone: normalizePhone(body.phone),
      imageUrl: String(body.imageUrl || ""),
      isAdmin: isAdminPhone(body.phone),
    },
    { upsert: true, new: true }
  );

  if (body.teamId) {
    const game = await getCurrentGame();
    await Game.updateOne({ _id: game._id }, { $pull: { "teams.$[].players": player._id } });
    await Game.updateOne(
      { _id: game._id, "teams.id": body.teamId },
      { $addToSet: { "teams.$.players": player._id } }
    );
  }

  return NextResponse.json({ player });
}

export async function PATCH(request) {
  await connectDb();
  const body = await request.json();
  assertAdmin(body.adminPhone);

  const update = {};
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.imageUrl !== undefined) update.imageUrl = String(body.imageUrl || "");
  if (body.phone !== undefined) update.phone = normalizePhone(body.phone);

  const player = await Player.findByIdAndUpdate(body.playerId, update, { new: true }).lean();
  return NextResponse.json({ player });
}

export async function DELETE(request) {
  await connectDb();
  const body = await request.json();
  assertAdmin(body.adminPhone);
  await Player.findByIdAndDelete(body.playerId);
  const game = await getCurrentGame();
  await Game.updateOne({ _id: game._id }, { $pull: { "teams.$[].players": body.playerId } });
  return NextResponse.json({ ok: true });
}
