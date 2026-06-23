import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Player = mongoose.models.Player || mongoose.model("Player", PlayerSchema);
