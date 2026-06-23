"use client";

import { useState } from "react";
import { api, clearStoredPlayer, fileToDataUrl, setStoredPlayer } from "@/lib/client";

export default function ProfileCard({ player, onUpdate, onLogout }) {
  const [name, setName] = useState(player.name || "");
  const [imageUrl, setImageUrl] = useState(player.imageUrl || "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFile(event) {
    const dataUrl = await fileToDataUrl(event.target.files?.[0]);
    if (dataUrl) setImageUrl(dataUrl);
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    try {
      const data = await api("/api/session", {
        method: "PATCH",
        body: JSON.stringify({ phone: player.phone, name, imageUrl }),
      });
      const updated = { ...data.player, isAdmin: data.isAdmin };
      setStoredPlayer(updated);
      onUpdate(updated);
      setEditing(false);
      setMessage("הפרטים עודכנו");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    clearStoredPlayer();
    onLogout();
  }

  return (
    <section className="card">
      <h2 className="card-title">המשתמש שלי</h2>
      {!editing ? (
        <>
          <div className="list-row">
            <div className="avatar">{player.imageUrl ? <img src={player.imageUrl} alt={player.name} /> : player.name?.[0]}</div>
            <div>
              <strong>{player.name}</strong>
              <div className="mini muted">{player.phone}</div>
            </div>
            <button className="button danger" onClick={logout}>יציאה</button>
          </div>
          <div className="inline-actions">
            <button className="button secondary" onClick={() => setEditing(true)}>ערוך פרטים</button>
          </div>
        </>
      ) : (
        <form className="form-grid" onSubmit={save}>
          <label className="form-row">
            שם
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="form-row">
            תמונה
            <input className="input" type="file" accept="image/*" onChange={handleFile} />
          </label>
          {imageUrl ? <button className="button danger" type="button" onClick={() => setImageUrl("")}>הסר תמונה</button> : null}
          <div className="inline-actions">
            <button className="button">שמור</button>
            <button className="button secondary" type="button" onClick={() => setEditing(false)}>בטל</button>
          </div>
        </form>
      )}
      {message ? <div className="mini">{message}</div> : null}
    </section>
  );
}
