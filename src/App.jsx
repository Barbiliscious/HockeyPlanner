import React, { useEffect, useMemo, useRef, useState } from "react";
import { SLOT_META, FORMATIONS, FORMATION_NAMES, defaultLayouts, defaultPitch } from "./data/positionModel";
import { PREF_LEVELS, scoreWeight, prefMeta } from "./data/preferenceModel";
import { pk, parseSpreadsheetData, exportToExcel, encodeState, decodeState, exportMatchdaySummary, parseMatchdaySummary } from "./utils/importExport";
import { getLineupSummary } from "./utils/lineupUtils";
import * as XLSX from 'xlsx';

const MAX_PLAYERS = 16;

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

export default function FieldHockeyPositionPlannerV2() {
  const [themeMode, setThemeMode] = useState("dark");
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
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);
  const [message, setMessage] = useState("");
  const [loadInput, setLoadInput] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [pitchLayouts, setPitchLayouts] = useState(defaultLayouts());
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [markerSize, setMarkerSize] = useState(3.2);
  const [positionViewOpen, setPositionViewOpen] = useState(false);
  const [positionViewShowAll, setPositionViewShowAll] = useState(false);
  const [positionGuideOpen, setPositionGuideOpen] = useState(false);
  const [slotMenu, setSlotMenu] = useState(null);

  const fileInputRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const pitchWrapRef = useRef(null);

  const t = THEMES[themeMode];
  const fSlots = FORMATIONS[formation];
  const pitchPos = pitchLayouts[formation];
  const assignedSet = useMemo(() => new Set(Object.values(lineup).filter(Boolean)), [lineup]);
  const benchPlayers = useMemo(() => players.filter((p) => !assignedSet.has(p.id)), [players, assignedSet]);
  const activePlayer = players.find((p) => p.id === activePlayerId) || null;

  const byId = (id) => players.find((p) => p.id === id) || null;
  const prefScore = (playerId, slotCode) => {
    const value = preferences[pk(playerId, slotCode)];
    return typeof value === "number" ? value : 1;
  };
  const prefValue = (playerId, slotCode) => preferences[pk(playerId, slotCode)];
  const isLocked = (slotCode) => lineup[slotCode] && lockedSlots[slotCode] === lineup[slotCode];
  const isSelected = (type, key) => selected?.type === type && selected.key === key;
  const selectedBenchId = selected?.type === "bench" ? selected.key : null;

  const preferenceRingColor = (pref) => {
    if (typeof pref === "number") return prefMeta(pref).bg;
    return "#6B7280";
  };

  const prefIconProps = { size: 18, strokeWidth: 3, fill: "currentColor" };

  const slotAssignmentsByFace = useMemo(() => {
    if (!activePlayer) return { 3: [], 2: [], 1: [], 0: [] };
    const map = { 3: [], 2: [], 1: [], 0: [] };
    SLOT_META.forEach((slot) => {
      map[prefScore(activePlayer.id, slot.code)].push(slot);
    });
    return map;
  }, [activePlayer, preferences]);

  const lineupSummary = useMemo(() => getLineupSummary(lineup, players, prefScore), [lineup, players, preferences]);
  const generatedSummary = useMemo(
    () => exportMatchdaySummary(formation, fSlots, lineup, byId, benchPlayers),
    [formation, fSlots, lineup, players, benchPlayers]
  );

  const buildShareState = () => ({ formation, players, nextId, preferences, lineup, lockedSlots, pitchLayouts });

  const applyLoadedState = (state, successMessage = "State loaded.") => {
    setFormation(state.formation || FORMATION_NAMES[0]);
    setPlayers(state.players || []);
    setNextId(state.nextId || 1);
    setPreferences(state.preferences || {});
    setLineup(state.lineup || {});
    setLockedSlots(state.lockedSlots || {});
    setPitchLayouts(state.pitchLayouts || defaultLayouts());
    setLoadInput("");
    setActivePlayerId(null);
    setSelected(null);
    setMessage(successMessage);
  };

  const showShareNotice = (text) => {
    setShareNotice(text);
    window.setTimeout(() => setShareNotice(""), 2000);
  };

  useEffect(() => {
    const closeMenus = () => {
      setSlotMenu(null);
      setSelected((prev) => (prev?.type === "bench" ? null : prev));
    };
    window.addEventListener("pointerdown", closeMenus);
    return () => window.removeEventListener("pointerdown", closeMenus);
  }, []);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    setSummaryText(generatedSummary);
  }, [generatedSummary]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("state");
    if (!code) return;

    const isReadOnlyLink = params.get("view") === "readonly";
    const state = decodeState(code);
    if (state) {
      applyLoadedState(state, isReadOnlyLink ? "" : "State loaded from link.");
      if (isReadOnlyLink) setReadOnlyMode(true);
    } else {
      setMessage(isReadOnlyLink ? "Invalid view-only link." : "Invalid share link.");
    }

    params.delete("view");
    params.delete("state");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const setPref = (playerId, slotCode, value) => {
    setPreferences((prev) => ({ ...prev, [pk(playerId, slotCode)]: value }));
  };

  const addPlayer = () => {
    const name = newPlayer.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return setMessage("That player is already in the squad.");

    const player = { id: nextId, name };
    setPlayers((prev) => [...prev, player]);
    setNextId((v) => v + 1);
    setNewPlayer("");
    setActivePlayerId(player.id);
    setMessage(players.length >= MAX_PLAYERS ? `${name} added. Squad is over the recommended ${MAX_PLAYERS}-player limit.` : `${name} added.`);

    // Append the new player as a row in the paste table
    setBulkImport((prev) => {
      const header = ["Player", ...SLOT_META.map(s => s.displayCode)].join("\t");
      const newRow = [name, ...SLOT_META.map(() => "")].join("\t");
      if (!prev.trim()) return `${header}\n${newRow}`;
      return `${prev.trimEnd()}\n${newRow}`;
    });
  };

  const applySpreadsheetData = (aoa) => {
    const { playersToAdd, prefUpdates, stats } = parseSpreadsheetData(aoa, players);
    
    if (!playersToAdd.length && !prefUpdates.length) {
      return setMessage("No valid data found to import.");
    }

    const existingByName = new Map(players.map((p) => [p.name.toLowerCase().replace(/[^a-z0-9]+/g, ""), p.id]));
    let created = [];
    let next = nextId;

    playersToAdd.forEach((p) => {
      const cleanName = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (existingByName.has(cleanName)) return;
      created.push({ id: next, name: p.name });
      existingByName.set(cleanName, next);
      next += 1;
    });

    const mergedPlayers = [...players, ...created];
    const nextPrefs = { ...preferences };
    prefUpdates.forEach((u) => {
      const cleanName = u.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
      const playerId = existingByName.get(cleanName);
      if (!playerId) return;
      nextPrefs[pk(playerId, u.slotCode)] = u.value;
    });

    setPlayers(mergedPlayers);
    setNextId(next);
    setPreferences(nextPrefs);
    setActivePlayerId((prev) => prev ?? mergedPlayers[0]?.id ?? null);
    
    let msg = `Import complete: ${stats.created} created, ${stats.matched} matched, ${stats.updated} preferences updated. Skipped ${stats.skipped} invalid/empty rows.`;
    if (stats.errors.length) {
      msg += ` Errors: ${stats.errors.join(" ")}`;
    }
    setMessage(msg);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 });
        applySpreadsheetData(aoa);
      } catch (err) {
        setMessage("Error reading Excel file. Ensure it is a valid .xlsx file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // reset
  };

  const handlePaste = () => {
    if (!bulkImport.trim()) return;
    const rows = bulkImport.trim().split(/\r?\n/);
    // Tab delimited support
    const aoa = rows.map(r => r.split('\t'));
    applySpreadsheetData(aoa);
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
    if (moved && longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (dragStart && moved !== dragStart.moved) setDragStart((prev) => ({ ...prev, moved }));
    if (!moved) return;
    updatePitchPos(dragging, {
      x: Math.max(8, Math.min(92, ((point.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(12, Math.min(158, ((point.clientY - rect.top) / rect.height) * 170)),
    });
  };

  const endDrag = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setDragging(null);
    setDragStart(null);
  };

  const changeFormation = (next) => {
    setFormation(next);
    setSelected(null);
    setDragging(null);
  };

  const playerCountLabel = () => {
    if (players.length <= MAX_PLAYERS) return `${players.length} players`;
    return `${players.length} players — ${players.length - MAX_PLAYERS} over squad limit`;
  };

  const toggleActivePlayer = (playerId) => {
    setActivePlayerId((prev) => (prev === playerId ? null : playerId));
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

  const unassignSlot = (slotCode) => {
    setLineup((prev) => ({ ...prev, [slotCode]: null }));
    setLockedSlots((prev) => {
      const next = { ...prev };
      delete next[slotCode];
      return next;
    });
    setSlotMenu(null);
  };

  const openSlotMenu = (slotCode, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lineup[slotCode]) return;
    const wrapperRect = pitchWrapRef.current?.getBoundingClientRect();
    setSlotMenu({
      slotCode,
      left: (e.clientX ?? 0) - (wrapperRect?.left ?? 0),
      top: (e.clientY ?? 0) - (wrapperRect?.top ?? 0),
    });
  };

  const handleSlotTouchStart = (slotCode, e) => {
    startDrag(slotCode, e);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!dragStart?.moved && lineup[slotCode]) {
        const touch = e.touches?.[0];
        if (touch) {
          openSlotMenu(slotCode, {
            preventDefault: () => {},
            stopPropagation: () => {},
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
        }
      }
    }, 500);
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

  const copyText = async (text, notice) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showShareNotice(notice);
      } else {
        setMessage("Clipboard is not available in this browser.");
      }
    } catch {
      setMessage("Could not copy to clipboard.");
    }
  };

  const copySummary = () => {
    copyText(summaryText, "Copied!");
  };

  const copyCode = () => {
    const code = encodeState(buildShareState());
    if (!code) return setMessage("Could not generate share code.");
    copyText(code, "Copied!");
  };

  const copyLink = () => {
    const code = encodeState(buildShareState());
    if (!code) return setMessage("Could not generate share link.");
    const url = new URL(`${window.location.origin}${window.location.pathname}`);
    url.searchParams.set("state", code);
    copyText(url.toString(), "Link copied!");
  };

  const copyReadOnlyLink = () => {
    const code = encodeState(buildShareState());
    if (!code) return setMessage("Could not generate view-only link.");
    const url = new URL(`${window.location.origin}${window.location.pathname}`);
    url.searchParams.set("view", "readonly");
    url.searchParams.set("state", code);
    copyText(url.toString(), "View-only link copied!");
  };

  const loadSummary = () => {
    const parsed = parseMatchdaySummary(summaryText, players);
    if (!parsed) return setMessage("Could not load — summary format not recognised.");

    setFormation(parsed.formation);
    setLineup(parsed.lineup);
    setLockedSlots((prev) => {
      const next = { ...prev };
      FORMATIONS[parsed.formation].forEach((spot) => delete next[spot.internalCode]);
      return next;
    });
    setSelected(null);
    setMessage("Summary loaded.");
  };

  const loadShare = () => {
    const state = decodeState(loadInput);
    if (!state) return setMessage("Invalid share code.");
    applyLoadedState(state);
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

  if (readOnlyMode) {
    const rt = THEMES.dark;
    const readOnlyShell = {
      minHeight: "100vh",
      background: rt.page,
      color: rt.text,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      padding: 16,
      boxSizing: "border-box",
    };
    const readOnlyCard = {
      background: rt.panel,
      border: `1px solid ${rt.border}`,
      borderRadius: 14,
      padding: 16,
      boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    };

    return (
      <div style={readOnlyShell}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Hockey Position Planner V2</div>
            <div style={{ color: rt.muted, fontSize: 14, fontWeight: 700 }}>Formation: {formation}</div>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, 0.85fr)", gap: 16 }}>
            <div style={readOnlyCard}>
              <svg viewBox="0 0 100 170" style={{ width: "100%", display: "block", aspectRatio: "1 / 1.7", maxWidth: 520, margin: "0 auto" }}>
                <rect x="0" y="0" width="100" height="170" fill="#1A56DB" />
                <rect x="3" y="3" width="94" height="164" rx="1" fill="#2E7D32" stroke="#FFF" strokeWidth="1.2" />
                {[3, 35.8, 68.6, 101.4, 134.2].map((y) => <rect key={y} x="3" y={y} width="94" height="16.4" fill="rgba(0,0,0,0.06)" />)}
                <line x1="3" y1="44" x2="97" y2="44" stroke="#FFF" strokeWidth="1" />
                <line x1="3" y1="85" x2="97" y2="85" stroke="#FFF" strokeWidth="1" />
                <line x1="3" y1="126" x2="97" y2="126" stroke="#FFF" strokeWidth="1" />
                <path d="M 22 3 A 25 25 0 0 0 47 28 L 53 28 A 25 25 0 0 0 78 3" fill="rgba(255,255,255,0.05)" stroke="#FFF" strokeWidth="1.2" />
                <path d="M 22 167 A 25 25 0 0 1 47 142 L 53 142 A 25 25 0 0 1 78 167" fill="rgba(255,255,255,0.05)" stroke="#FFF" strokeWidth="1.2" />

                {fSlots.map((spot) => {
                  const pos = pitchPos[spot.internalCode] || { x: spot.x, y: spot.y };
                  const pid = lineup[spot.internalCode];
                  const player = byId(pid);
                  const locked = isLocked(spot.internalCode);
                  const playerPrefValue = player ? prefValue(player.id, spot.internalCode) : null;
                  const ringColor = locked ? "#EAB308" : preferenceRingColor(typeof playerPrefValue === "number" ? playerPrefValue : null);
                  return (
                    <g key={`readonly-${spot.displayCode}-${spot.internalCode}`}>
                      <circle cx={pos.x} cy={pos.y} r={markerSize} fill="#a855f7" stroke={ringColor} strokeWidth="1.2" />
                      <text x={pos.x} y={pos.y + 0.7} textAnchor="middle" fontSize="2" fontWeight="700" fill="#fff" pointerEvents="none">{spot.displayCode}</text>
                      <text x={pos.x} y={pos.y + 8.2} textAnchor="middle" fontSize={player ? "3.1" : "2.5"} fontWeight={player ? "800" : "500"} fill="#000" pointerEvents="none">{player ? player.name : spot.displayName}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={readOnlyCard}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Starting 11</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {fSlots.map((spot) => {
                    const player = byId(lineup[spot.internalCode]);
                    return (
                      <div key={`readonly-list-${spot.displayCode}-${spot.internalCode}`} style={{ background: rt.panelAlt, border: `1px solid ${rt.border}`, borderRadius: 10, padding: 10 }}>
                        <div style={{ color: rt.muted, fontSize: 12, fontWeight: 700 }}>{spot.displayCode} • {spot.displayName}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{player ? player.name : "— Empty —"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={readOnlyCard}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Substitutes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {benchPlayers.length ? benchPlayers.map((player) => (
                    <div key={`readonly-sub-${player.id}`} style={{ background: rt.panelAlt, border: `1px solid ${rt.border}`, borderRadius: 10, padding: 10, fontWeight: 700 }}>
                      {player.name}
                    </div>
                  )) : <div style={{ color: rt.muted }}>None</div>}
                </div>
              </div>
            </div>
          </div>

          <footer style={{ color: rt.muted, fontSize: 12 }}>View only — generated by Hockey Position Planner V2</footer>
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={{ maxWidth: 1360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>Hockey Position Planner V2</div>
              <div style={{ color: t.muted, fontSize: 14, marginTop: 4 }}>
                Smart squad planning for field hockey coaches.
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
          <div onClick={() => setActivePlayerId(null)} style={{ display: "grid", gridTemplateColumns: "minmax(340px, 0.9fr) minmax(0, 1.1fr)", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={card} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Build squad manually</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={input}
                    value={newPlayer}
                    onChange={(e) => setNewPlayer(e.target.value)}
                    placeholder="Add player name"
                    onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  />
                  <button style={primaryBtn} onClick={addPlayer}>Add</button>
                </div>
                <div style={{ marginTop: 12, color: t.muted, fontSize: 13 }}>
                  {playerCountLabel()}
                </div>
              </div>

              <div style={card} onClick={(e) => e.stopPropagation()}>
                <button
                  style={{ ...secondaryBtn, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setPositionGuideOpen((prev) => !prev)}
                >
                  <span>Position code guide</span>
                  <span>{positionGuideOpen ? "Hide position guide ▲" : "Show position guide ▼"}</span>
                </button>
                {positionGuideOpen && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px 14px", marginTop: 12 }}>
                    {SLOT_META.map((slot) => (
                      <div key={slot.code} style={{ display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 800 }}>{slot.code}</span>
                        <span style={{ color: t.muted }}>{slot.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={card} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Spreadsheet Workflow</div>
                
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <button style={secondaryBtn} onClick={() => exportToExcel(players, "blank")}>Download Blank Template</button>
                  <button style={secondaryBtn} onClick={() => exportToExcel(players, "current")}>Download Current Squad</button>
                  <button style={primaryBtn} onClick={() => fileInputRef.current.click()}>Import Template</button>
                  <input type="file" accept=".xlsx,.csv" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileUpload} />
                </div>

                <div style={{ marginBottom: 16, background: t.panelAlt, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Spreadsheet Legend (0-3 values)</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {PREF_LEVELS.map(l => (
                      <div key={l.value} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontWeight: 800 }}>{l.value}</span> = {l.short}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Or Paste Table</div>
                <div style={{ color: t.muted, fontSize: 13, marginBottom: 8 }}>
                  Copy directly from Excel/Sheets and paste here. Include the header row.
                </div>
                <textarea
                  style={{ ...input, minHeight: 120, resize: "vertical" }}
                  value={bulkImport}
                  onChange={(e) => setBulkImport(e.target.value)}
                  placeholder={`Player\tGK\tFB-L\tFB-R\tHB-L\nSam\t0\t3\t2\t1`}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <button style={primaryBtn} onClick={handlePaste}>Apply Pasted Data</button>
                  <button style={secondaryBtn} onClick={() => setBulkImport("")}>Clear</button>
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Squad cards</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {PREF_LEVELS.map((face) => (
                  <div key={`squad-legend-${face.value}`} style={pill(face)}>
                    <face.Icon {...prefIconProps} /> {face.short}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {!players.length && <div style={{ color: t.muted }}>No players added yet.</div>}
                {players.map((player, index) => {
                  return (
                    <div
                      key={player.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActivePlayer(player.id);
                      }}
                      style={{
                        outline: index >= MAX_PLAYERS ? "2px solid #DC2626" : "none",
                        outlineOffset: 2,
                        background: activePlayerId === player.id ? t.selection : t.panelAlt,
                        border: `1px solid ${activePlayerId === player.id ? t.accent : t.border}`,
                        borderRadius: 16,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>{player.name}</div>
                        <button style={{ ...secondaryBtn, padding: "6px 10px" }} onClick={(e) => { e.stopPropagation(); removePlayer(player.id); }}>Remove</button>
                      </div>
                      {/* Show all 4 preference levels with their colours and icons */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {PREF_LEVELS.map((face) => {
                          const positions = SLOT_META
                            .filter((slot) => prefScore(player.id, slot.code) === face.value)
                            .map((slot) => slot.code);
                          if (!positions.length) return null;
                          return positions.map((code) => (
                            <div key={`${face.value}-${code}`} style={pill(face)}>
                              <face.Icon {...prefIconProps} /> {code}
                            </div>
                          ));
                        })}
                      </div>
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
                    onClick={() => toggleActivePlayer(player.id)}
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
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Roles for {activePlayer?.name || "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PREF_LEVELS.map((face) => (
                      <div key={face.value} style={pill(face)}><face.Icon {...prefIconProps} /> {face.short}</div>
                    ))}
                  </div>
                </div>

                {!activePlayer ? (
                  <div style={{ color: t.muted, marginTop: 12 }}>Add a player to start setting roles.</div>
                ) : null}
              </div>

              {activePlayer && (
                <div style={card}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Position roles</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    {SLOT_META.map((slot) => {
                      const face = prefMeta(prefScore(activePlayer.id, slot.code));
                      return (
                        <div key={slot.code} style={{ background: t.panelAlt, border: `1px solid ${t.border}`, borderRadius: 14, padding: 12 }}>
                          <div style={{ fontWeight: 700 }}>{slot.name}</div>
                          <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{slot.code} • {slot.group}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                            {PREF_LEVELS.map((opt) => (
                              <button
                                key={opt.value}
                                style={{
                                  background: prefScore(activePlayer.id, slot.code) === opt.value ? opt.bg : t.panel,
                                  color: prefScore(activePlayer.id, slot.code) === opt.value ? opt.color : t.text,
                                  border: `1px solid ${prefScore(activePlayer.id, slot.code) === opt.value ? opt.border : t.border}`,
                                  borderRadius: 10,
                                  padding: "8px 9px",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                }}
                                onClick={() => setPref(activePlayer.id, slot.code, opt.value)}
                              >
                                <opt.Icon {...prefIconProps} />
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
                      flex: isMobile ? "1 1 calc(50% - 8px)" : "0 0 auto",
                      background: formation === name ? t.accentSoft : t.panelAlt,
                      border: `1px solid ${formation === name ? t.accent : t.border}`,
                    }}
                    onClick={() => changeFormation(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginTop: 14 }}>
                {[
                  { label: "Experienced", value: lineupSummary.experienced, face: prefMeta(3) },
                  { label: "Capable", value: lineupSummary.capable, face: prefMeta(2) },
                  { label: "Limited", value: lineupSummary.limited, face: prefMeta(1) },
                  { label: "Uncomfortable", value: lineupSummary.uncomfortable, face: prefMeta(0) },
                ].map((tile) => (
                  <div key={tile.label} style={{ background: tile.face.bg, border: `1px solid ${tile.face.border}`, borderRadius: 14, padding: 14 }}>
                    <div style={{ color: tile.face.color, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                      <tile.face.Icon {...prefIconProps} /> {tile.label}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: tile.face.color }}>{tile.value}</div>
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

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: 16 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Pitch view</div>
                  <button style={{ ...secondaryBtn, padding: "8px 12px", width: isMobile ? "100%" : "auto" }} onClick={() => setPositionViewOpen((prev) => !prev)}>
                    Position View
                  </button>
                </div>
                {positionViewOpen && (
                  <div style={{ marginBottom: 10, background: t.panelAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: 10, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button style={{ ...secondaryBtn, padding: "6px 10px", fontSize: 12 }} onClick={() => setPositionViewShowAll((prev) => !prev)}>
                        {positionViewShowAll ? "Hide limited" : "Show all"}
                      </button>
                    </div>
                    {fSlots.map((spot) => (
                      <div key={`pv-${spot.internalCode}`} style={{ display: "grid", gridTemplateColumns: "96px minmax(0, 1fr)", gap: 8, alignItems: "start" }}>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{spot.displayCode} • {spot.displayName}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {!players.some((player) => {
                            const pref = prefValue(player.id, spot.internalCode);
                            return typeof pref === "number" && (positionViewShowAll || pref >= 2);
                          }) && <span style={{ color: t.muted, fontSize: 12 }}>No experienced or capable players</span>}
                          {players.map((player) => {
                            const value = prefValue(player.id, spot.internalCode);
                            const pref = typeof value === "number" ? value : null;
                            if (pref === null || (!positionViewShowAll && pref < 2)) return null;
                            const face = prefMeta(pref);
                            return (
                              <span key={`${spot.internalCode}-${player.id}`} style={{ background: face.bg, color: face.color, border: `1px solid ${face.border}`, borderRadius: 999, fontSize: 11, padding: "3px 8px", fontWeight: 700 }}>
                                {player.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isMobile && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: "block", fontSize: 13, color: t.muted, marginBottom: 6 }}>Marker size: {markerSize.toFixed(1)}</label>
                    <input type="range" min="1" max="5" step="0.5" value={markerSize} onChange={(e) => setMarkerSize(Number(e.target.value))} style={{ width: "100%", minHeight: 40 }} />
                  </div>
                )}
                <div ref={pitchWrapRef} style={{ position: "relative", background: t.fieldBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 8 }}>
                  <svg
                    viewBox="0 0 100 170"
                    style={{ width: "100%", display: "block", touchAction: "none", aspectRatio: "1 / 1.7", maxWidth: 520, margin: "0 auto" }}
                    onMouseMove={onPitchMove}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchMove={onPitchMove}
                    onTouchEnd={endDrag}
                    onTouchCancel={endDrag}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <rect x="0" y="0" width="100" height="170" fill="#1A56DB" />
                    <rect x="3" y="3" width="94" height="164" rx="1" fill="#2E7D32" stroke="#FFF" strokeWidth="1.2" />
                    {[3, 35.8, 68.6, 101.4, 134.2].map((y) => <rect key={y} x="3" y={y} width="94" height="16.4" fill="rgba(0,0,0,0.06)" />)}
                    <line x1="3" y1="44" x2="97" y2="44" stroke="#FFF" strokeWidth="1" />
                    <line x1="3" y1="85" x2="97" y2="85" stroke="#FFF" strokeWidth="1" />
                    <line x1="3" y1="126" x2="97" y2="126" stroke="#FFF" strokeWidth="1" />
                    <path d="M 22 3 A 25 25 0 0 0 47 28 L 53 28 A 25 25 0 0 0 78 3" fill="rgba(255,255,255,0.05)" stroke="#FFF" strokeWidth="1.2" />
                    <path d="M 22 167 A 25 25 0 0 1 47 142 L 53 142 A 25 25 0 0 1 78 167" fill="rgba(255,255,255,0.05)" stroke="#FFF" strokeWidth="1.2" />

                    {fSlots.map((spot) => {
                      const pos = pitchPos[spot.internalCode] || { x: spot.x, y: spot.y };
                      const pid = lineup[spot.internalCode];
                      const player = byId(pid);
                      const selectedSlot = isSelected("slot", spot.internalCode);
                      const locked = isLocked(spot.internalCode);
                      const playerPrefValue = player ? prefValue(player.id, spot.internalCode) : null;
                      const assignedRingColor = locked
                        ? "#EAB308"
                        : preferenceRingColor(typeof playerPrefValue === "number" ? playerPrefValue : null);
                      const selectedBenchPref = selectedBenchId ? prefValue(selectedBenchId, spot.internalCode) : null;
                      const slotRingColor = selectedBenchId
                        ? preferenceRingColor(typeof selectedBenchPref === "number" ? selectedBenchPref : null)
                        : assignedRingColor;
                      return (
                        <g key={spot.displayCode + spot.internalCode} style={{ cursor: dragging === spot.internalCode ? "grabbing" : "grab" }}>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={markerSize}
                            fill={selectedSlot ? t.accent : "#a855f7"}
                            stroke={slotRingColor}
                            strokeWidth={selectedSlot ? 1.7 : 1.1}
                            onClick={() => handleSelect("slot", spot.internalCode)}
                            onMouseDown={(e) => startDrag(spot.internalCode, e)}
                            onTouchStart={(e) => handleSlotTouchStart(spot.internalCode, e)}
                            onContextMenu={(e) => openSlotMenu(spot.internalCode, e)}
                          />
                          <text x={pos.x} y={pos.y + 0.7} textAnchor="middle" fontSize="2" fontWeight="700" fill="#fff" pointerEvents="none">{spot.displayCode}</text>
                          <text x={pos.x} y={pos.y + 8.2} textAnchor="middle" fontSize={player ? "3.1" : "2.5"} fontWeight={player ? "800" : "500"} fill="#000" pointerEvents="none">{player ? player.name : spot.displayName}</text>
                        </g>
                      );
                    })}
                  </svg>
                  {slotMenu && (
                    <div
                      style={{
                        position: "absolute",
                        left: Math.max(8, slotMenu.left - 48),
                        top: Math.max(8, slotMenu.top - 10),
                        background: t.panel,
                        border: `1px solid ${t.border}`,
                        borderRadius: 10,
                        boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                        padding: 6,
                        zIndex: 5,
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        style={{ ...secondaryBtn, padding: "8px 10px", width: "100%", textAlign: "left", border: "none", background: "transparent" }}
                        onClick={() => unassignSlot(slotMenu.slotCode)}
                      >
                        Remove player
                      </button>
                    </div>
                  )}
                </div>
                {!isMobile && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: "block", fontSize: 13, color: t.muted, marginBottom: 6 }}>Marker size: {markerSize.toFixed(1)}</label>
                    <input type="range" min="1" max="5" step="0.5" value={markerSize} onChange={(e) => setMarkerSize(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={card}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Starting 11</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
                    {fSlots.map((spot) => {
                      const pid = lineup[spot.internalCode];
                      const player = byId(pid);
                      const face = player ? prefMeta(prefScore(player.id, spot.internalCode)) : null;
                      const locked = isLocked(spot.internalCode);
                      return (
                        <div key={spot.displayCode + spot.internalCode} onClick={() => handleSelect("slot", spot.internalCode)} style={{ background: isSelected("slot", spot.internalCode) ? t.selection : t.panelAlt, border: `1px solid ${locked ? "#EAB308" : isSelected("slot", spot.internalCode) ? t.accent : t.border}`, borderRadius: 14, padding: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: t.muted, fontWeight: 700 }}>{spot.displayCode} • {spot.displayName}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{player ? player.name : "— Empty —"}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ background: face ? face.bg : t.panel, color: face ? face.color : t.text, border: `1px solid ${face ? face.border : t.border}`, borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                              {face ? <><face.Icon {...prefIconProps} /> {face.short}</> : "Empty"}
                            </div>
                            <button style={{ ...secondaryBtn, padding: "8px 10px", borderColor: locked ? "#EAB308" : t.border }} onClick={(e) => { e.stopPropagation(); toggleLock(spot.internalCode); }}>
                              {locked ? "🔒" : "🔓"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={card}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Substitutes</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {!benchPlayers.length && <div style={{ color: t.muted }}>No bench players.</div>}
                    {benchPlayers.map((player) => (
                      <div key={player.id} onClick={() => handleSelect("bench", player.id)} style={{ background: isSelected("bench", player.id) ? t.selection : t.panelAlt, border: `1px solid ${isSelected("bench", player.id) ? t.accent : t.border}`, borderRadius: 14, padding: 12, cursor: "pointer", fontWeight: 700 }}>
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Share" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Match Day Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea value={summaryText} onChange={(e) => setSummaryText(e.target.value)} style={{ ...input, minHeight: 260, fontFamily: "monospace", fontSize: 12 }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button style={primaryBtn} onClick={copySummary}>Copy summary</button>
                  <button style={secondaryBtn} onClick={loadSummary}>Load from summary</button>
                  <button style={secondaryBtn} onClick={copyCode}>Copy code</button>
                  <button style={secondaryBtn} onClick={copyLink}>Copy link</button>
                  <button style={secondaryBtn} onClick={copyReadOnlyLink}>Copy view-only link</button>
                  {!!shareNotice && <span style={{ color: t.muted, fontSize: 13, fontWeight: 700 }}>{shareNotice}</span>}
                </div>
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
