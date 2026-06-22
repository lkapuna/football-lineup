const STORAGE_KEY = "football-lineup-builder-v1";
const APP_VERSION = "1.4.1";
const TEAM_COLORS = ["#f4f4f4", "#0f172a", "#2f80ed", "#ef4444", "#facc15", "#22c55e"];
const FORMATION = [
  { x: 50, y: 18 },
  { x: 22, y: 48 },
  { x: 50, y: 50 },
  { x: 78, y: 48 },
  { x: 50, y: 78 },
];

const state = loadState();
let draggedPlayerId = null;
let dragMode = null;
let pointer = {
  id: null,
  playerId: null,
  fieldId: null,
  offsetX: 0,
  offsetY: 0,
};
const dropZones = new WeakSet();

const elements = {
  form: document.querySelector("#playerForm"),
  name: document.querySelector("#playerName"),
  image: document.querySelector("#playerImage"),
  bench: document.querySelector("#bench"),
  fields: document.querySelector("#fields"),
  teamList: document.querySelector("#teamList"),
  playerCount: document.querySelector("#playerCount"),
  addTeam: document.querySelector("#addTeamBtn"),
  reset: document.querySelector("#resetBtn"),
  clearAll: document.querySelector("#clearAllBtn"),
  autoArrange: document.querySelector("#autoArrangeBtn"),
  exportPdf: document.querySelector("#exportPdfBtn"),
  demo: document.querySelector("#demoBtn"),
  appVersion: document.querySelector("#appVersion"),
  versionBadge: document.querySelector("#versionBadge"),
  template: document.querySelector("#playerTemplate"),
};

if (elements.appVersion) {
  elements.appVersion.textContent = `v${APP_VERSION}`;
}
if (elements.versionBadge) {
  elements.versionBadge.textContent = `v${APP_VERSION}`;
}

render();

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = elements.name.value.trim();
  if (!name) return;

  const imageFile = elements.image.files[0];
  const image = imageFile ? await readImage(imageFile) : "";
  state.players.push({
    id: crypto.randomUUID(),
    name,
    image,
    teamId: null,
    x: 50,
    y: 50,
  });

  elements.form.reset();
  persist();
  render();
});

elements.addTeam.addEventListener("click", () => {
  const index = state.teams.length;
  state.teams.push({
    id: crypto.randomUUID(),
    name: `קבוצה ${index + 1}`,
    color: TEAM_COLORS[index % TEAM_COLORS.length],
  });
  persist();
  render();
});

elements.demo.addEventListener("click", () => {
  const names = ["דוד", "אבי", "עומר", "משה", "רן", "יואב", "מור", "עידו", "אור", "אלון"];
  names.forEach((name) => {
    state.players.push({
      id: crypto.randomUUID(),
      name,
      image: "",
      teamId: null,
      x: 50,
      y: 50,
    });
  });
  persist();
  render();
});

elements.reset.addEventListener("click", () => {
  state.players.forEach((player) => {
    player.teamId = null;
  });
  persist();
  render();
});

elements.clearAll.addEventListener("click", () => {
  if (!confirm("לאפס את כל השחקנים והקבוצות?")) return;
  state.players = [];
  state.teams = defaultTeams();
  persist();
  render();
});

elements.autoArrange.addEventListener("click", () => {
  autoArrangeAllPlayers();
  persist();
  render();
});

elements.exportPdf.addEventListener("click", () => {
  render();
  preparePrintLayout();
  setTimeout(() => {
    window.print();
  }, 100);
});

window.addEventListener("afterprint", () => {
  clearPrintLayout();
});

function preparePrintLayout() {
  clearPrintLayout();
  const teamCount = state.teams.length;
  document.body.classList.add("printing-lineups");
  if (teamCount <= 3) {
    document.body.classList.add("print-teams-3");
  } else if (teamCount === 4) {
    document.body.classList.add("print-teams-4");
  } else if (teamCount === 5) {
    document.body.classList.add("print-teams-5");
  } else {
    document.body.classList.add("print-teams-many");
  }
}

function clearPrintLayout() {
  document.body.classList.remove("printing-lineups", "print-teams-3", "print-teams-4", "print-teams-5", "print-teams-many");
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.players) && Array.isArray(parsed.teams)) return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    teams: defaultTeams(),
    players: [],
  };
}

