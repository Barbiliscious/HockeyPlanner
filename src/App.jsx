import React, { useMemo, useState } from "react";

const MAX_PLAYERS = 16;

const SLOT_META = [
  { code: "GK", name: "Goalkeeper", group: "Defence" },
  { code: "RB", name: "Right Back", group: "Defence" },
  { code: "LB", name: "Left Back", group: "Defence" },
  { code: "RH", name: "Right Half", group: "Midfield" },
  { code: "CH", name: "Centre Half", group: "Midfield" },
  { code: "LH", name: "Left Half", group: "Midfield" },
  { code: "RI", name: "Right Inner", group: "Attack" },
  { code: "LI", name: "Left Inner", group: "Attack" },
  { code: "RW", name: "Right Wing", group: "Attack" },
  { code: "CF", name: "Centre Forward", group: "Attack" },
  { code: "LW", name: "Left Wing", group: "Attack" },
];

const FORMATIONS = {
  "2-3-2-3 (Default)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 150 },
    { displayCode: "RB", displayName: "Right Back", internalCode: "RB", x: 62.5, y: 122 },
    { displayCode: "LB", displayName: "Left Back", internalCode: "LB", x: 37.5, y: 122 },
    { displayCode: "RH", displayName: "Right Half", internalCode: "RH", x: 78, y: 102 },
    { displayCode: "CH", displayName: "Centre Half", internalCode: "CH", x: 50, y: 102 },
    { displayCode: "LH", displayName: "Left Half", internalCode: "LH", x: 22, y: 102 },
    { displayCode: "RI", displayName: "Right Inner", internalCode: "RI", x: 62.5, y: 74 },
    { displayCode: "LI", displayName: "Left Inner", internalCode: "LI", x: 37.5, y: 74 },
    { displayCode: "RW", displayName: "Right Wing", internalCode: "RW", x: 82, y: 50 },
    { displayCode: "CF", displayName: "Centre Forward", internalCode: "CF", x: 50, y: 50 },
    { displayCode: "LW", displayName: "Left Wing", internalCode: "LW", x: 18, y: 50 },
  ],
  "4-3-3 (Attack)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 145 },
    { displayCode: "RB", displayName: "Right Back", internalCode: "RB", x: 73, y: 120 },
    { displayCode: "CB-L", displayName: "Centre Back Left", internalCode: "LB", x: 42, y: 118 },
    { displayCode: "CB-R", displayName: "Centre Back Right", internalCode: "RH", x: 58, y: 118 },
    { displayCode: "LB", displayName: "Left Back", internalCode: "LH", x: 27, y: 120 },
    { displayCode: "RM", displayName: "Right Midfield", internalCode: "RW", x: 71, y: 85 },
    { displayCode: "CM", displayName: "Centre Midfield", internalCode: "CH", x: 50, y: 82 },
    { displayCode: "LM", displayName: "Left Midfield", internalCode: "LW", x: 29, y: 85 },
    { displayCode: "RW", displayName: "Right Wing", internalCode: "RI", x: 76, y: 32 },
    { displayCode: "CF", displayName: "Centre Forward", internalCode: "CF", x: 50, y: 28 },
    { displayCode: "LW", displayName: "Left Wing", internalCode: "LI", x: 24, y: 32 },
  ],
  "4-4-2 (Classic)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 145 },
    { displayCode: "RB", displayName: "Right Back", internalCode: "RB", x: 73, y: 120 },
    { displayCode: "CB-L", displayName: "Centre Back Left", internalCode: "LB", x: 42, y: 118 },
    { displayCode: "CB-R", displayName: "Centre Back Right", internalCode: "CH", x: 58, y: 118 },
    { displayCode: "LB", displayName: "Left Back", internalCode: "LH", x: 27, y: 120 },
    { displayCode: "RM", displayName: "Right Midfield", internalCode: "RH", x: 75, y: 82 },
    { displayCode: "CM-R", displayName: "Centre Midfield Right", internalCode: "RI", x: 58, y: 82 },
    { displayCode: "CM-L", displayName: "Centre Midfield Left", internalCode: "LI", x: 42, y: 82 },
    { displayCode: "LM", displayName: "Left Midfield", internalCode: "LW", x: 25, y: 82 },
    { displayCode: "ST-R", displayName: "Striker Right", internalCode: "RW", x: 60, y: 34 },
    { displayCode: "ST-L", displayName: "Striker Left", internalCode: "CF", x: 40, y: 34 },
  ],
  "3-4-3 (Wide)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 145 },
    { displayCode: "CB-R", displayName: "Centre Back Right", internalCode: "RB", x: 66, y: 118 },
    { displayCode: "CB-C", displayName: "Centre Back Centre", internalCode: "CH", x: 50, y: 122 },
    { displayCode: "CB-L", displayName: "Centre Back Left", internalCode: "LB", x: 34, y: 118 },
    { displayCode: "RM", displayName: "Right Midfield", internalCode: "RH", x: 76, y: 82 },
    { displayCode: "CM-R", displayName: "Centre Midfield Right", internalCode: "RI", x: 58, y: 82 },
    { displayCode: "CM-L", displayName: "Centre Midfield Left", internalCode: "LI", x: 42, y: 82 },
    { displayCode: "LM", displayName: "Left Midfield", internalCode: "LH", x: 24, y: 82 },
    { displayCode: "RW", displayName: "Right Wing", internalCode: "RW", x: 76, y: 30 },
    { displayCode: "CF", displayName: "Centre Forward", internalCode: "CF", x: 50, y: 28 },
    { displayCode: "LW", displayName: "Left Wing", internalCode: "LW", x: 24, y: 30 },
  ],
};

