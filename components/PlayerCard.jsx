"use client";

export default function PlayerCard({ player, teamColor, pending = false, adminActions }) {
  const initial = player?.name?.trim()?.[0] || "?";
  return (
    <div className={`player-card ${pending ? "is-pending" : ""}`} style={{ "--team-color": teamColor }}>
      <div className="avatar">
        {player?.imageUrl ? <img src={player.imageUrl} alt={player.name} /> : <span>{initial}</span>}
      </div>
      <div className="player-name">{player?.name}</div>
      {pending ? <span className="pending-badge">ממתין</span> : null}
      {adminActions}
    </div>
  );
}