function defaultTeams() {
  return [
    { id: "team-white", name: "White Team", color: "#f4f4f4" },
    { id: "team-black", name: "Black Team", color: "#0f172a" },
    { id: "team-blue", name: "Blue Team", color: "#2f80ed" },
  ];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  elements.playerCount.textContent = `${state.players.length} שחקנים`;
  renderTeams();
  renderBench();
  renderFields();
}

function renderTeams() {
  elements.teamList.replaceChildren();
  state.teams.forEach((team) => {
    const row = document.createElement("div");
    row.className = "team-row";
    row.style.setProperty("--team-color", team.color);

    const swatch = document.createElement("span");
    swatch.className = "swatch";

    const input = document.createElement("input");
    input.className = "team-name-input";
    input.value = team.name;
    input.addEventListener("change", () => {
      team.name = input.value.trim() || team.name;
      persist();
      render();
    });

    const count = document.createElement("span");
    count.className = "team-count";
    count.textContent = `${playersInTeam(team.id).length}/5`;

    row.append(swatch, input, count);
    elements.teamList.append(row);
  });
}

function renderBench() {
  elements.bench.replaceChildren();
  makeDropZone(elements.bench, null);

  const freePlayers = state.players.filter((player) => !player.teamId);
  if (!freePlayers.length) {
    elements.bench.append(emptyState("אין שחקנים בחוץ"));
    return;
  }

  freePlayers.forEach((player) => {
    elements.bench.append(createPlayerNode(player, false));
  });
}

function renderFields() {
  elements.fields.replaceChildren();

  state.teams.forEach((team) => {
    const field = document.createElement("article");
    field.className = "team-field";
    field.dataset.teamId = team.id;
    field.style.setProperty("--team-color", team.color);
    makeDropZone(field, team.id);

    const title = document.createElement("div");
    title.className = "field-title";
    title.textContent = team.name;
    field.append(title);

    playersInTeam(team.id).forEach((player) => {
      field.append(createPlayerNode(player, true, team));
    });

    elements.fields.append(field);
  });
}

function createPlayerNode(player, onField, team = null) {
  const node = elements.template.content.firstElementChild.cloneNode(true);
  node.dataset.playerId = player.id;
  node.tabIndex = 0;
  node.classList.toggle("field-player", onField);
  node.classList.toggle("player-chip", !onField);
  node.style.setProperty("--team-color", team?.color || "#dfe3de");

  const avatar = node.querySelector(".avatar");
  if (player.image) avatar.style.backgroundImage = `url("${player.image}")`;
  node.querySelector(".player-name").textContent = player.name;
  const deleteButton = node.querySelector(".delete-player");
  deleteButton.draggable = false;
  deleteButton.setAttribute("aria-label", onField ? "החזר שחקן החוצה" : "מחק שחקן");
  deleteButton.title = onField ? "החזר החוצה" : "מחק";
  deleteButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  deleteButton.addEventListener("dragstart", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  deleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const currentPlayer = state.players.find((item) => item.id === player.id);
    if (!currentPlayer) return;

    if (currentPlayer.teamId) {
      currentPlayer.teamId = null;
    } else {
      state.players = state.players.filter((item) => item.id !== currentPlayer.id);
    }
    persist();
    render();
  });

  node.addEventListener("dragstart", (event) => {
    draggedPlayerId = player.id;
    dragMode = onField ? "field" : "bench";
    event.dataTransfer.setData("text/plain", player.id);
    node.classList.add("dragging");
  });

  node.addEventListener("dragend", () => {
    node.classList.remove("dragging");
    draggedPlayerId = null;
    dragMode = null;
  });

  if (onField) {
    node.style.left = `${player.x}%`;
    node.style.top = `${player.y}%`;
    node.addEventListener("pointerdown", (event) => startPointerDrag(event, node, player));
  }

  return node;
}

function makeDropZone(element, teamId) {
  if (dropZones.has(element)) return;
  dropZones.add(element);

  element.addEventListener("dragover", (event) => {
    event.preventDefault();
    element.classList.add("is-over");
  });

  element.addEventListener("dragleave", () => {
    element.classList.remove("is-over");
  });

  element.addEventListener("drop", (event) => {
    event.preventDefault();
    element.classList.remove("is-over");
    const playerId = event.dataTransfer.getData("text/plain") || draggedPlayerId;
    if (!playerId) return;
    movePlayerTo(playerId, teamId, event, element);
  });
}

