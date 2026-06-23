import { NextResponse } from "next/server";
import { isAdminPhone, normalizePhone } from "@/lib/admin";
import { connectDb } from "@/lib/db";
import { Player } from "@/models/Player";

export async function POST(request) {
  try {
    await connectDb();
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    const name = String(body.name || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();

    if (!phone || !name) {
      return NextResponse.json({ error: "שם וטלפון נדרשים" }, { status: 400 });
    }

    const admin = isAdminPhone(phone);
    const existingPlayer = await Player.findOne({ phone });
    if (existingPlayer) {
      if (existingPlayer.name.trim() !== name) {
        return NextResponse.json(
          { error: "השם והטלפון לא תואמים לשחקן קיים" },
          { status: 409 }
        );
      }
      existingPlayer.isAdmin = admin || existingPlayer.isAdmin;
      await existingPlayer.save();
      return NextResponse.json({
        player: existingPlayer.toObject(),
        isAdmin: admin || existingPlayer.isAdmin,
      });
    }

    const player = await Player.create({
      phone,
      name,
      imageUrl,
      isAdmin: admin,
    });

    return NextResponse.json({ player: player.toObject(), isAdmin: admin || player.isAdmin });
  } catch (error) {
    console.error("POST /api/session failed", error);
    return NextResponse.json({ error: error.message || "כניסה נכשלה" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDb();
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    if (!phone) return NextResponse.json({ error: "טלפון נדרש" }, { status: 400 });

    const update = {};
    if (body.name) update.name = String(body.name).trim();
    if (body.imageUrl !== undefined) update.imageUrl = String(body.imageUrl || "").trim();

    const player = await Player.findOneAndUpdate({ phone }, update, { new: true }).lean();
    if (!player) return NextResponse.json({ error: "שחקן לא נמצא" }, { status: 404 });

    return NextResponse.json({ player, isAdmin: isAdminPhone(phone) || player.isAdmin });
  } catch (error) {
    console.error("PATCH /api/session failed", error);
    return NextResponse.json({ error: error.message || "עדכון משתמש נכשל" }, { status: 500 });
  }
}