const FORMATION_NAMES = Object.keys(FORMATIONS);

const FACE_LEVELS = [
  { value: 3, emoji: "🤩", short: "Best", label: "Best fit", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  { value: 2, emoji: "🙂", short: "Good", label: "Good fit", color: "#3f8f52", bg: "#ecfdf5", border: "#bbf7d0" },
  { value: 1, emoji: "😐", short: "Emergency", label: "Emergency only", color: "#b45309", bg: "#ffedd5", border: "#fdba74" },
  { value: 0, emoji: "☹️", short: "Avoid", label: "Do not use", color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
];

const THEMES = {
  light: {
    page: "#f8fafc",
    panel: "#ffffff",
    panelAlt: "#f1f5f9",
    border: "#cbd5e1",
    text: "#0f172a",
    muted: "#475569",
    accent: "#2563eb",
    accentSoft: "#dbeafe",
    selection: "#dbeafe",
    fieldBg: "#d8dee7",
  },
  dark: {
    page: "#0f172a",
    panel: "#111827",
    panelAlt: "#1f2937",
    border: "#334155",
    text: "#f8fafc",
    muted: "#cbd5e1",
    accent: "#60a5fa",
    accentSoft: "#1e3a8a",
    selection: "#1d4ed8",
    fieldBg: "#1e293b",
  },
};

const scoreWeight = { 3: 100, 2: 55, 1: 8, 0: -1000 };

function clampName(n) {
  return n.trim().replace(/\s+/g, " ");
}

function nl(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pk(playerId, slotCode) {
  return `${playerId}__${slotCode}`;
}

function defaultPitch(formation) {
  const positions = {};
  FORMATIONS[formation].forEach((s) => {
    positions[s.internalCode] = { x: s.x, y: s.y };
  });
  return positions;
}

function defaultLayouts() {
  return Object.fromEntries(FORMATION_NAMES.map((name) => [name, defaultPitch(name)]));
}

function faceMeta(value) {
  return FACE_LEVELS.find((f) => f.value === value) || FACE_LEVELS[1];
}

function parseImportText(text) {
  const raw = text.trim();
  if (!raw) return { playersToAdd: [], prefUpdates: [] };

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const playersToAdd = [];
  const prefUpdates = [];

  const slotMap = {};
  SLOT_META.forEach((s) => {
    slotMap[nl(s.code)] = s.code;
    slotMap[nl(s.name)] = s.code;
  });

  const addPlayerIfMissing = (name) => {
    const clean = clampName(name);
    if (!clean) return null;
    if (!playersToAdd.some((p) => nl(p.name) === nl(clean))) {
      playersToAdd.push({ name: clean });
    }
    return clean;
  };

  const parsePositionsList = (value) =>
    String(value || "")
      .split(/[|;/]+/)
      .map((x) => slotMap[nl(x)])
      .filter(Boolean);

  const first = lines[0];
  if (first.includes(",") && /name/i.test(first)) {
    const headers = first.split(",").map((h) => nl(h));
    const idx = {
      name: headers.findIndex((h) => h === "name"),
      best: headers.findIndex((h) => h === "best"),
      good: headers.findIndex((h) => h === "good"),
      emergency: headers.findIndex((h) => h === "emergency"),
      avoid: headers.findIndex((h) => h === "avoid"),
    };

    lines.slice(1).forEach((line) => {
      const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const name = addPlayerIfMissing(cells[idx.name] || "");
      if (!name) return;
      [
        { level: 3, key: idx.best },
        { level: 2, key: idx.good },
        { level: 1, key: idx.emergency },
        { level: 0, key: idx.avoid },
      ].forEach(({ level, key }) => {
        parsePositionsList(cells[key]).forEach((slotCode) => {
          prefUpdates.push({ name, slotCode, value: level });
        });
      });
    });

    return { playersToAdd, prefUpdates };
  }

  lines.forEach((line) => {
    if (line.includes(",")) {
      const [namePart, ...rest] = line.split(",");
      const name = addPlayerIfMissing(namePart);
      if (!name) return;
      const roles = rest.map((r) => slotMap[nl(r)]).filter(Boolean);
      roles.forEach((slotCode, idx) => {
        prefUpdates.push({ name, slotCode, value: idx === 0 ? 3 : 2 });
      });
    } else {
      addPlayerIfMissing(line);
    }
  });

  return { playersToAdd, prefUpdates };
}

function encodeState(state) {
  try {
    return btoa(JSON.stringify(state));
  } catch {
    return null;
  }
}

function decodeState(code) {
  try {
    return JSON.parse(atob(code.trim()));
  } catch {
    return null;
  }
}

export default function FieldHockeyPositionPlannerV2() {
  const [themeMode, setThemeMode] = useState("light");
  const [tab, setTab] = useState("Squad");
  const [formation, setFormation] = useState(FORMATION_NAMES[0]);
  const [players, setPlayers] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [newPlayer, setNewPlayer] = useState("");
  const [bulkImport, setBulkImport] = useState("");
  const [preferences, setPreferences] = useState({});
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [lineup, setLineup] = useState({});
  const [lockedSlots, setLockedSlots] = useState({});
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [loadInput, setLoadInput] = useState("");
  const [pitchLayouts, setPitchLayouts] = useState(defaultLayouts());
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [markerSize, setMarkerSize] = useState(3.2);

  const t = THEMES[themeMode];
  const fSlots = FORMATIONS[formation];
  const pitchPos = pitchLayouts[formation];
  const assignedSet = useMemo(() => new Set(Object.values(lineup).filter(Boolean)), [lineup]);
  const benchPlayers = useMemo(() => players.filter((p) => !assignedSet.has(p.id)), [players, assignedSet]);
  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0] || null;

  const byId = (id) => players.find((p) => p.id === id) || null;
  const prefScore = (playerId, slotCode) => {
    const value = preferences[pk(playerId, slotCode)];
    return typeof value === "number" ? value : 1;
  };
  const isLocked = (slotCode) => lineup[slotCode] && lockedSlots[slotCode] === lineup[slotCode];
  const isSelected = (type, key) => selected?.type === type && selected.key === key;

  const slotAssignmentsByFace = useMemo(() => {
    if (!activePlayer) return { 3: [], 2: [], 1: [], 0: [] };
    const map = { 3: [], 2: [], 1: [], 0: [] };
    SLOT_META.forEach((slot) => {
      map[prefScore(activePlayer.id, slot.code)].push(slot);
    });
    return map;
  }, [activePlayer, preferences]);

  const lineupSummary = useMemo(() => {
    let best = 0;
    let good = 0;
    let emergency = 0;
    let avoid = 0;
    const warnings = [];

    SLOT_META.forEach((slot) => {
      const pid = lineup[slot.code];
      if (!pid) return;
      const sc = prefScore(pid, slot.code);
      if (sc === 3) best += 1;
      else if (sc === 2) good += 1;
      else if (sc === 1) emergency += 1;
      else avoid += 1;
    });

    if (emergency > 0) warnings.push(`${emergency} player${emergency > 1 ? "s" : ""} in emergency roles.`);
    if (avoid > 0) warnings.push(`${avoid} player${avoid > 1 ? "s" : ""} in avoid roles.`);

    SLOT_META.forEach((slot) => {
      const capable = players.filter((p) => prefScore(p.id, slot.code) >= 2).length;
      if (capable === 0) warnings.push(`No natural ${slot.name}.`);
    });

    return { best, good, emergency, avoid, warnings: [...new Set(warnings)].slice(0, 4) };
  }, [lineup, players, preferences]);

  const setPref = (playerId, slotCode, value) => {
    setPreferences((prev) => ({ ...prev, [pk(playerId, slotCode)]: value }));
  };

  const addPlayer = () => {
    const name = clampName(newPlayer);
    if (!name) return;
    if (players.length >= MAX_PLAYERS) return setMessage(`Maximum of ${MAX_PLAYERS} players reached.`);
    if (players.some((p) => nl(p.name) === nl(name))) return setMessage("That player is already in the squad.");

    const player = { id: nextId, name };
    setPlayers((prev) => [...prev, player]);
    setNextId((v) => v + 1);
    setNewPlayer("");
    setActivePlayerId((prev) => prev ?? player.id);
    setMessage(`${name} added.`);
  };

  const applyImport = () => {
    const { playersToAdd, prefUpdates } = parseImportText(bulkImport);
    if (!playersToAdd.length && !prefUpdates.length) return;

    const existingByName = new Map(players.map((p) => [nl(p.name), p.id]));
    const created = [];
    let next = nextId;

    playersToAdd.forEach((p) => {
      if (existingByName.has(nl(p.name))) return;
      if (players.length + created.length >= MAX_PLAYERS) return;
      created.push({ id: next, name: p.name });
      existingByName.set(nl(p.name), next);
      next += 1;
    });

    const mergedPlayers = [...players, ...created];
    const nextPrefs = { ...preferences };
    prefUpdates.forEach((u) => {
      const playerId = existingByName.get(nl(u.name));
      if (!playerId) return;
      nextPrefs[pk(playerId, u.slotCode)] = u.value;
    });

    setPlayers(mergedPlayers);
    setNextId(next);
    setPreferences(nextPrefs);
    setBulkImport("");
    setActivePlayerId((prev) => prev ?? mergedPlayers[0]?.id ?? null);
    setMessage(`Imported ${created.length} player${created.length === 1 ? "" : "s"} and updated ${prefUpdates.length} role preference${prefUpdates.length === 1 ? "" : "s"}.`);
  };

  const removePlayer = (id) => {
    const player = byId(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setPreferences((prev) => {
      const next = { ...prev };
      SLOT_META.forEach((slot) => delete next[pk(id, slot.code)]);
      return next;
    });
    setLineup((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((slotCode) => {
        if (next[slotCode] === id) next[slotCode] = null;
      });
      return next;
    });
    setLockedSlots((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((slotCode) => {
        if (next[slotCode] === id) delete next[slotCode];
      });
      return next;
    });
    setActivePlayerId((prev) => (prev === id ? null : prev));
    setSelected((prev) => (prev?.type === "bench" && prev.key === id ? null : prev));
    setMessage(`${player?.name || "Player"} removed.`);
  };

  const updatePitchPos = (slotCode, pos) => {
    setPitchLayouts((prev) => ({
      ...prev,
      [formation]: {
        ...prev[formation],
        [slotCode]: pos,
      },
    }));
  };

  const startDrag = (slotCode, e) => {
    e.preventDefault();
    e.stopPropagation();
    const point = e.touches ? e.touches[0] : e;
    setDragStart({ x: point.clientX, y: point.clientY, slotCode, moved: false });
    setDragging(slotCode);
  };

  const onPitchMove = (e) => {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = Math.abs(point.clientX - (dragStart?.x ?? point.clientX));
    const dy = Math.abs(point.clientY - (dragStart?.y ?? point.clientY));
    const moved = dx > 6 || dy > 6;
    if (dragStart && moved !== dragStart.moved) setDragStart((prev) => ({ ...prev, moved }));
    if (!moved) return;
    updatePitchPos(dragging, {
      x: Math.max(8, Math.min(92, ((point.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(12, Math.min(158, ((point.clientY - rect.top) / rect.height) * 170)),
    });
  };

  const endDrag = () => {
    setDragging(null);
    setDragStart(null);
  };

  const changeFormation = (next) => {
    setFormation(next);
    setSelected(null);
    setDragging(null);
  };

  const generateLineup = () => {
    const nextLineup = Object.fromEntries(SLOT_META.map((s) => [s.code, null]));
    const usedPlayers = new Set();
    const locked = new Set();

    Object.entries(lockedSlots).forEach(([slotCode, playerId]) => {
      if (players.some((p) => p.id === playerId)) {
        nextLineup[slotCode] = playerId;
        usedPlayers.add(playerId);
        locked.add(slotCode);
      }
    });

    const pairs = [];
    SLOT_META.forEach((slot) => {
      if (locked.has(slot.code)) return;
      players.forEach((player) => {
        if (usedPlayers.has(player.id)) return;
        pairs.push({
          slotCode: slot.code,
          playerId: player.id,
          score: scoreWeight[prefScore(player.id, slot.code)],
        });
      });
    });

    pairs.sort((a, b) => b.score - a.score);
    const usedSlots = new Set([...locked]);
    pairs.forEach((pair) => {
      if (usedSlots.has(pair.slotCode) || usedPlayers.has(pair.playerId)) return;
      usedSlots.add(pair.slotCode);
      usedPlayers.add(pair.playerId);
      nextLineup[pair.slotCode] = pair.playerId;
    });

    setLineup(nextLineup);
    setTab("Lineup");
    setSelected(null);
    setMessage("Best lineup generated.");
  };

  const handleSelect = (type, key) => {
    if (dragStart?.moved) return;

    if (selected?.type === type && selected.key === key) {
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected({ type, key });
      return;
    }

    if (selected.type === "bench" && type === "bench") {
      setSelected({ type, key });
      return;
    }

    const nextLineup = { ...lineup };
    const nextLocks = { ...lockedSlots };

    if (selected.type === "slot" && type === "slot") {
      const slotA = selected.key;
      const slotB = key;
      const a = nextLineup[slotA] || null;
      const b = nextLineup[slotB] || null;
      nextLineup[slotA] = b;
      nextLineup[slotB] = a;
      delete nextLocks[slotA];
      delete nextLocks[slotB];
    } else {
      const benchPid = selected.type === "bench" ? selected.key : key;
      const slotCode = selected.type === "slot" ? selected.key : key;
      nextLineup[slotCode] = benchPid;
      delete nextLocks[slotCode];
    }

    setLineup(nextLineup);
    setLockedSlots(nextLocks);
    setSelected(null);
  };

  const toggleLock = (slotCode) => {
    const pid = lineup[slotCode];
    if (!pid) return;
    setLockedSlots((prev) => {
      const next = { ...prev };
      if (next[slotCode] === pid) delete next[slotCode];
      else next[slotCode] = pid;
      return next;
    });
  };

  const resetPitch = () => {
    setPitchLayouts((prev) => ({ ...prev, [formation]: defaultPitch(formation) }));
    setMessage("Pitch positions reset for this formation.");
  };

  const clearLineup = () => {
    setLineup({});
    setLockedSlots({});
    setSelected(null);
  };

  const exportPreferencesCsv = () => {
    const rows = ["name,best,good,emergency,avoid"];
    players.forEach((player) => {
      const values = { 3: [], 2: [], 1: [], 0: [] };
      SLOT_META.forEach((slot) => values[prefScore(player.id, slot.code)].push(slot.code));
      rows.push([
        player.name,
        `"${values[3].join("|")}"`,
        `"${values[2].join("|")}"`,
        `"${values[1].join("|")}"`,
        `"${values[0].join("|")}"`,
      ].join(","));
    });
    return rows.join("\n");
  };

  const exportMatchdaySummary = () => {
    return fSlots
      .map((spot) => {
        const pid = lineup[spot.internalCode];
        const player = byId(pid);
        return `${spot.displayCode} - ${spot.displayName}: ${player ? player.name : "Empty"}`;
      })
      .join("\n");
  };

  const createShare = async () => {
    const state = { formation, players, nextId, preferences, lineup, lockedSlots, pitchLayouts };
    const code = encodeState(state);
    if (!code) return setMessage("Could not generate share code.");
    setShareCode(code);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setMessage("Share code copied to clipboard.");
      }
    } catch {
      setMessage("Share code generated.");
    }
  };

  const loadShare = () => {
    const state = decodeState(loadInput);
    if (!state) return setMessage("Invalid share code.");
    setFormation(state.formation || FORMATION_NAMES[0]);
    setPlayers(state.players || []);
    setNextId(state.nextId || 1);
    setPreferences(state.preferences || {});
    setLineup(state.lineup || {});
    setLockedSlots(state.lockedSlots || {});
    setPitchLayouts(state.pitchLayouts || defaultLayouts());
    setLoadInput("");
    setShareCode("");
    setActivePlayerId(state.players?.[0]?.id ?? null);
    setSelected(null);
    setMessage("State loaded.");
  };

  const shell = {
    minHeight: "100vh",
    background: t.page,
    color: t.text,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    padding: 16,
    boxSizing: "border-box",
  };

  const card = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 20,
    padding: 16,
    boxShadow: themeMode === "light" ? "0 12px 30px rgba(15,23,42,0.08)" : "0 12px 30px rgba(0,0,0,0.35)",
  };

  const input = {
    width: "100%",
    background: t.panelAlt,
    color: t.text,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  };

  const primaryBtn = {
    background: t.accent,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 700,
    cursor: "pointer",
  };

  const secondaryBtn = {
    background: t.panelAlt,
    color: t.text,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 700,
    cursor: "pointer",
  };

  const pill = (face) => ({
    background: face.bg,
    color: face.color,
    border: `1px solid ${face.border}`,
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  });

  const tabs = ["Squad", "Roles", "Lineup", "Share"];

  return (
    <div style={shell}>
      <div style={{ maxWidth: 1360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>Field Hockey Position Planner V2</div>
              <div style={{ color: t.muted, fontSize: 14, marginTop: 4 }}>
                Faster squad flow · Face-based roles · Smarter import/export · Better lineup UX
              </div>
            </div>
            <button style={secondaryBtn} onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}> 
              {themeMode === "light" ? "Dark mode" : "Light mode"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                style={{
                  ...secondaryBtn,
                  background: tab === item ? t.accentSoft : t.panelAlt,
                  border: `1px solid ${tab === item ? t.accent : t.border}`,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {message && (
            <div
              style={{
                marginTop: 12,
                background: t.accentSoft,
                border: `1px solid ${t.accent}`,
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: t.accent,
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{message}</span>
              <button
                style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontWeight: 700 }}
                onClick={() => setMessage("")}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {tab === "Squad" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 0.9fr) minmax(0, 1.1fr)", gap: 16 }}>
            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Build squad</div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  style={input}
                  value={newPlayer}
                  onChange={(e) => setNewPlayer(e.target.value)}
                  placeholder="Add player name"
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                />
                <button style={primaryBtn} onClick={addPlayer}>Add</button>
              </div>

              <div style={{ color: t.muted, fontSize: 13, marginBottom: 8 }}>
                Paste names, lines like <b>Name, GK, CH, RB</b>, or full CSV:
                <br />
                <span style={{ fontFamily: "monospace" }}>name,best,good,emergency,avoid</span>
              </div>

              <textarea
                style={{ ...input, minHeight: 180, resize: "vertical" }}
                value={bulkImport}
                onChange={(e) => setBulkImport(e.target.value)}
                placeholder={`Sam Taylor
Jordan Smith, CF, RW, RI
Alex Brown, CH, RH

name,best,good,emergency,avoid
Casey White,"LW|RW","CF","RI","GK"`}
              />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button style={primaryBtn} onClick={applyImport}>Import / apply</button>
                <button style={secondaryBtn} onClick={() => setBulkImport("")}>Clear</button>
              </div>

              <div style={{ marginTop: 12, color: t.muted, fontSize: 13 }}>
                {players.length}/{MAX_PLAYERS} players
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Squad cards</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {!players.length && <div style={{ color: t.muted }}>No players added yet.</div>}
                {players.map((player) => {
                  const best = SLOT_META.filter((slot) => prefScore(player.id, slot.code) === 3).map((slot) => slot.code);
                  const good = SLOT_META.filter((slot) => prefScore(player.id, slot.code) === 2).map((slot) => slot.code);
                  return (
                    <div
                      key={player.id}
                      style={{
                        background: activePlayerId === player.id ? t.selection : t.panelAlt,
                        border: `1px solid ${activePlayerId === player.id ? t.accent : t.border}`,
                        borderRadius: 16,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>{player.name}</div>
                        <button style={{ ...secondaryBtn, padding: "6px 10px" }} onClick={() => removePlayer(player.id)}>Remove</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={pill(faceMeta(3))}>{faceMeta(3).emoji} {best.slice(0, 3).join(" ") || "None set"}</div>
                        <div style={pill(faceMeta(2))}>{faceMeta(2).emoji} {good.slice(0, 3).join(" ") || "None set"}</div>
                      </div>
                      <button style={primaryBtn} onClick={() => { setActivePlayerId(player.id); setTab("Roles"); }}>
                        Edit roles
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "Roles" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 16 }}>
            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Players</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 70 * 8, overflowY: "auto" }}>
                {!players.length && <div style={{ color: t.muted }}>Add players first.</div>}
                {players.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => setActivePlayerId(player.id)}
                    style={{
                      background: activePlayerId === player.id ? t.selection : t.panelAlt,
                      border: `1px solid ${activePlayerId === player.id ? t.accent : t.border}`,
                      borderRadius: 14,
                      padding: 12,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {player.name}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <button style={secondaryBtn} onClick={() => setAdvancedMode((v) => !v)}>
                  {advancedMode ? "Hide advanced matrix" : "Show advanced matrix"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Roles for {activePlayer?.name || "—"}</div>
                    <div style={{ color: t.muted, fontSize: 13, marginTop: 4 }}>
                      Tap a face, then tap positions for fast assignment.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {FACE_LEVELS.map((face) => (
                      <div key={face.value} style={pill(face)}>{face.emoji} {face.short}</div>
                    ))}
                  </div>
                </div>

                {!activePlayer ? (
                  <div style={{ color: t.muted, marginTop: 12 }}>Add a player to start setting roles.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
                    {FACE_LEVELS.map((face) => (
                      <div key={face.value} style={{ background: t.panelAlt, border: `1px solid ${t.border}`, borderRadius: 16, padding: 14 }}>
                        <div style={{ ...pill(face), marginBottom: 10 }}>{face.emoji} {face.label}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {slotAssignmentsByFace[face.value].map((slot) => (
                            <button
                              key={slot.code}
                              style={{
                                background: face.bg,
                                color: face.color,
                                border: `1px solid ${face.border}`,
                                borderRadius: 999,
                                padding: "8px 10px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                const next = face.value === 3 ? 2 : face.value + 1;
                                setPref(activePlayer.id, slot.code, next > 3 ? 0 : next);
                              }}
                              title="Tap to cycle level"
                            >
                              {slot.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {advancedMode && activePlayer && (
                <div style={card}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Advanced role matrix</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    {SLOT_META.map((slot) => {
                      const face = faceMeta(prefScore(activePlayer.id, slot.code));
                      return (
                        <div key={slot.code} style={{ background: t.panelAlt, border: `1px solid ${t.border}`, borderRadius: 14, padding: 12 }}>
                          <div style={{ fontWeight: 700 }}>{slot.name}</div>
                          <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{slot.code} • {slot.group}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                            {FACE_LEVELS.map((opt) => (
                              <button
                                key={opt.value}
                                style={{
                                  background: prefScore(activePlayer.id, slot.code) === opt.value ? opt.bg : t.panel,
                                  color: opt.color,
                                  border: `1px solid ${prefScore(activePlayer.id, slot.code) === opt.value ? opt.border : t.border}`,
                                  borderRadius: 10,
                                  padding: "8px 9px",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                }}
                                onClick={() => setPref(activePlayer.id, slot.code, opt.value)}
                              >
                                {opt.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "Lineup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Lineup controls</div>
                  <div style={{ color: t.muted, fontSize: 13, marginTop: 4 }}>
                    Generate, swap, lock, drag, and review warnings.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={primaryBtn} onClick={generateLineup}>Generate best lineup</button>
                  <button style={secondaryBtn} onClick={clearLineup}>Clear lineup</button>
                  <button style={secondaryBtn} onClick={resetPitch}>Reset pitch</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                {FORMATION_NAMES.map((name) => (
                  <button
                    key={name}
                    style={{
                      ...secondaryBtn,
                      background: formation === name ? t.accentSoft : t.panelAlt,
                      border: `1px solid ${formation === name ? t.accent : t.border}`,
                    }}
                    onClick={() => changeFormation(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginTop: 14 }}>
                {[
                  { label: "Best", value: lineupSummary.best, face: faceMeta(3) },
                  { label: "Good", value: lineupSummary.good, face: faceMeta(2) },
                  { label: "Emergency", value: lineupSummary.emergency, face: faceMeta(1) },
                  { label: "Avoid", value: lineupSummary.avoid, face: faceMeta(0) },
                ].map((tile) => (
                  <div key={tile.label} style={{ background: tile.face.bg, border: `1px solid ${tile.face.border}`, borderRadius: 14, padding: 14 }}>
                    <div style={{ color: tile.face.color, fontSize: 12, fontWeight: 700 }}>{tile.face.emoji} {tile.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{tile.value}</div>
                  </div>
                ))}
              </div>

              {!!lineupSummary.warnings.length && (
                <div style={{ marginTop: 14, background: t.panelAlt, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Lineup warnings</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {lineupSummary.warnings.map((warning) => <div key={warning} style={{ color: t.muted, fontSize: 13 }}>• {warning}</div>)}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: 16 }}>
              <div style={card}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Pitch view</div>
                <div style={{ background: t.fieldBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 4 }}>
                  <svg
                    viewBox="0 0 100 170"
                    style={{ width: "100%", display: "block", touchAction: "none", aspectRatio: "1/1.7", minHeight: 560, maxHeight: "calc(100vh - 180px)" }}
                    onMouseMove={onPitchMove}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchMove={onPitchMove}
                    onTouchEnd={endDrag}
                  >
                    <rect x="0" y="0" width="100" height="170" fill="#1A56DB" />
                    <rect x="1.5" y="4.4" width="97" height="161.2" rx="1" fill="#2E7D32" stroke="#FFF" strokeWidth="1.2" />
                    {[4.4, 36.64, 68.88, 101.12, 133.36].map((y) => <rect key={y} x="1.5" y={y} width="97" height="16.12" fill="rgba(0,0,0,0.06)" />)}
                    <line x1="1.5" y1="44.8" x2="98.5" y2="44.8" stroke="#FFF" strokeWidth="1" />
                    <line x1="1.5" y1="85" x2="98.5" y2="85" stroke="#FFF" strokeWidth="1" />
                    <line x1="1.5" y1="125.2" x2="98.5" y2="125.2" stroke="#FFF" strokeWidth="1" />
                    <path d="M 20.97 4.4 A 25.8 25.8 0 0 0 46.77 30.2 L 53.23 30.2 A 25.8 25.8 0 0 0 79.03 4.4" fill="rgba(255,255,255,0.05)" stroke="#FFF" strokeWidth="1.2" />
                    <path d="M 20.97 165.6 A 25.8 25.8 0 0 1 46.77 139.8 L 53.23 139.8 A 25.8 25.8 0 0 1 79.03 165.6" fill="rgba(255,255,255,0.05)" stroke="#FFF" strokeWidth="1.2" />

                    {fSlots.map((spot) => {
                      const pos = pitchPos[spot.internalCode] || { x: spot.x, y: spot.y };
                      const pid = lineup[spot.internalCode];
                      const player = byId(pid);
                      const face = player ? faceMeta(prefScore(player.id, spot.internalCode)) : null;
                      const selectedSlot = isSelected("slot", spot.internalCode);
                      const locked = isLocked(spot.internalCode);
                      return (
                        <g key={spot.displayCode + spot.internalCode} style={{ cursor: dragging === spot.internalCode ? "grabbing" : "grab" }}>
                          {locked && <circle cx={pos.x} cy={pos.y} r={markerSize + 2.3} fill="none" stroke="#fbbf24" strokeWidth="1.3" />}
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={markerSize}
                            fill={selectedSlot ? t.accent : "#a855f7"}
                            stroke={selectedSlot ? "#1e40af" : locked ? "#fbbf24" : "#6b21a8"}
                            strokeWidth={selectedSlot ? 1.7 : 1.1}
                            onClick={() => handleSelect("slot", spot.internalCode)}
                            onMouseDown={(e) => startDrag(spot.internalCode, e)}
                            onTouchStart={(e) => startDrag(spot.internalCode, e)}
                          />
                          <text x={pos.x} y={pos.y + 0.7} textAnchor="middle" fontSize="2" fontWeight="700" fill="#fff" pointerEvents="none">{spot.displayCode}</text>
                          <text x={pos.x} y={pos.y + 6.4} textAnchor="middle" fontSize={player ? "3.1" : "2.5"} fontWeight={player ? "800" : "500"} fill="#000" pointerEvents="none">{player ? player.name : spot.displayName}</text>
                          {face && <text x={pos.x} y={pos.y - 4.8} textAnchor="middle" fontSize="3" pointerEvents="none">{face.emoji}</text>}
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "block", fontSize: 13, color: t.muted, marginBottom: 6 }}>Marker size: {markerSize.toFixed(1)}</label>
                  <input type="range" min="2.2" max="4.2" step="0.1" value={markerSize} onChange={(e) => setMarkerSize(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={card}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Bench / subs</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {!benchPlayers.length && <div style={{ color: t.muted }}>No bench players.</div>}
                    {benchPlayers.map((player) => (
                      <div key={player.id} onClick={() => handleSelect("bench", player.id)} style={{ background: isSelected("bench", player.id) ? t.selection : t.panelAlt, border: `1px solid ${isSelected("bench", player.id) ? t.accent : t.border}`, borderRadius: 14, padding: 12, cursor: "pointer", fontWeight: 700 }}>
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={card}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Starting XI</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
                    {fSlots.map((spot) => {
                      const pid = lineup[spot.internalCode];
                      const player = byId(pid);
                      const face = player ? faceMeta(prefScore(player.id, spot.internalCode)) : null;
                      const locked = isLocked(spot.internalCode);
                      return (
                        <div key={spot.displayCode + spot.internalCode} onClick={() => handleSelect("slot", spot.internalCode)} style={{ background: isSelected("slot", spot.internalCode) ? t.selection : t.panelAlt, border: `1px solid ${locked ? "#f59e0b" : isSelected("slot", spot.internalCode) ? t.accent : t.border}`, borderRadius: 14, padding: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: t.muted, fontWeight: 700 }}>{spot.displayCode} • {spot.displayName}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{player ? player.name : "— Empty —"}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ background: face ? face.bg : t.panel, color: face ? face.color : t.text, border: `1px solid ${face ? face.border : t.border}`, borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 700 }}>
                              {face ? `${face.emoji} ${face.short}` : "Empty"}
                            </div>
                            <button style={{ ...secondaryBtn, padding: "8px 10px", borderColor: locked ? "#f59e0b" : t.border }} onClick={(e) => { e.stopPropagation(); toggleLock(spot.internalCode); }}>
                              {locked ? "🔒" : "🔓"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Share" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Export tools</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea readOnly value={exportPreferencesCsv()} style={{ ...input, minHeight: 180, fontFamily: "monospace", fontSize: 12 }} />
                <textarea readOnly value={exportMatchdaySummary()} style={{ ...input, minHeight: 180, fontFamily: "monospace", fontSize: 12 }} />
                <button style={primaryBtn} onClick={createShare}>Generate share code</button>
                {!!shareCode && <textarea readOnly value={shareCode} style={{ ...input, minHeight: 140, fontFamily: "monospace", fontSize: 11 }} onClick={(e) => e.target.select()} />}
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Load from share code</div>
              <textarea value={loadInput} onChange={(e) => setLoadInput(e.target.value)} placeholder="Paste a share code here..." style={{ ...input, minHeight: 220, fontFamily: "monospace", fontSize: 11 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={primaryBtn} onClick={loadShare}>Load state</button>
                <button style={secondaryBtn} onClick={() => setLoadInput("")}>Clear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
