import { Game } from "@/models/Game";
import "@/models/Player";

export const TEAM_COLORS = ["#2f80ed", "#eb5757", "#f2c94c"];

export function defaultTeams() {
  return [
    { id: "blue", name: "קבוצה כחולה", color: TEAM_COLORS[0], maxPlayers: 5, players: [] },
    { id: "red", name: "קבוצה אדומה", color: TEAM_COLORS[1], maxPlayers: 5, players: [] },
    { id: "yellow", name: "קבוצה צהובה", color: TEAM_COLORS[2], maxPlayers: 5, players: [] },
  ];
}

export async function getCurrentGame() {
  let game = await Game.findOne({ isActive: true }).populate("teams.players").lean();
  if (!game) {
    game = await Game.create({
      title: "משחק שבועי",
      gameDate: new Date(),
      isActive: true,
      locked: false,
      teams: defaultTeams(),
    });
    game = await Game.findById(game._id).populate("teams.players").lean();
  }
  return game;
}

export function serializeGame(game) {
  return JSON.parse(JSON.stringify(game));
}