function movePlayerTo(playerId, teamId, event, target) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return;

  if (teamId && player.teamId !== teamId && playersInTeam(teamId).length >= 5) {
    alert("בקבוצה יש כבר 5 שחקנים");
    return;
  }

  player.teamId = teamId;
  if (teamId) {
    const rect = target.getBoundingClientRect();
    player.x = clamp(((event.clientX - rect.left) / rect.width) * 100, 10, 90);
    player.y = clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 88);
    if (dragMode === "bench") arrangeTeam(teamId);
  }

  persist();
  render();
}

function startPointerDrag(event, node, player) {
  const field = node.closest(".team-field");
  if (!field) return;
  event.preventDefault();
  node.setPointerCapture(event.pointerId);

  const nodeRect = node.getBoundingClientRect();
  pointer = {
    id: event.pointerId,
    playerId: player.id,
    fieldId: field.dataset.teamId,
    offsetX: event.clientX - nodeRect.left,
    offsetY: event.clientY - nodeRect.top,
  };

  node.addEventListener("pointermove", handlePointerMove);
  node.addEventListener("pointerup", endPointerDrag, { once: true });
  node.addEventListener("pointercancel", endPointerDrag, { once: true });
}

function handlePointerMove(event) {
  if (event.pointerId !== pointer.id) return;

  const player = state.players.find((item) => item.id === pointer.playerId);
  const field = document.querySelector(`.team-field[data-team-id="${pointer.fieldId}"]`);
  if (!player || !field) return;

  const rect = field.getBoundingClientRect();
  player.x = clamp(((event.clientX - rect.left - pointer.offsetX + 59) / rect.width) * 100, 8, 92);
  player.y = clamp(((event.clientY - rect.top - pointer.offsetY + 59) / rect.height) * 100, 10, 90);

  const node = document.querySelector(`[data-player-id="${player.id}"]`);
  if (node) {
    node.style.left = `${player.x}%`;
    node.style.top = `${player.y}%`;
  }
}

function endPointerDrag(event) {
  const node = event.currentTarget;
  node.removeEventListener("pointermove", handlePointerMove);
  const player = state.players.find((item) => item.id === pointer.playerId);
  const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
  const targetField = dropTarget?.closest?.(".team-field");
  const targetBench = dropTarget?.closest?.("#bench");

  if (player && (targetBench || !targetField)) {
    player.teamId = null;
  } else if (player && targetField) {
    const targetTeamId = targetField.dataset.teamId;
    const isSameTeam = player.teamId === targetTeamId;
    if (!isSameTeam && playersInTeam(targetTeamId).length >= 5) {
      alert("בקבוצה יש כבר 5 שחקנים");
    } else {
      const rect = targetField.getBoundingClientRect();
      player.teamId = targetTeamId;
      player.x = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
      player.y = clamp(((event.clientY - rect.top) / rect.height) * 100, 10, 90);
    }
  }

  persist();
  pointer = { id: null, playerId: null, fieldId: null, offsetX: 0, offsetY: 0 };
  render();
}

function arrangeTeam(teamId) {
  playersInTeam(teamId).slice(0, 5).forEach((player, index) => {
    player.x = FORMATION[index].x;
    player.y = FORMATION[index].y;
  });
}

function autoArrangeAllPlayers() {
  const neededTeams = Math.max(1, Math.ceil(state.players.length / 5));
  while (state.teams.length < neededTeams) {
    const index = state.teams.length;
    state.teams.push({
      id: crypto.randomUUID(),
      name: `קבוצה ${index + 1}`,
      color: TEAM_COLORS[index % TEAM_COLORS.length],
    });
  }

  state.players.forEach((player, index) => {
    const team = state.teams[Math.floor(index / 5)];
    const position = FORMATION[index % 5];
    player.teamId = team.id;
    player.x = position.x;
    player.y = position.y;
  });
}

function playersInTeam(teamId) {
  return state.players.filter((player) => player.teamId === teamId);
}

function emptyState(text) {
  const p = document.createElement("p");
  p.className = "empty-state";
  p.textContent = text;
  return p;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
