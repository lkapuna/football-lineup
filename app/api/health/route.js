import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";

export async function GET() {
  const env = {
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasAdminPhones: Boolean(process.env.ADMIN_PHONE_NUMBERS),
    hasPublicUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  };

  try {
    await connectDb();
    return NextResponse.json({ ok: true, db: "connected", env });
  } catch (error) {
    console.error("GET /api/health failed", error);
    return NextResponse.json(
      { ok: false, db: "failed", env, error: error.message || "Health check failed" },
      { status: 500 }
    );
  }
}
