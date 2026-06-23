import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    maxPlayers: { type: Number, default: 5 },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  },
  { _id: false }
);

const GameSchema = new mongoose.Schema(
  {
    title: { type: String, default: "משחק שבועי" },
    gameDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    teams: [TeamSchema],
  },
  { timestamps: true }
);

export const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);
