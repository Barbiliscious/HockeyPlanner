import { FORMATIONS, FORMATION_NAMES, SLOT_META } from '../data/positionModel';
import { PREF_LEVELS } from '../data/preferenceModel';
import * as XLSX from 'xlsx';

export function clampName(n) {
  return n.trim().replace(/\s+/g, " ");
}

export function nl(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\-]+/g, " ")
    .trim();
}

export function pk(playerId, slotCode) {
  return `${playerId}__${slotCode}`;
}

export function rebuildBulkImportText(players, preferences) {
  const headers = ["Player", ...SLOT_META.map((slot) => slot.displayCode)];
  const labelByValue = new Map(PREF_LEVELS.map((level) => [level.value, level.label]));
  const rows = (players || []).map((player) => [
    player.name,
    ...SLOT_META.map((slot) => {
      const value = preferences?.[pk(player.id, slot.code)];
      return typeof value === "number" ? String(value) : "";
    }),
  ]);

  return [headers, ...rows].map((row) => row.join("\t")).join("\n");
}

const parseLevel = (val) => {
  // Handle numeric 0 explicitly BEFORE nl() is called,
  // because nl() treats 0 as falsy and converts it to ""
  if (val === 0 || val === "0") return 0;

  const prefText = nl(val);
  if (prefText === "experienced" || prefText === "3") return 3;
  if (prefText === "capable" || prefText === "2") return 2;
  if (prefText === "limited" || prefText === "1") return 1;
  if (prefText === "uncomfortable") return 0;
  return null;
}

export function parseSpreadsheetData(aoa, players) {
  if (!aoa || aoa.length === 0) return { playersToAdd: [], prefUpdates: [], stats: { matched: 0, created: 0, updated: 0, skipped: 0, errors: [] } };

  const playersToAdd = [];
  const prefUpdates = [];
  const stats = { matched: 0, created: 0, updated: 0, skipped: 0, errors: [] };

  const slotMap = {};
  SLOT_META.forEach((s) => {
    slotMap[nl(s.code)] = s.code;
    slotMap[nl(s.displayCode)] = s.code;
    slotMap[nl(s.name)] = s.code;
  });

  const addPlayerIfMissing = (name) => {
    const clean = clampName(name);
    if (!clean) return null;
    const exists = players.some(p => nl(p.name) === nl(clean)) || playersToAdd.some(p => nl(p.name) === nl(clean));
    if (!exists) {
      playersToAdd.push({ name: clean, unavailable: false });
      stats.created++;
    } else if (players.some(p => nl(p.name) === nl(clean))) {
      stats.matched++;
    }
    return clean;
  };

  const headers = aoa[0].map(h => nl(h));
  const idx = {
    name: headers.findIndex((h) => h === "name" || h === "player"),
  };

  if (idx.name === -1) {
    stats.errors.push("Could not find 'Player' or 'Name' column header.");
    return { playersToAdd, prefUpdates, stats };
  }

  const colMap = {};
  let unknownCols = 0;
  headers.forEach((h, i) => {
    if (i === idx.name) return;
    if (slotMap[h]) {
      colMap[i] = slotMap[h];
    } else if (h) {
      unknownCols++;
    }
  });

  if (unknownCols > 0) {
    stats.errors.push(`Ignored ${unknownCols} unknown column(s).`);
  }

  aoa.slice(1).forEach((row) => {
    if (!row || row.length === 0 || !row[idx.name] || String(row[idx.name]).includes("=")) {
      stats.skipped++;
      return;
    }

    const name = addPlayerIfMissing(String(row[idx.name]) || "");
    if (!name) {
      stats.skipped++;
      return;
    }
    
    row.forEach((val, i) => {
      if (i === idx.name || val === undefined || val === null || val === "") return;
      const slotCode = colMap[i];
      if (slotCode) {
        const level = parseLevel(val);
        if (level !== null) {
          prefUpdates.push({ name, slotCode, value: level });
          stats.updated++;
        }
      }
    });
  });

  return { playersToAdd, prefUpdates, stats };
}

