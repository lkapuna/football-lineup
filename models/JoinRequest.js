import mongoose from "mongoose";

const JoinRequestSchema = new mongoose.Schema(
  {
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    requestedTeamId: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const JoinRequest =
  mongoose.models.JoinRequest || mongoose.model("JoinRequest", JoinRequestSchema);
