"use client";

import { useState } from "react";
import { api, fileToDataUrl, setStoredPlayer } from "@/lib/client";

export default function LoginCard({ onLogin }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(event) {
    const dataUrl = await fileToDataUrl(event.target.files?.[0]);
    if (dataUrl) setImageUrl(dataUrl);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/session", {
        method: "POST",
        body: JSON.stringify({ name, phone, imageUrl }),
      });
      const player = { ...data.player, isAdmin: data.isAdmin };
      setStoredPlayer(player);
      onLogin(player);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 className="card-title">כניסה מהירה</h2>
      <form className="form-grid" onSubmit={submit}>
        <label className="form-row">
          שם
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="form-row">
          טלפון
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="form-row">
          תמונה
          <input className="input" type="file" accept="image/*" onChange={handleFile} />
        </label>
        {imageUrl ? (
          <div className="inline-actions">
            <div className="mini muted">תמונה נטענה</div>
            <button className="button danger" type="button" onClick={() => setImageUrl("")}>הסר תמונה</button>
          </div>
        ) : null}
        {error ? <div className="mini" style={{ color: "var(--red)" }}>{error}</div> : null}
        <button className="button" disabled={loading}>
          {loading ? "נכנס..." : "כניסה"}
        </button>
      </form>
    </section>
  );
}