export function exportToExcel(players, type, preferences = {}) {
  const headers = ["Player", ...SLOT_META.map(s => s.displayCode)];
  const aoa = [headers];

  if (type === "current") {
    players.forEach((player) => {
      const row = [player.name];
      SLOT_META.forEach((slot) => {
        const key = pk(player.id, slot.code);
        const val = preferences[key];
        row.push(typeof val === "number" ? val : "");
      });
      aoa.push(row);
    });
  } else {
    aoa.push(Array(headers.length).fill(""));
    aoa.push(Array(headers.length).fill(""));
    aoa.push(Array(headers.length).fill(""));
  }

  const guide = [
    ["Legend"],
    ["Value", "Meaning"],
    [3, "Experienced"],
    [2, "Capable"],
    [1, "Limited"],
    [0, "Uncomfortable"],
    [],
    [],
    ["Position Code Guide"],
    ["Code", "Position"],
    ...SLOT_META.map((slot) => [slot.code, slot.name]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const guideWs = XLSX.utils.aoa_to_sheet(guide);
  XLSX.utils.book_append_sheet(wb, ws, "Squad");
  XLSX.utils.book_append_sheet(wb, guideWs, "Guide");
  const filename = type === "current" ? "Current_Squad_Template.xlsx" : "Blank_Template.xlsx";
  XLSX.writeFile(wb, filename);
}

export function encodeState(state) {
  try {
    const jsonString = JSON.stringify(state);
    const bytes = new TextEncoder().encode(jsonString);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
    return btoa(binString);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function decodeState(code) {
  try {
    const binString = atob(code.trim());
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function exportMatchdaySummary(formation, fSlots, lineup, byId, benchPlayers) {
  const startingLines = fSlots.map((spot) => {
    const pid = lineup[spot.internalCode];
    const player = byId(pid);
    return `${spot.displayCode} - ${spot.displayName}: ${player ? player.name : "— Empty —"}`;
  });

  const substitutes = benchPlayers.length ? benchPlayers.map((player) => player.name) : ["None"];

  return [
    `Formation: ${formation}`,
    "",
    "Starting 11:",
    ...startingLines,
    "",
    "Substitutes:",
    ...substitutes,
  ].join("\n");
}

const normalizeSummaryName = (value) => clampName(String(value || "")).toLowerCase();
const isEmptySummarySlot = (value) => /^[-—]\s*empty\s*[-—]$/i.test(String(value || "").trim());

export function parseMatchdaySummary(summaryText, players) {
  const lines = String(summaryText || "").split(/\r?\n/);
  const formationLine = lines.find((line) => line.trim().toLowerCase().startsWith("formation:"));
  if (!formationLine) return null;

  const formation = formationLine.slice(formationLine.indexOf(":") + 1).trim();
  if (!FORMATION_NAMES.includes(formation)) return null;

  const startingIndex = lines.findIndex((line) => line.trim().toLowerCase() === "starting 11:");
  const substitutesIndex = lines.findIndex((line) => line.trim().toLowerCase() === "substitutes:");
  if (startingIndex === -1 || substitutesIndex === -1 || substitutesIndex <= startingIndex) return null;

  const nameToPlayer = new Map(players.map((player) => [normalizeSummaryName(player.name), player]));
  const slots = FORMATIONS[formation];
  const slotByLabel = new Map();
  slots.forEach((spot) => {
    slotByLabel.set(`${nl(spot.displayCode)}|${nl(spot.displayName)}`, spot);
  });

  const lineup = Object.fromEntries(slots.map((spot) => [spot.internalCode, null]));
  const seenSlots = new Set();
  const assignedPlayers = new Set();

  for (const rawLine of lines.slice(startingIndex + 1, substitutesIndex)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^(.+?)\s+-\s+(.+?):\s*(.+)$/);
    if (!match) return null;

    const [, displayCode, displayName, playerName] = match;
    const slot = slotByLabel.get(`${nl(displayCode)}|${nl(displayName)}`);
    if (!slot || seenSlots.has(slot.internalCode)) return null;
    seenSlots.add(slot.internalCode);

    if (isEmptySummarySlot(playerName)) continue;

    const player = nameToPlayer.get(normalizeSummaryName(playerName));
    if (!player || assignedPlayers.has(player.id)) return null;
    lineup[slot.internalCode] = player.id;
    assignedPlayers.add(player.id);
  }

  if (seenSlots.size !== slots.length) return null;

  const substituteNames = lines
    .slice(substitutesIndex + 1)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!substituteNames.length) return null;

  if (!(substituteNames.length === 1 && substituteNames[0].toLowerCase() === "none")) {
    const seenSubs = new Set();
    for (const name of substituteNames) {
      const player = nameToPlayer.get(normalizeSummaryName(name));
      if (!player || assignedPlayers.has(player.id) || seenSubs.has(player.id)) return null;
      seenSubs.add(player.id);
    }
  }

  return { formation, lineup };
}
