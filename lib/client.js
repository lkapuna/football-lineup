export async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "פעולה נכשלה");
  return data;
}

export function getStoredPlayer() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("football-player");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("football-player");
    return null;
  }
}

export function setStoredPlayer(player) {
  localStorage.setItem("football-player", JSON.stringify(player));
}

export function clearStoredPlayer() {
  localStorage.removeItem("football-player");
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
