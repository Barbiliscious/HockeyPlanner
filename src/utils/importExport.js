import { SLOT_META } from '../data/positionModel';
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

const parseLevel = (val) => {
  const prefText = nl(val);
  if (prefText === "experienced" || prefText === "3") return 3;
  if (prefText === "capable" || prefText === "2") return 2;
  if (prefText === "limited" || prefText === "1") return 1;
  if (prefText === "uncomfortable" || prefText === "0") return 0;
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
      playersToAdd.push({ name: clean });
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

export function exportToExcel(players, type) {
  const headers = ["Player", ...SLOT_META.map(s => s.displayCode)];
  const aoa = [headers];

  if (type === "current") {
    players.forEach((player) => {
      const row = [player.name];
      SLOT_META.forEach(() => {
        row.push(1);
      });
      aoa.push(row);
    });
  } else {
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
  }

  aoa.push([]);
  aoa.push(["Legend:"]);
  aoa.push(["3 = Experienced"]);
  aoa.push(["2 = Capable"]);
  aoa.push(["1 = Limited"]);
  aoa.push(["0 = Uncomfortable"]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, "Squad");
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

export function exportMatchdaySummary(fSlots, lineup, byId) {
  return fSlots
    .map((spot) => {
      const pid = lineup[spot.internalCode];
      const player = byId(pid);
      return `${spot.displayCode} - ${spot.displayName}: ${player ? player.name : "Empty"}`;
    })
    .join("\n");
}
